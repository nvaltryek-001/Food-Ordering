import { useEffect, useMemo, useState } from "react";
import { Link, navigate } from "../lib/router.jsx";
import { useApp } from "../lib/store.jsx";
import { api, live, money, timeAgo } from "../lib/api.js";
import { encodeQR, qrPath } from "../lib/qr.js";
import { Icon } from "../components/icons.jsx";
import { ErrorNote, SentimentBar, SentimentChip, Skeleton, Stars, VegMark, useFetch } from "../components/ui.jsx";
import { BarChart, RankBars } from "../components/Charts.jsx";
import { StaffGate } from "./Kitchen.jsx";

const TABS = [
  ["overview", "Overview", "chart"],
  ["menu", "Menu", "menu"],
  ["reviews", "Reviews", "message"],
  ["tables", "Table QR codes", "qr"],
];

export default function Admin({ params }) {
  const tab = params.tab || "overview";
  return (
    <StaffGate admin>
      <div className="admin">
        <div className="admin-head">
          <h1 className="page-title">Dashboard</h1>
          <nav className="tabs" aria-label="Dashboard sections">
            {TABS.map(([id, l, ic]) => (
              <Link key={id} to={id === "overview" ? "/admin" : `/admin/${id}`} className={`tab ${tab === id ? "is-on" : ""}`}>
                <Icon name={ic} size={16} /> {l}
              </Link>
            ))}
          </nav>
        </div>
        {tab === "overview" && <Overview />}
        {tab === "menu" && <MenuManager />}
        {tab === "reviews" && <ReviewFeed />}
        {tab === "tables" && <TableCodes />}
      </div>
    </StaffGate>
  );
}

