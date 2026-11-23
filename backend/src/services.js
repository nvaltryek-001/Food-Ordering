/**
 * Domain logic: dish statistics, order pricing/lifecycle and analytics.
 */
import { fail } from "./lib/http.js";

export const ORDER_FLOW = ["placed", "preparing", "ready", "served"];
export const ACTIVE = new Set(["placed", "preparing", "ready"]);
export const GST_RATE = 0.05;
export const TABLE_COUNT = Number(process.env.TABLE_COUNT || 20);

/** Aggregates reviews + orders into per-dish stats (memoised per data version). */
export function createStats(db) {
  let cache = null;
  let version = 0;
  const invalidate = () => { version++; cache = null; };

  const compute = () => {
    const stats = new Map();
    for (const d of db.dishes) stats.set(d.id, { rating: 0, reviewCount: 0, aiScore: null, sentiment: { positive: 0, neutral: 0, negative: 0 }, ordered: 0, _r: 0, _s: 0 });
    for (const r of db.reviews) {
      const s = stats.get(r.dishId);
      if (!s) continue;
      s.reviewCount++;
      s._r += r.rating;
      s._s += r.score;
      s.sentiment[r.sentiment]++;
    }
    for (const o of db.orders) {
      if (o.status === "cancelled") continue;
      for (const it of o.items) {
        const s = stats.get(it.dishId);
        if (s) s.ordered += it.qty;
      }
    }
    for (const s of stats.values()) {
      if (s.reviewCount) {
        // Bayesian average keeps a single 5★ review from topping the charts.
        s.rating = +((s._r + 4.2 * 3) / (s.reviewCount + 3)).toFixed(1);
        s.aiScore = Math.round(s._s / s.reviewCount);
      } else {
        s.rating = 4.2;
      }
      delete s._r;
      delete s._s;
    }
    return stats;
  };

  return {
    invalidate,
    get version() { return version; },
    get(id) {
      if (!cache) cache = compute();
      return cache.get(id);
    },
  };
}

export const withStats = (dish, stats) => ({ ...dish, ...stats.get(dish.id) });

