/**
 * FoodSense AI — HTTP application.
 * All routes live under /api; anything else is served from the built frontend.
 */
import { createServer } from "node:http";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Router, HttpError, fail, send, readJson, securityHeaders, cors, rateLimiter, staticFiles } from "./lib/http.js";
import { hashPassword, verifyPassword, signToken, identify, publicUser, requireUser, requireStaff, requireAdmin } from "./lib/auth.js";
import { createStore } from "./db.js";
import { createEventHub } from "./events.js";
import { buildSeed } from "./seed.js";
import { analyze, loadModel } from "./sentiment.js";
import { createStats, listDishes, withStats, priceOrder, advance, analytics, ACTIVE, TABLE_COUNT } from "./services.js";

const here = dirname(fileURLToPath(import.meta.url));
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PAYMENT_METHODS = ["upi", "card", "cash"];
const str = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function createApp({ dbPath, staticDir = join(here, "../../frontend/dist"), seed = true } = {}) {
  const db = createStore(dbPath);
  if (seed && db.isEmpty) {
    db.replaceAll(buildSeed());
    console.log(`🌱 Seeded database with ${db.dishes.length} dishes, ${db.reviews.length} reviews, ${db.orders.length} orders`);
  }
  const stats = createStats(db);
  const hub = createEventHub();
  const r = new Router();
  const limitAuth = rateLimiter({ windowMs: 15 * 60_000, max: 40 });
  const limitWrite = rateLimiter({ windowMs: 60_000, max: 60 });
  const serveStatic = staticFiles(staticDir);
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5000").split(",").map((s) => s.trim());
  const startedAt = Date.now();

  const orderView = (o) => o && { ...o };
  const emitOrder = (o) => {
    stats.invalidate();
    hub.publish("order", orderView(o));
  };

  /* ------------------------------ meta ------------------------------ */
  r.get("/api/health", () => ({
    status: "ok",
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    dishes: db.dishes.length,
    orders: db.orders.length,
    liveConnections: hub.size,
  }));

  r.get("/api/meta", () => {
    const { metrics } = loadModel();
    const counts = new Map();
    for (const d of db.dishes) counts.set(d.category, (counts.get(d.category) || 0) + 1);
    return {
      restaurant: { name: "FoodSense Kitchen", city: "Bengaluru", tables: TABLE_COUNT, gstRate: 0.05, currency: "INR" },
      categories: [...counts].map(([name, count]) => ({ name, count })),
      model: { engine: process.env.AI_SERVICE_URL ? "tflite-rnn (with naive-bayes fallback)" : "naive-bayes", ...metrics },
    };
  });

  /* ------------------------------ auth ------------------------------ */
  r.post("/api/auth/register", (req, body) => {
    limitAuth(req);
    const name = str(body.name, 60);
    const email = str(body.email, 120).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const errors = {};
    if (name.length < 2) errors.name = "Tell us your name.";
    if (!EMAIL.test(email)) errors.email = "Enter a valid email address.";
    if (password.length < 6) errors.password = "Use at least 6 characters.";
    if (Object.keys(errors).length) fail(422, "Please fix the highlighted fields.", errors);
    if (db.users.some((u) => u.email === email)) fail(409, "An account with this email already exists.", { email: "Already registered — try signing in." });
    const user = { id: db.id(), name, email, role: "customer", passwordHash: hashPassword(password), createdAt: new Date().toISOString() };
    db.users.push(user);
    db.save();
    return [201, { user: publicUser(user), token: signToken({ sub: user.id, role: user.role }) }];
  });

  r.post("/api/auth/login", (req, body) => {
    limitAuth(req);
    const email = str(body.email, 120).toLowerCase();
    const user = db.users.find((u) => u.email === email);
    if (!user || !verifyPassword(String(body.password || ""), user.passwordHash)) fail(401, "Email or password is incorrect.");
    return { user: publicUser(user), token: signToken({ sub: user.id, role: user.role }) };
  });

  r.get("/api/auth/me", (req) => {
    requireUser(req);
    return { user: req.user };
  });

  /* ------------------------------ menu ------------------------------ */
  r.get("/api/dishes", (req) => {
    const list = listDishes(db, stats, req.query);
    return { count: list.length, dishes: list };
  });

  r.get("/api/dishes/:id", (req) => {
    const dish = db.dishes.find((d) => d.id === req.params.id);
    if (!dish) fail(404, "Dish not found.");
    const reviews = db.reviews.filter((x) => x.dishId === dish.id).slice(0, 30);
    const pairs = new Map();
    for (const o of db.orders) {
      if (!o.items.some((i) => i.dishId === dish.id)) continue;
      for (const i of o.items) if (i.dishId !== dish.id) pairs.set(i.dishId, (pairs.get(i.dishId) || 0) + 1);
    }
    const pairsWith = [...pairs].sort((a, b) => b[1] - a[1]).slice(0, 4)
      .map(([id]) => db.dishes.find((d) => d.id === id)).filter(Boolean).map((d) => withStats(d, stats));
    return { dish: withStats(dish, stats), reviews, pairsWith };
  });

  r.patch("/api/dishes/:id", (req, body) => {
    requireAdmin(req);
    const dish = db.dishes.find((d) => d.id === req.params.id);
    if (!dish) fail(404, "Dish not found.");
    if (typeof body.available === "boolean") dish.available = body.available;
    if (body.price != null) {
      const p = Number(body.price);
      if (!Number.isFinite(p) || p < 1 || p > 10000) fail(422, "Price must be between ₹1 and ₹10,000.");
      dish.price = Math.round(p);
    }
    db.save();
    stats.invalidate();
    hub.publish("menu", { id: dish.id, available: dish.available, price: dish.price });
    return { dish: withStats(dish, stats) };
  });

  /* ----------------------------- orders ----------------------------- */
  r.post("/api/orders", (req, body) => {
    limitWrite(req);
    const table = Number(body.tableNumber);
    if (!Number.isInteger(table) || table < 1 || table > TABLE_COUNT) fail(422, `Choose a table between 1 and ${TABLE_COUNT}.`, { tableNumber: "Invalid table" });
    const paymentMethod = PAYMENT_METHODS.includes(body.paymentMethod) ? body.paymentMethod : fail(422, "Choose a payment method.");
    const priced = priceOrder(db, body.items);
    const now = new Date().toISOString();
    const order = {
      id: db.id(),
      code: db.nextOrderCode(),
      tableNumber: String(table),
      customerName: str(body.customerName, 60) || req.user?.name || `Table ${table}`,
      userId: req.user?.id || null,
      ...priced,
      paymentMethod,
      // Demo payment: UPI/card are marked paid immediately; cash is settled when served.
      paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
      status: "placed",
      notes: str(body.notes, 280),
      timeline: [{ status: "placed", at: now }],
      createdAt: now,
      updatedAt: now,
    };
    db.orders.unshift(order);
    db.save();
    emitOrder(order);
    return [201, { order }];
  });

  r.get("/api/orders", (req) => {
    requireStaff(req);
    const scope = req.query.scope || "active";
    let list = db.orders;
    if (scope === "active") list = list.filter((o) => ACTIVE.has(o.status));
    else if (scope === "today") {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      list = list.filter((o) => Date.parse(o.createdAt) >= start.getTime());
    }
    return { orders: list.slice(0, Number(req.query.limit) || 100) };
  });

  r.get("/api/orders/mine", (req) => {
    requireUser(req);
    const ids = String(req.query.ids || "").split(",").filter(Boolean);
    return { orders: db.orders.filter((o) => o.userId === req.user.id || ids.includes(o.id)).slice(0, 50) };
  });

  // Guests track orders by id (UUIDs are unguessable) — used after QR checkout.
  r.get("/api/orders/lookup", (req) => {
    const ids = String(req.query.ids || "").split(",").filter(Boolean).slice(0, 50);
    return { orders: db.orders.filter((o) => ids.includes(o.id)) };
  });

  r.get("/api/orders/:id", (req) => {
    const order = db.orders.find((o) => o.id === req.params.id || o.code === req.params.id);
    if (!order) fail(404, "Order not found.");
    const ahead = db.orders.filter((o) => ACTIVE.has(o.status) && o.createdAt < order.createdAt).length;
    return { order, queuePosition: ACTIVE.has(order.status) ? ahead + 1 : 0 };
  });

  r.patch("/api/orders/:id/status", (req, body) => {
    requireStaff(req);
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) fail(404, "Order not found.");
    advance(order, String(body.status), "staff");
    db.save();
    emitOrder(order);
    return { order };
  });

  r.post("/api/orders/:id/cancel", (req) => {
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) fail(404, "Order not found.");
    advance(order, "cancelled", "customer");
    db.save();
    emitOrder(order);
    return { order };
  });

  /* ----------------------------- reviews ---------------------------- */
  r.get("/api/reviews", (req) => {
    let list = db.reviews;
    if (req.query.dishId) list = list.filter((x) => x.dishId === req.query.dishId);
    if (req.query.sentiment) list = list.filter((x) => x.sentiment === req.query.sentiment);
    return { reviews: list.slice(0, Number(req.query.limit) || 50) };
  });

  r.post("/api/reviews", async (req, body) => {
    limitWrite(req);
    const dish = db.dishes.find((d) => d.id === body.dishId);
    if (!dish) fail(422, "Pick the dish you're reviewing.");
    const rating = Math.round(Number(body.rating));
    if (!(rating >= 1 && rating <= 5)) fail(422, "Rating must be 1–5 stars.", { rating: "Choose a rating" });
    const text = str(body.text, 1000);
    if (text.length < 4) fail(422, "Write a few words about the dish.", { text: "Too short" });
    const ai = await analyze(text, rating);
    const review = {
      id: db.id(),
      dishId: dish.id,
      dishName: dish.name,
      orderId: str(body.orderId, 64) || null,
      userId: req.user?.id || null,
      name: str(body.name, 60) || req.user?.name || "Guest",
      rating,
      text,
      ...ai,
      source: "customer",
      createdAt: new Date().toISOString(),
    };
    db.reviews.unshift(review);
    db.save();
    stats.invalidate();
    hub.publish("review", review);
    return [201, { review, dish: withStats(dish, stats) }];
  });

  r.post("/api/sentiment", async (req, body) => {
    limitWrite(req);
    const text = str(body.text, 1000);
    if (!text) fail(422, "Text is required.");
    return analyze(text, body.rating == null ? undefined : Number(body.rating));
  });

  /* ---------------------------- analytics --------------------------- */
  r.get("/api/analytics", (req) => {
    requireStaff(req);
    return analytics(db, stats);
  });

  r.get("/api/tables", () => {
    const active = db.orders.filter((o) => ACTIVE.has(o.status));
    return {
      tables: Array.from({ length: TABLE_COUNT }, (_, i) => {
        const n = String(i + 1);
        const orders = active.filter((o) => o.tableNumber === n);
        return { number: n, busy: orders.length > 0, activeOrders: orders.length };
      }),
    };
  });

  /* ------------------------------ live ------------------------------ */
  r.get("/api/events", (req, _body, res) => {
    const orderIds = new Set(String(req.query.orders || "").split(",").filter(Boolean));
    const staff = req.user && ["admin", "kitchen"].includes(req.user.role);
    hub.subscribe(req, res, (event, payload) => {
      if (staff) return true;
      if (event === "menu") return true;
      if (event === "order") return orderIds.has(payload.id);
      return false;
    });
    return res; // streaming — handled
  });

  /* ----------------------------- server ----------------------------- */
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    req.query = Object.fromEntries(url.searchParams);
    securityHeaders(res);
    cors(req, res, allowedOrigins);
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

    const started = Date.now();
    if (process.env.LOG_REQUESTS !== "false" && url.pathname.startsWith("/api/") && url.pathname !== "/api/events") {
      res.on("finish", () => console.log(`${req.method} ${url.pathname} → ${res.statusCode} ${Date.now() - started}ms`));
    }
    try {
      if (!url.pathname.startsWith("/api/")) {
        if (serveStatic(req, res)) return;
        return send(res, 404, { error: "Frontend not built. Run `npm run build` in /frontend." });
      }
      const { route, params, pathMatched } = r.match(req.method, url.pathname);
      if (!route) fail(pathMatched ? 405 : 404, pathMatched ? "Method not allowed" : "API endpoint not found");
      req.params = params;
      req.user = identify(req, db);
      const body = await readJson(req);
      let result;
      for (const h of route.handlers) result = await h(req, body, res);
      if (result === res) return;
      if (Array.isArray(result)) send(res, result[0], result[1]);
      else send(res, 200, result);
    } catch (err) {
      if (err instanceof HttpError) send(res, err.status, { error: err.message, details: err.details });
      else {
        console.error(err);
        send(res, 500, { error: "Something went wrong on our side." });
      }
    }
  });

  server.on("close", () => {
    hub.closeAll();
    db.close();
  });

  return { server, db, hub };
}
