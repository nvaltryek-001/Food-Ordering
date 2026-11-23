/** Latency benchmark against a local server. node scripts/benchmark.js  (starts its own in-memory instance) */
import { createApp } from "../src/app.js";
import { writeFileSync } from "node:fs";
import os from "node:os";

process.env.LOG_REQUESTS = "false";
const { server } = createApp({ dbPath: ":memory:", staticDir: "/nonexistent" });
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
let ip = 0;
const call = async (path, opts = {}) => {
  const t = performance.now();
  const res = await fetch(base + path, { ...opts, headers: { "content-type": "application/json", "x-forwarded-for": `10.0.${(ip >> 8) & 255}.${ip++ & 255}`, "accept-encoding": "gzip", ...(opts.headers || {}) } });
  const body = await res.json();
  return { ms: performance.now() - t, body, status: res.status };
};
const stats = (a) => { const s = [...a].sort((x, y) => x - y); const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))]; return { mean: a.reduce((x, y) => x + y, 0) / a.length, p50: q(0.5), p95: q(0.95), n: a.length }; };

for (let i = 0; i < 20; i++) await call("/api/dishes"); // warm-up
const N = 300, res = {};
const menu = []; for (let i = 0; i < N; i++) menu.push((await call("/api/dishes")).ms); res.menu = stats(menu);
const detail = []; for (let i = 0; i < N; i++) detail.push((await call("/api/dishes/masala-dosa")).ms); res.dishDetail = stats(detail);
const orders = [], ids = [];
for (let i = 0; i < N; i++) {
  const r = await call("/api/orders", { method: "POST", body: JSON.stringify({ tableNumber: 1 + (i % 20), paymentMethod: "upi", items: [{ dishId: "masala-dosa", qty: 1 }, { dishId: "filter-coffee", qty: 2 }] }) });
  orders.push(r.ms); ids.push(r.body.order.id);
}
res.placeOrder = stats(orders);
const reviews = []; for (let i = 0; i < N; i++) reviews.push((await call("/api/reviews", { method: "POST", body: JSON.stringify({ dishId: "masala-dosa", rating: 4, text: "Crispy and fresh, the chutney was lovely but service was a bit slow." }) })).ms); res.postReview = stats(reviews);
const login = (await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "admin@foodsense.ai", password: "admin123" }) })).body.token;
const an = []; for (let i = 0; i < 100; i++) an.push((await call("/api/analytics", { headers: { authorization: `Bearer ${login}` } })).ms); res.analytics = stats(an);

// SSE propagation: staff PATCH → event arrives at the diner's stream
const sse = [];
for (let i = 0; i < 100; i++) {
  const id = ids[i];
  const ctrl = new AbortController();
  const stream = await fetch(`${base}/api/events?orders=${id}`, { signal: ctrl.signal });
  const reader = stream.body.getReader();
  await reader.read(); // retry preamble
  const t = performance.now();
  fetch(`${base}/api/orders/${id}/status`, { method: "PATCH", headers: { "content-type": "application/json", authorization: `Bearer ${login}` }, body: JSON.stringify({ status: "preparing" }) });
  let txt = "";
  while (!txt.includes("event: order")) txt += new TextDecoder().decode((await reader.read()).value);
  sse.push(performance.now() - t);
  ctrl.abort();
}
res.ssePropagation = stats(sse);
res.machine = { cpu: os.cpus()[0].model, cores: os.cpus().length, node: process.version };
writeFileSync(new URL("../data/benchmark.json", import.meta.url), JSON.stringify(res, null, 1));
console.table(Object.fromEntries(Object.entries(res).filter(([k]) => k !== "machine").map(([k, v]) => [k, { mean: v.mean.toFixed(2), p50: v.p50.toFixed(2), p95: v.p95.toFixed(2), n: v.n }])));
console.log(res.machine);
server.closeAllConnections(); server.close(); process.exit(0);
