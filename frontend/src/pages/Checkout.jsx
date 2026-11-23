import { useState } from "react";
import { createPortal } from "react-dom";
import { Link, navigate } from "../lib/router.jsx";
import { useApp } from "../lib/store.jsx";
import { api, money } from "../lib/api.js";
import { Icon } from "../components/icons.jsx";
import { Empty, Field, QtyStepper, VegMark } from "../components/ui.jsx";
import { TableGrid } from "../components/TablePicker.jsx";

const METHODS = [
  { id: "upi", icon: "phone", title: "UPI", text: "GPay, PhonePe, Paytm — approve on your phone" },
  { id: "card", icon: "card", title: "Card", text: "Tap or swipe at the table" },
  { id: "cash", icon: "cash", title: "Cash", text: "Pay your server when the food arrives" },
];

export default function Checkout() {
  const { cart, totals, table, setTable, user, setQty, clearCart, rememberOrder, toast } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState("upi");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [placed, setPlaced] = useState(null);

  if (!cart.length && !placed) {
    return (
      <div className="container narrow">
        <Empty emoji="🧾" title="Nothing to check out yet" action={<Link to="/menu" className="btn btn-primary">Browse the menu</Link>}>
          Add dishes to your order first.
        </Empty>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!table) return setError("Choose your table so we know where to bring the food.");
    setBusy(true);
    setError(null);
    try {
      const { order } = await api("/orders", {
        method: "POST",
        body: { tableNumber: Number(table), items: cart.map((x) => ({ dishId: x.id, qty: x.qty })), paymentMethod: method, customerName: name, notes },
      });
      rememberOrder(order.id);
      setPlaced(order);
      clearCart();
      setTimeout(() => navigate(`/orders/${order.id}`), 1900);
    } catch (err) {
      setError(err.message);
      toast(err.message, "error");
      setBusy(false);
    }
  };

  return (
    <div className="container checkout">
      <Link to="/menu" className="back-link"><Icon name="arrowLeft" size={18} /> Back to menu</Link>
      <h1 className="page-title">Checkout</h1>
      <form className="checkout-grid" onSubmit={submit} noValidate>
        <div className="checkout-steps">
          <fieldset className="panel">
            <legend><span className="step-n">1</span> Your table</legend>
            <TableGrid value={table} onChange={setTable} />
          </fieldset>

          <fieldset className="panel">
            <legend><span className="step-n">2</span> For the kitchen</legend>
            <div className="form-grid">
              <Field label="Name on the order" hint="So your server can find you" id="co-name">
                <input id="co-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. Priya" autoComplete="name" />
              </Field>
              <Field label="Cooking notes" hint="Allergies, less spice, no onion…" id="co-notes">
                <input id="co-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={280} placeholder="Optional" />
              </Field>
            </div>
          </fieldset>

          <fieldset className="panel">
            <legend><span className="step-n">3</span> Payment</legend>
            <div className="pay-options" role="radiogroup" aria-label="Payment method">
              {METHODS.map((m) => (
                <button type="button" key={m.id} role="radio" aria-checked={method === m.id} className={`pay-option ${method === m.id ? "is-on" : ""}`} onClick={() => setMethod(m.id)}>
                  <Icon name={m.icon} size={22} />
                  <span><b>{m.title}</b><span className="muted small">{m.text}</span></span>
                  <span className="radio-dot" />
                </button>
              ))}
            </div>
            <p className="muted small demo-note">Demo mode: no money is taken. UPI and card orders are marked paid instantly.</p>
          </fieldset>
        </div>

        <aside className="panel summary">
          <h2>Order summary</h2>
          <ul className="summary-list">
            {cart.map((x) => (
              <li key={x.id}>
                <span className="summary-emoji" aria-hidden="true">{x.emoji}</span>
                <span className="summary-name"><VegMark veg={x.veg} size={11} /> {x.name}</span>
                <QtyStepper qty={x.qty} onChange={(q) => setQty(x.id, q)} size="sm" label={x.name} />
                <span className="summary-price">{money(x.qty * x.price)}</span>
              </li>
            ))}
          </ul>
          <dl className="bill">
            <div><dt>Items</dt><dd>{money(totals.subtotal)}</dd></div>
            <div><dt>GST (5%)</dt><dd>{money(totals.tax)}</dd></div>
            <div className="bill-total"><dt>To pay</dt><dd>{money(totals.total)}</dd></div>
          </dl>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? <><span className="spinner" /> Sending to kitchen…</> : <>Place order · {money(totals.total)}</>}
          </button>
          <p className="muted small center">{table ? `Food comes to table ${table}.` : "Pick a table to continue."}</p>
        </aside>
      </form>
      {placed && <PlacedOverlay order={placed} />}
    </div>
  );
}

function PlacedOverlay({ order }) {
  const bits = order.items.flatMap((i) => Array(Math.min(i.qty, 3)).fill(i.emoji));
  while (bits.length < 14) bits.push(...order.items.map((i) => i.emoji));
  return createPortal(
    <div className="placed" role="status">
      <div className="placed-burst" aria-hidden="true">
        {bits.slice(0, 18).map((e, i) => <span key={i} style={{ "--i": i, "--n": 18 }}>{e}</span>)}
      </div>
      <div className="placed-card">
        <svg className="placed-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="m15 27 7 7 15-16" /></svg>
        <h2>Order {order.code} is in</h2>
        <p className="muted">The kitchen has your ticket. Taking you to live tracking…</p>
      </div>
    </div>,
    document.body,
  );
}