const pct = (v) => (v == null ? null : `${v >= 0 ? "+" : "−"}${Math.abs(Math.round(v * 100))}%`);
const short = (v) => (v >= 1000 ? `₹${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `₹${Math.round(v)}`);

function Overview() {
  const { data, error, reload } = useFetch("/analytics");
  useEffect(() => live({}, { order: () => reload(), review: () => reload() }), []);
  if (error) return <ErrorNote error={error} onRetry={reload} />;
  if (!data) return <div className="kpis">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={110} r={18} />)}</div>;
  const k = data.kpis;
  const total = data.sentiment.positive + data.sentiment.neutral + data.sentiment.negative;

  return (
    <div className="overview">
      <div className="kpis">
        <Kpi label="Revenue today" value={money(k.revenueToday)} delta={pct(k.revenueChange)} note="vs same time yesterday" />
        <Kpi label="Orders today" value={k.ordersToday} delta={pct(k.ordersChange)} note="vs same time yesterday" />
        <Kpi label="Average bill" value={money(k.avgOrderValue)} note="today" />
        <Kpi label="Happy diners" value={`${k.satisfaction}%`} note={`of ${k.reviewCount} reviews read as positive`} />
      </div>

      <div className="dash-grid">
        <section className="panel span-2">
          <div className="panel-head"><h2>Revenue, last 14 days</h2><span className="muted small">Today highlighted</span></div>
          <BarChart data={data.revenueByDay} x={(d) => d.label} y={(d) => d.revenue} format={(v, tick) => (tick ? short(v) : money(v))} label="Daily revenue for the last 14 days" highlightLast tickEvery={2} />
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Busiest hours</h2><span className="muted small">All orders</span></div>
          <BarChart data={data.ordersByHour.filter((h) => h.hour >= 7 && h.hour <= 23)} x={(d) => (d.hour % 12 || 12) + (d.hour < 12 ? "a" : "p")} y={(d) => d.orders} format={(v) => Math.round(v)} label="Orders by hour of day" height={260} tickEvery={3} />
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Top dishes</h2><span className="muted small">Plates sold, 14 days</span></div>
          <RankBars data={data.topDishes.slice(0, 6)} label={(d) => d.name} value={(d) => d.qty} emoji={(d) => d.emoji} />
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Revenue by section</h2></div>
          <RankBars data={data.categoryRevenue.slice(0, 6)} label={(d) => d.name} value={(d) => d.revenue} format={short} />
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Review sentiment</h2><span className="muted small">{total} reviews</span></div>
          <SentimentBar sentiment={data.sentiment} />
          <h3 className="mini-title">Needs attention</h3>
          <ul className="attention">
            {data.needsAttention.slice(0, 4).map((d) => (
              <li key={d.id}>
                <span aria-hidden="true">{d.emoji}</span>
                <button className="link-btn" onClick={() => navigate(`/menu/${d.id}`)}>{d.name}</button>
                <span className="muted small">score {d.aiScore}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel span-3">
          <div className="panel-head"><h2>Latest reviews</h2><Link to="/admin/reviews" className="text-link small">All reviews</Link></div>
          <ReviewTable reviews={data.recentReviews.slice(0, 5)} />
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, delta, note }) {
  const up = delta && delta.startsWith("+");
  return (
    <div className="panel kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      <span className="kpi-note small">
        {delta && <span className={`delta ${up ? "is-up" : "is-down"}`}>{up ? "▲" : "▼"} {delta}</span>} <span className="muted">{note}</span>
      </span>
    </div>
  );
}

function ReviewTable({ reviews }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Dish</th><th>Review</th><th>Stars</th><th>Model</th><th>When</th></tr></thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id}>
              <td className="nowrap">{r.dishName}</td>
              <td className="review-cell">{r.text}<span className="muted small"> — {r.name}</span></td>
              <td><Stars value={r.rating} size={12} /></td>
              <td><SentimentChip sentiment={r.sentiment} score={r.score} /></td>
              <td className="muted small nowrap">{timeAgo(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MenuManager() {
  const { data, error, reload, setData } = useFetch("/dishes?sort=popular");
  const { toast } = useApp();
  const [q, setQ] = useState("");
  const list = useMemo(() => (data?.dishes || []).filter((d) => `${d.name} ${d.category}`.toLowerCase().includes(q.toLowerCase())), [data, q]);

  const update = async (dish, patch) => {
    setData((d) => ({ ...d, dishes: d.dishes.map((x) => (x.id === dish.id ? { ...x, ...patch } : x)) }));
    try {
      await api(`/dishes/${dish.id}`, { method: "PATCH", body: patch });
      toast(patch.available === false ? `${dish.name} marked sold out` : patch.available ? `${dish.name} back on the menu` : `${dish.name} price updated`, "success");
    } catch (e) { toast(e.message, "error"); reload(); }
  };

  if (error) return <ErrorNote error={error} onRetry={reload} />;
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{data?.count ?? "…"} dishes</h2>
        <label className="search search-sm"><Icon name="search" size={16} /><span className="sr-only">Filter dishes</span><input placeholder="Filter dishes" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Dish</th><th>Section</th><th className="num">Sold</th><th className="num">Rating</th><th className="num">Model score</th><th className="num">Price</th><th>On menu</th></tr></thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id} className={d.available ? "" : "is-off"}>
                <td className="nowrap"><span aria-hidden="true">{d.emoji}</span> <VegMark veg={d.veg} size={10} /> {d.name}</td>
                <td className="muted nowrap">{d.category}</td>
                <td className="num">{d.ordered}</td>
                <td className="num">{d.rating} <span className="muted small">({d.reviewCount})</span></td>
                <td className="num">{d.aiScore ?? "—"}</td>
                <td className="num"><PriceInput dish={d} onSave={(price) => update(d, { price })} /></td>
                <td>
                  <button className={`switch ${d.available ? "is-on" : ""}`} role="switch" aria-checked={d.available} aria-label={`${d.name} available`} onClick={() => update(d, { available: !d.available })}>
                    <span />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PriceInput({ dish, onSave }) {
  const [v, setV] = useState(dish.price);
  useEffect(() => setV(dish.price), [dish.price]);
  const commit = () => { const n = Math.round(Number(v)); if (n && n !== dish.price) onSave(n); else setV(dish.price); };
  return (
    <span className="price-input">₹<input inputMode="numeric" value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, ""))} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} aria-label={`Price of ${dish.name}`} /></span>
  );
}

function ReviewFeed() {
  const [filter, setFilter] = useState("");
  const { data, error, reload } = useFetch(`/reviews?limit=80${filter ? `&sentiment=${filter}` : ""}`, [filter]);
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Reviews</h2>
        <div className="segmented" role="radiogroup" aria-label="Sentiment">
          {[["", "All"], ["positive", "Positive"], ["neutral", "Mixed"], ["negative", "Negative"]].map(([v, l]) => (
            <button key={v} role="radio" aria-checked={filter === v} className={filter === v ? "is-on" : ""} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>
      {error && <ErrorNote error={error} onRetry={reload} />}
      {data ? <ReviewTable reviews={data.reviews} /> : <Skeleton h={300} />}
    </section>
  );
}

function TableCodes() {
  const { meta } = useApp();
  const n = meta?.restaurant?.tables || 20;
  const origin = location.origin;
  return (
    <section>
      <div className="panel-head no-print">
        <p className="muted">Print these and place one on each table. Scanning opens the menu with the table already set.</p>
        <button className="btn btn-primary btn-sm" onClick={() => print()}><Icon name="print" size={16} /> Print all</button>
      </div>
      <div className="qr-grid">
        {Array.from({ length: n }, (_, i) => {
          const url = `${origin}/t/${i + 1}`;
          const { d, size } = qrPath(encodeQR(url));
          return (
            <figure key={i} className="qr-card">
              <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`QR code for table ${i + 1}`} shapeRendering="crispEdges">
                <rect width={size} height={size} fill="#fff" />
                <path d={d} fill="#123d2a" />
              </svg>
              <figcaption><b>Table {i + 1}</b><span className="muted small">Scan to order</span></figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
