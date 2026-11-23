import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

process.env.LOG_REQUESTS = "false";
let server, base;

before(async () => {
  ({ server } = createApp({ dbPath: ":memory:", staticDir: "/nonexistent" }));
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.closeAllConnections(); server.close(); });

const api = async (path, { method = "GET", body, token } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
};

test("health and meta", async () => {
  const h = await api("/api/health");
  assert.equal(h.status, 200);
  assert.ok(h.data.dishes > 200);
  const m = await api("/api/meta");
  assert.ok(m.data.categories.length >= 10);
  assert.ok(m.data.model.accuracy > 0.75, "model accuracy should be reported");
});

test("menu filtering, search and sorting", async () => {
  const veg = await api("/api/dishes?veg=veg");
  assert.ok(veg.data.dishes.every((d) => d.veg));
  const q = await api("/api/dishes?q=dosa");
  assert.ok(q.data.count > 5 && q.data.dishes.every((d) => /dosa/i.test(d.name + d.description)));
  const sorted = await api("/api/dishes?sort=price-asc");
  const prices = sorted.data.dishes.map((d) => d.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  const one = await api("/api/dishes/masala-dosa");
  assert.equal(one.data.dish.name, "Masala Dosa");
  assert.ok(Array.isArray(one.data.reviews));
  assert.equal((await api("/api/dishes/nope")).status, 404);
});

test("register, login and me", async () => {
  const bad = await api("/api/auth/register", { method: "POST", body: { name: "x", email: "bad", password: "1" } });
  assert.equal(bad.status, 422);
  assert.ok(bad.data.details.email);
  const reg = await api("/api/auth/register", { method: "POST", body: { name: "Test User", email: "t@example.com", password: "secret1" } });
  assert.equal(reg.status, 201);
  const dup = await api("/api/auth/register", { method: "POST", body: { name: "Test User", email: "t@example.com", password: "secret1" } });
  assert.equal(dup.status, 409);
  const wrong = await api("/api/auth/login", { method: "POST", body: { email: "t@example.com", password: "nope" } });
  assert.equal(wrong.status, 401);
  const me = await api("/api/auth/me", { token: reg.data.token });
  assert.equal(me.data.user.email, "t@example.com");
  assert.equal(me.data.user.passwordHash, undefined);
  assert.equal((await api("/api/auth/me", { token: "forged.token.value" })).status, 401);
});

test("guest order lifecycle with server-side pricing", async () => {
  const placed = await api("/api/orders", {
    method: "POST",
    body: { tableNumber: 7, paymentMethod: "upi", items: [{ dishId: "masala-dosa", qty: 2, price: 1 }, { dishId: "filter-coffee", qty: 1 }] },
  });
  assert.equal(placed.status, 201);
  const o = placed.data.order;
  assert.equal(o.status, "placed");
  assert.equal(o.subtotal, 2 * 89 + 35, "prices come from the menu, not the client");
  assert.equal(o.tax, Math.round(o.subtotal * 0.05));

  // customers cannot advance status; staff can
  assert.equal((await api(`/api/orders/${o.id}/status`, { method: "PATCH", body: { status: "preparing" } })).status, 401);
  const login = await api("/api/auth/login", { method: "POST", body: { email: "kitchen@foodsense.ai", password: "kitchen123" } });
  const token = login.data.token;
  for (const s of ["preparing", "ready", "served"]) {
    const res = await api(`/api/orders/${o.id}/status`, { method: "PATCH", token, body: { status: s } });
    assert.equal(res.data.order.status, s);
  }
  const back = await api(`/api/orders/${o.id}/status`, { method: "PATCH", token, body: { status: "preparing" } });
  assert.equal(back.status, 409, "status can only move forward");
  const tracked = await api(`/api/orders/${o.id}`);
  assert.equal(tracked.data.order.timeline.length, 4);
});

test("order validation", async () => {
  assert.equal((await api("/api/orders", { method: "POST", body: { tableNumber: 99, paymentMethod: "upi", items: [{ dishId: "masala-dosa", qty: 1 }] } })).status, 422);
  assert.equal((await api("/api/orders", { method: "POST", body: { tableNumber: 3, paymentMethod: "upi", items: [] } })).status, 400);
  assert.equal((await api("/api/orders", { method: "POST", body: { tableNumber: 3, paymentMethod: "upi", items: [{ dishId: "ghost", qty: 1 }] } })).status, 400);
});

test("reviews are scored by the sentiment model and update dish stats", async () => {
  const before = (await api("/api/dishes/paneer-butter-masala")).data.dish;
  const res = await api("/api/reviews", { method: "POST", body: { dishId: "paneer-butter-masala", rating: 5, text: "Absolutely delicious, rich gravy and super fresh. Loved it!" } });
  assert.equal(res.status, 201);
  assert.equal(res.data.review.sentiment, "positive");
  assert.equal(res.data.dish.reviewCount, before.reviewCount + 1);
  const neg = await api("/api/sentiment", { method: "POST", body: { text: "Cold, bland and the service was terribly slow." } });
  assert.equal(neg.data.sentiment, "negative");
});

test("analytics and admin menu control are staff-only", async () => {
  assert.equal((await api("/api/analytics")).status, 401);
  const guest = await api("/api/auth/login", { method: "POST", body: { email: "guest@foodsense.ai", password: "guest123" } });
  assert.equal((await api("/api/analytics", { token: guest.data.token })).status, 403);
  const admin = await api("/api/auth/login", { method: "POST", body: { email: "admin@foodsense.ai", password: "admin123" } });
  const a = await api("/api/analytics", { token: admin.data.token });
  assert.equal(a.status, 200);
  assert.equal(a.data.revenueByDay.length, 14);
  assert.ok(a.data.topDishes.length > 0);
  const off = await api("/api/dishes/jalebi", { method: "PATCH", token: admin.data.token, body: { available: false } });
  assert.equal(off.data.dish.available, false);
  const sold = await api("/api/orders", { method: "POST", body: { tableNumber: 2, paymentMethod: "cash", items: [{ dishId: "jalebi", qty: 1 }] } });
  assert.equal(sold.status, 409);
});

test("live order events reach a subscribed customer", async () => {
  const placed = await api("/api/orders", { method: "POST", body: { tableNumber: 4, paymentMethod: "card", items: [{ dishId: "idli-sambar", qty: 1 }] } });
  const id = placed.data.order.id;
  const ctrl = new AbortController();
  const res = await fetch(`${base}/api/events?orders=${id}`, { signal: ctrl.signal });
  assert.equal(res.headers.get("content-type"), "text/event-stream");
  const reader = res.body.getReader();
  const login = await api("/api/auth/login", { method: "POST", body: { email: "kitchen@foodsense.ai", password: "kitchen123" } });
  await api(`/api/orders/${id}/status`, { method: "PATCH", token: login.data.token, body: { status: "preparing" } });
  let text = "";
  while (!text.includes("event: order")) text += new TextDecoder().decode((await reader.read()).value);
  assert.match(text, /"status":"preparing"/);
  ctrl.abort();
});