export function listDishes(db, stats, { category, q, veg, sort, tag } = {}) {
  let list = db.dishes.map((d) => withStats(d, stats));
  if (category && category !== "All") list = list.filter((d) => d.category === category);
  if (veg === "true" || veg === "veg") list = list.filter((d) => d.veg);
  if (veg === "nonveg") list = list.filter((d) => !d.veg);
  if (tag) list = list.filter((d) => d.tags.includes(tag));
  if (q) {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    list = list.filter((d) => {
      const hay = `${d.name} ${d.category} ${d.description} ${d.tags.join(" ")}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  const sorters = {
    popular: (a, b) => b.ordered - a.ordered,
    rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
    ai: (a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    quick: (a, b) => a.prepMinutes - b.prepMinutes,
  };
  if (sorters[sort]) list.sort(sorters[sort]);
  return list;
}

export function priceOrder(db, rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) fail(400, "Your cart is empty.");
  if (rawItems.length > 40) fail(400, "Too many different items in one order.");
  const merged = new Map();
  for (const it of rawItems) {
    const qty = Math.floor(Number(it?.qty ?? it?.quantity));
    if (!it?.dishId || !Number.isFinite(qty) || qty < 1 || qty > 20) fail(400, "Each item needs a dishId and a quantity between 1 and 20.");
    merged.set(it.dishId, (merged.get(it.dishId) || 0) + qty);
  }
  const items = [];
  for (const [dishId, qty] of merged) {
    const d = db.dishes.find((x) => x.id === dishId);
    if (!d) fail(400, `Unknown dish: ${dishId}`);
    if (!d.available) fail(409, `${d.name} is sold out right now.`);
    items.push({ dishId, name: d.name, emoji: d.emoji, veg: d.veg, price: d.price, qty });
  }
  const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
  const tax = Math.round(subtotal * GST_RATE);
  const prep = Math.max(...items.map((x) => db.dishes.find((d) => d.id === x.dishId).prepMinutes));
  const queue = db.orders.filter((o) => ACTIVE.has(o.status)).length;
  return { items, subtotal, tax, total: subtotal + tax, etaMinutes: prep + Math.min(15, queue * 2) + items.length };
}

export function advance(order, status, actor) {
  if (status === "cancelled") {
    if (!["placed"].includes(order.status) && actor !== "staff") fail(409, "This order is already being prepared and can't be cancelled.");
    if (order.status === "served") fail(409, "Served orders can't be cancelled.");
  } else {
    const from = ORDER_FLOW.indexOf(order.status);
    const to = ORDER_FLOW.indexOf(status);
    if (to === -1) fail(400, `Unknown status: ${status}`);
    if (from === -1 || to <= from) fail(409, `Order is already ${order.status}.`);
  }
  const at = new Date().toISOString();
  order.status = status;
  order.updatedAt = at;
  order.timeline.push({ status, at });
  if (status === "served" && order.paymentMethod === "cash") order.paymentStatus = "paid";
  return order;
}

export function analytics(db, stats, now = Date.now()) {
  const dayKey = (iso) => iso.slice(0, 10);
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const todayStart = start.getTime();
  const valid = db.orders.filter((o) => o.status !== "cancelled");
  const today = valid.filter((o) => Date.parse(o.createdAt) >= todayStart);
  const yesterday = valid.filter((o) => {
    const t = Date.parse(o.createdAt);
    return t >= todayStart - 864e5 && t < now - 864e5;
  });

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(todayStart - i * 864e5);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ date: key, label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }), revenue: 0, orders: 0 });
  }
  const byDay = new Map(days.map((d) => [d.date, d]));
  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: 0 }));
  const categories = new Map();
  const dishCounts = new Map();
  for (const o of valid) {
    const local = new Date(o.createdAt);
    const key = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
    const d = byDay.get(key);
    if (d) { d.revenue += o.total; d.orders++; }
    hourly[local.getHours()].orders++;
    for (const it of o.items) {
      const dish = db.dishes.find((x) => x.id === it.dishId);
      const cat = dish?.category || "Other";
      categories.set(cat, (categories.get(cat) || 0) + it.price * it.qty);
      const c = dishCounts.get(it.dishId) || { dishId: it.dishId, name: it.name, emoji: it.emoji, qty: 0, revenue: 0 };
      c.qty += it.qty;
      c.revenue += it.price * it.qty;
      dishCounts.set(it.dishId, c);
    }
  }

  const sentiment = { positive: 0, neutral: 0, negative: 0 };
  for (const r of db.reviews) sentiment[r.sentiment]++;
  const reviewed = db.dishes.map((d) => withStats(d, stats)).filter((d) => d.reviewCount >= 3);
  const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
  const revenueToday = sum(today, (o) => o.total);
  const revenueYesterday = sum(yesterday, (o) => o.total);

  return {
    kpis: {
      revenueToday,
      revenueChange: revenueYesterday ? (revenueToday - revenueYesterday) / revenueYesterday : null,
      ordersToday: today.length,
      ordersChange: yesterday.length ? (today.length - yesterday.length) / yesterday.length : null,
      avgOrderValue: today.length ? Math.round(revenueToday / today.length) : 0,
      activeOrders: db.orders.filter((o) => ACTIVE.has(o.status)).length,
      reviewCount: db.reviews.length,
      satisfaction: db.reviews.length ? Math.round((sentiment.positive / db.reviews.length) * 100) : 0,
    },
    revenueByDay: days,
    ordersByHour: hourly,
    categoryRevenue: [...categories].map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue),
    topDishes: [...dishCounts.values()].sort((a, b) => b.qty - a.qty).slice(0, 8),
    sentiment,
    loved: [...reviewed].sort((a, b) => b.aiScore - a.aiScore).slice(0, 5),
    needsAttention: [...reviewed].sort((a, b) => a.aiScore - b.aiScore).slice(0, 5),
    recentReviews: db.reviews.slice(0, 8),
  };
}
