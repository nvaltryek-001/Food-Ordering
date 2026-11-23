import { useEffect, useRef, useState } from "react";
import { Link, navigate } from "../lib/router.jsx";
import { useApp } from "../lib/store.jsx";
import { api, money } from "../lib/api.js";
import { Icon } from "../components/icons.jsx";
import { useFetch, VegMark, Spice, Katori, Stars } from "../components/ui.jsx";
import { TablePicker } from "../components/TablePicker.jsx";

export default function Home() {
  const { table } = useApp();
  const [picking, setPicking] = useState(false);
  const popular = useFetch("/dishes?sort=popular");
  const dishes = popular.data?.dishes || [];

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1 className="hero-title">
            Order from your table.
            <span className="hero-title-2">We start cooking when you tap.</span>
          </h1>
          <p className="hero-lede">
            Pick from {dishes.length || 212} South Indian, North Indian and street-food dishes,
            pay at the table and watch your order move from the stove to your seat.
          </p>
          <div className="hero-actions">
            <Link to="/menu" className="btn btn-primary btn-lg">Browse the menu</Link>
            <button className="btn btn-ghost btn-lg" onClick={() => setPicking(true)}>
              <Icon name="table" size={18} />
              {table ? `Seated at table ${table}` : "Set my table"}
            </button>
          </div>
          <p className="hero-hint muted small">
            <Icon name="qr" size={16} /> Scanning the QR card on your table sets this for you.
          </p>
        </div>
        <Thali dishes={dishes.filter((d, i, a) => a.findIndex((x) => x.emoji === d.emoji) === i).slice(0, 6)} />
        <TablePicker open={picking} onClose={() => setPicking(false)} />
      </section>

      <section className="section">
        <div className="section-head">
          <h2>What Bengaluru ordered this week</h2>
          <Link to="/menu" className="text-link">See all {dishes.length || ""} dishes</Link>
        </div>
        <div className="popular-row">
          {popular.loading && !dishes.length
            ? Array.from({ length: 4 }, (_, i) => <div key={i} className="popular-card is-loading" />)
            : dishes.slice(0, 8).map((d) => <PopularCard key={d.id} dish={d} />)}
        </div>
      </section>

      <section className="section steps">
        <h2>How ordering works here</h2>
        <ol className="steps-list">
          <li>
            <span className="step-n">1</span>
            <h3>Scan the card on your table</h3>
            <p>The menu opens with your table already set — no app to install.</p>
          </li>
          <li>
            <span className="step-n">2</span>
            <h3>Order and pay</h3>
            <p>UPI, card or cash. Your ticket prints in the kitchen straight away.</p>
          </li>
          <li>
            <span className="step-n">3</span>
            <h3>Follow it, then rate it</h3>
            <p>See it go from placed to cooking to served, and tell us how each dish was.</p>
          </li>
        </ol>
      </section>

      <ReviewLab />
    </>
  );
}

/** The hero centrepiece: a steel thali that is served dish by dish on load. */
function Thali({ dishes }) {
  const fallback = ["🥞", "🍛", "🍚", "🫓", "🍡", "🥛"].map((emoji, i) => ({ id: i, emoji, name: "" }));
  const items = dishes.length === 6 ? dishes : fallback;
  return (
    <div className="thali-wrap" aria-hidden="true">
      <div className="thali">
        <div className="thali-rim" />
        {items.map((d, i) => (
          <div key={d.id} className="thali-bowl" style={{ "--i": i, "--a": `${i * 60 - 90}deg` }}>
            <Katori emoji={d.emoji} size={96} />
          </div>
        ))}
        <div className="thali-centre"><span>🍚</span></div>
      </div>
      {dishes[0] && (
        <div className="thali-note">
          <span className="thali-note-emoji">{dishes[0].emoji}</span>
          <span>
            <b>{dishes[0].name}</b>
            <span className="muted small">{dishes[0].ordered} plates this fortnight</span>
          </span>
        </div>
      )}
    </div>
  );
}

function PopularCard({ dish }) {
  const { add } = useApp();
  return (
    <article className="popular-card">
      <button className="popular-hit" onClick={() => navigate(`/menu/${dish.id}`)} aria-label={`View ${dish.name}`} />
      <Katori emoji={dish.emoji} size={72} />
      <div className="popular-meta">
        <span className="row gap-6"><VegMark veg={dish.veg} size={12} /><Spice level={dish.spice} /></span>
        <h3>{dish.name}</h3>
        <span className="row gap-6 small muted"><Stars value={dish.rating} size={12} /> {dish.rating.toFixed(1)} · {dish.reviewCount} reviews</span>
      </div>
      <div className="popular-foot">
        <span className="price">{money(dish.price)}</span>
        <button className="btn btn-add" onClick={(e) => add(dish, 1, e.currentTarget)} disabled={!dish.available} aria-label={`Add ${dish.name}`}>
          <Icon name="plus" size={16} /> Add
        </button>
      </div>
    </article>
  );
}

const EXAMPLES = [
  "The masala dosa was crispy and the chutney tasted fresh. Loved it!",
  "Food came out cold and we waited forty minutes.",
  "Decent biryani, a little too salty for me.",
];

/** Live demo of the review model that powers dish scores. */
function ReviewLab() {
  const { meta } = useApp();
  const [text, setText] = useState(EXAMPLES[0]);
  const [result, setResult] = useState(null);
  const timer = useRef();
  useEffect(() => {
    clearTimeout(timer.current);
    if (text.trim().length < 3) return setResult(null);
    timer.current = setTimeout(() => {
      api("/sentiment", { method: "POST", body: { text } }).then(setResult).catch(() => setResult(null));
    }, 280);
    return () => clearTimeout(timer.current);
  }, [text]);
  const m = meta?.model;
  const label = { positive: "Reads as positive", neutral: "Reads as mixed", negative: "Reads as negative" };

  return (
    <section className="section lab">
      <div className="lab-copy">
        <h2>Every review gets read — by a person and a model</h2>
        <p>
          When you rate a dish, a sentiment model trained on 1,000 labelled restaurant reviews scores what you wrote.
          The kitchen sees which dishes people love and which ones need work, alongside the stars.
        </p>
        {m && (
          <dl className="lab-stats">
            <div><dt>Held-out accuracy</dt><dd>{Math.round(m.accuracy * 100)}%</dd></div>
            <div><dt>F1 score</dt><dd>{m.f1.toFixed(2)}</dd></div>
            <div><dt>Test reviews</dt><dd>{m.testSize}</dd></div>
          </dl>
        )}
      </div>
      <div className="lab-box">
        <label htmlFor="lab-text" className="field-label">Try writing a review</label>
        <textarea id="lab-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={300} />
        <div className="lab-examples">
          {EXAMPLES.map((e) => (
            <button key={e} className={`chip-btn ${text === e ? "is-on" : ""}`} onClick={() => setText(e)}>{e.split(" ").slice(0, 4).join(" ")}…</button>
          ))}
        </div>
        <div className={`lab-result ${result ? `is-${result.sentiment}` : ""}`} aria-live="polite">
          <div className="lab-meter">
            <span className="lab-meter-fill" style={{ width: `${result?.score ?? 50}%` }} />
            <span className="lab-meter-mid" />
          </div>
          <div className="lab-readout">
            <b>{result ? label[result.sentiment] : "Waiting for text…"}</b>
            <span className="muted small">{result ? `Positivity score ${result.score}/100` : ""}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
