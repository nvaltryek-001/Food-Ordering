import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons.jsx";
import { useApp } from "../lib/store.jsx";
import { api } from "../lib/api.js";

/** Loads JSON from the API; re-runs when `deps` change. */
export function useFetch(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path });
  const reload = useCallback(() => {
    if (!path) return;
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true }));
    api(path, { signal: ctrl.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => error.name !== "AbortError" && setState({ data: null, error, loading: false }));
    return () => ctrl.abort();
  }, [path, ...deps]);
  useEffect(() => reload(), [reload]);
  return { ...state, reload, setData: (fn) => setState((s) => ({ ...s, data: typeof fn === "function" ? fn(s.data) : fn })) };
}

/** Indian food-labelling mark: green square/dot for veg, brown-red square/triangle for non-veg. */
export function VegMark({ veg, size = 14 }) {
  return (
    <span className={`vegmark ${veg ? "is-veg" : "is-nonveg"}`} style={{ width: size, height: size }} role="img" aria-label={veg ? "Vegetarian" : "Non-vegetarian"} title={veg ? "Vegetarian" : "Non-vegetarian"}>
      <span />
    </span>
  );
}

export function Spice({ level }) {
  if (!level) return null;
  const words = ["", "Mild", "Medium", "Hot"];
  return (
    <span className={`spice spice-${level}`} title={`${words[level]} spice`}>
      {Array.from({ length: 3 }, (_, i) => <Icon key={i} name="flame" size={12} fill={i < level ? "currentColor" : "none"} strokeWidth={1.6} />)}
      <span className="sr-only">{words[level]} spice</span>
    </span>
  );
}

export function Stars({ value, size = 14 }) {
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={size} fill={value >= n - 0.25 ? "currentColor" : "none"} strokeWidth={1.5} />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange, label = "Your rating" }) {
  const [hover, setHover] = useState(0);
  const words = ["", "Poor", "Below average", "Good", "Very good", "Outstanding"];
  return (
    <div className="star-input" role="radiogroup" aria-label={label} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={(hover || value) >= n ? "on" : ""} onMouseEnter={() => setHover(n)} onClick={() => onChange(n)}>
          <Icon name="star" size={26} fill="currentColor" strokeWidth={1.2} />
        </button>
      ))}
      <span className="star-word">{words[hover || value] || "Tap to rate"}</span>
    </div>
  );
}

/** The dish "artwork": the emoji served in a steel katori. */
export function Katori({ emoji, size = 64, className = "" }) {
  return (
    <span className={`katori ${className}`} style={{ "--k": `${size}px` }} aria-hidden="true">
      <span className="katori-emoji">{emoji}</span>
    </span>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  return createPortal(
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          <Icon name={t.tone === "error" ? "close" : "check"} size={16} />
          {t.message}
        </div>
      ))}
    </div>,
    document.body,
  );
}

/**
 * Accessible dialog. `variant="sheet"` slides from the right on desktop / bottom on mobile;
 * `variant="modal"` scales in centred. Esc and backdrop click close it.
 */
export function Dialog({ open, onClose, title, children, variant = "modal", className = "", labelledBy }) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const panel = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement;
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
      const t = setTimeout(() => { setMounted(false); setClosing(false); lastFocus.current?.focus?.(); }, 260);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted || closing) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll('button:not([disabled]), a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => panel.current?.querySelector("[data-autofocus]")?.focus() || panel.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("no-scroll");
    };
  }, [mounted, closing]);

  if (!mounted) return null;
  return createPortal(
    <div className={`dialog-root ${variant} ${closing ? "is-closing" : ""}`}>
      <div className="dialog-backdrop" onClick={onClose} />
      <div ref={panel} className={`dialog-panel ${className}`} role="dialog" aria-modal="true" aria-label={labelledBy ? undefined : title} aria-labelledby={labelledBy} tabIndex={-1}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function SentimentBar({ sentiment, showLabels = true }) {
  const total = sentiment.positive + sentiment.neutral + sentiment.negative;
  if (!total) return <p className="muted small">No reviews yet.</p>;
  const parts = [
    ["positive", "Positive"],
    ["neutral", "Neutral"],
    ["negative", "Negative"],
  ];
  return (
    <div className="sentiment">
      <div className="sentiment-bar" role="img" aria-label={parts.map(([k, l]) => `${l} ${Math.round((sentiment[k] / total) * 100)}%`).join(", ")}>
        {parts.map(([k, l]) => sentiment[k] > 0 && (
          <span key={k} className={`seg seg-${k}`} style={{ flexGrow: sentiment[k] }} title={`${l}: ${sentiment[k]} reviews`} />
        ))}
      </div>
      {showLabels && (
        <div className="sentiment-legend">
          {parts.filter(([k]) => sentiment[k] > 0).map(([k, l]) => (
            <span key={k}><i className={`dot dot-${k}`} />{l} <b>{sentiment[k] / total < 0.005 ? "<1" : Math.round((sentiment[k] / total) * 100)}%</b></span>
          ))}
        </div>
      )}
    </div>
  );
}

export function SentimentChip({ sentiment, score }) {
  const label = { positive: "Positive", neutral: "Mixed", negative: "Negative" }[sentiment];
  return <span className={`chip chip-${sentiment}`}>{label}{score != null && <b>{score}</b>}</span>;
}

export function Empty({ emoji = "🍽️", title, children, action }) {
  return (
    <div className="empty">
      <span className="empty-emoji" aria-hidden="true">{emoji}</span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorNote({ error, onRetry }) {
  return (
    <div className="error-note" role="alert">
      <p>{error?.message || "Something went wrong."}</p>
      {onRetry && <button className="btn btn-ghost btn-sm" onClick={onRetry}><Icon name="refresh" size={16} />Try again</button>}
    </div>
  );
}

export function Field({ label, error, hint, children, id }) {
  return (
    <label className={`field ${error ? "has-error" : ""}`} htmlFor={id}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function QtyStepper({ qty, onChange, size = "md", label }) {
  return (
    <div className={`stepper stepper-${size}`} role="group" aria-label={label ? `Quantity of ${label}` : "Quantity"}>
      <button type="button" onClick={() => onChange(qty - 1)} aria-label="Remove one"><Icon name="minus" size={16} /></button>
      <span className="stepper-qty" aria-live="polite">{qty}</span>
      <button type="button" onClick={() => onChange(qty + 1)} aria-label="Add one" disabled={qty >= 20}><Icon name="plus" size={16} /></button>
    </div>
  );
}

export function Skeleton({ h = 16, w = "100%", r = 8 }) {
  return <span className="skeleton" style={{ height: h, width: w, borderRadius: r }} />;
}
