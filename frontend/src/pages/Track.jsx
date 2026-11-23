import { useEffect, useState } from "react";
import { Link } from "../lib/router.jsx";
import { useApp } from "../lib/store.jsx";
import { api, live, money } from "../lib/api.js";
import { Icon } from "../components/icons.jsx";
import { ErrorNote, SentimentChip, Skeleton, StarInput, VegMark, useFetch } from "../components/ui.jsx";

export const STEPS = [
  { id: "placed", title: "Order placed", text: "Your ticket is in the kitchen queue." },
  { id: "preparing", title: "Cooking", text: "The chef has started on your food." },
  { id: "ready", title: "Ready", text: "Plated and on its way to your table." },
  { id: "served", title: "Served", text: "Enjoy your meal!" },
];

export default function Track({ params }) {
  const { data, error, loading, setData, reload } = useFetch(`/orders/${params.id}`, [params.id]);
  const { rememberOrder, toast } = useApp();
  const order = data?.order;
  const [now, setNow] = useState(Date.now());

  useEffect(() => { if (order) rememberOrder(order.id); }, [order?.id]);
  useEffect(() => {
    if (!order) return;
    return live({ orders: order.id }, {
      order: (o) => {
        setData((d) => ({ ...d, order: o }));
        const step = STEPS.find((s) => s.id === o.status);
        if (step) toast(`${o.code}: ${step.title}`, "success");
      },
    });
  }, [order?.id]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (loading && !order) return <div className="container narrow"><Skeleton h={40} w="40%" /><br /><Skeleton h={220} r={20} /></div>;
  if (error) return <div className="container narrow"><ErrorNote error={error} onRetry={reload} /></div>;
  if (!order) return null;

  const idx = STEPS.findIndex((s) => s.id === order.status);
  const cancelled = order.status === "cancelled";
  const due = Date.parse(order.createdAt) + order.etaMinutes * 60_000;
  const remaining = Math.max(0, Math.round((due - now) / 60_000));
  const progress = cancelled ? 0 : order.status === "served" ? 1 : Math.min(0.97, (now - Date.parse(order.createdAt)) / (order.etaMinutes * 60_000));
  const at = (s) => order.timeline.find((t) => t.status === s)?.at;

  const cancel = async () => {
    try {
      const { order: o } = await api(`/orders/${order.id}/cancel`, { method: "POST" });
      setData((d) => ({ ...d, order: o }));
      toast("Order cancelled", "info");
    } catch (e) { toast(e.message, "error"); }
  };

  return (
    <div className="container track">
      <Link to="/orders" className="back-link"><Icon name="arrowLeft" size={18} /> All orders</Link>
      <div className="track-grid">
        <section className="panel track-status">
          <div className="track-head">
            <div>
              <p className="muted small">Order {order.code} · Table {order.tableNumber}</p>
              <h1 className="page-title">{cancelled ? "Order cancelled" : STEPS[idx].title}</h1>
              <p className="muted">{cancelled ? "Nothing will be charged for this order." : STEPS[idx].text}</p>
            </div>
            {!cancelled && order.status !== "served" && (
              <div className="eta-ring" style={{ "--p": progress }} role="img" aria-label={`About ${remaining} minutes left`}>
                <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" className="eta-track" /><circle cx="60" cy="60" r="52" className="eta-fill" pathLength="1" /></svg>
                <div className="eta-text"><b>{remaining || "<1"}</b><span>min</span></div>
              </div>
            )}
            {order.status === "served" && <span className="served-badge" aria-hidden="true">🍽️</span>}
          </div>

          {!cancelled && (
            <ol className="timeline">
              {STEPS.map((s, i) => (
                <li key={s.id} className={`tl-step ${i < idx ? "is-done" : ""} ${i === idx ? "is-current" : ""}`}>
                  <span className="tl-dot">{i <= idx ? <Icon name="check" size={14} strokeWidth={2.6} /> : null}</span>
                  <span className="tl-title">{s.title}</span>
                  <span className="tl-time muted small">{at(s.id) ? new Date(at(s.id)).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : ""}</span>
                </li>
              ))}
            </ol>
          )}
          {order.status === "placed" && <button className="link-btn small danger" onClick={cancel}>Cancel order — only possible before cooking starts</button>}
          <p className="muted small live-note"><span className="live-dot" /> Updates live from the kitchen</p>
        </section>

        <aside className="panel">
          <h2>Your items</h2>
          <ul className="summary-list">
            {order.items.map((i) => (
              <li key={i.dishId}>
                <span className="summary-emoji" aria-hidden="true">{i.emoji}</span>
                <span className="summary-name"><VegMark veg={i.veg} size={11} /> {i.name} <span className="muted">× {i.qty}</span></span>
                <span className="summary-price">{money(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="bill">
            <div><dt>Items</dt><dd>{money(order.subtotal)}</dd></div>
            <div><dt>GST</dt><dd>{money(order.tax)}</dd></div>
            <div className="bill-total"><dt>{order.paymentStatus === "paid" ? "Paid" : "To pay"} · {order.paymentMethod.toUpperCase()}</dt><dd>{money(order.total)}</dd></div>
          </dl>
          {order.notes && <p className="muted small">Note: {order.notes}</p>}
        </aside>
      </div>

      {order.status === "served" && <RateDishes order={order} />}
    </div>
  );
}

function RateDishes({ order }) {
  return (
    <section className="section rate">
      <h2>How was everything?</h2>
      <p className="muted">Your rating and a line about each dish help the kitchen decide what stays on the menu.</p>
      <div className="rate-grid">
        {order.items.map((i) => <RateCard key={i.dishId} item={i} order={order} />)}
      </div>
    </section>
  );
}

function RateCard({ item, order }) {
  const { toast } = useApp();
  const key = `fs.rated.${order.id}.${item.dishId}`;
  const [done, setDone] = useState(() => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } });
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setErr("Choose a star rating.");
    if (text.trim().length < 4) return setErr("Add a few words about the dish.");
    setBusy(true); setErr(null);
    try {
      const { review } = await api("/reviews", { method: "POST", body: { dishId: item.dishId, rating, text, orderId: order.id, name: order.customerName } });
      setDone(review);
      try { localStorage.setItem(key, JSON.stringify(review)); } catch { /* ignore */ }
      toast(`Thanks! Review for ${item.name} saved.`, "success");
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="panel rate-card is-done">
        <span className="rate-emoji" aria-hidden="true">{item.emoji}</span>
        <h3>{item.name}</h3>
        <p className="muted small">“{done.text}”</p>
        <p className="row gap-8 small">Our model read this as <SentimentChip sentiment={done.sentiment} score={done.score} /></p>
      </div>
    );
  }
  return (
    <form className="panel rate-card" onSubmit={submit}>
      <span className="rate-emoji" aria-hidden="true">{item.emoji}</span>
      <h3>{item.name}</h3>
      <StarInput value={rating} onChange={setRating} label={`Rating for ${item.name}`} />
      <textarea rows={2} placeholder="What did you think?" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} aria-label={`Review of ${item.name}`} />
      {err && <p className="form-error">{err}</p>}
      <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Saving…" : "Post review"}</button>
    </form>
  );
}

