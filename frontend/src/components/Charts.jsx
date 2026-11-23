/** Lightweight SVG charts with hover tooltips (single series, one y-axis). */
import { useEffect, useRef, useState } from "react";

const niceMax = (v) => {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p / (v / p > 5 ? 2 : 1)) * p * (v / p > 5 ? 2 : 1);
};

export function BarChart({ data, x, y, format = (v) => v, height = 220, label, highlightLast = false, tickEvery = 1 }) {
  const [hover, setHover] = useState(null);
  const wrap = useRef(null);
  const [W, setW] = useState(640);
  // Draw at the container's real pixel width so text never stretches.
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);
  const H = height, pad = { t: 12, r: 8, b: 28, l: 44 };
  const max = niceMax(Math.max(...data.map(y)));
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const bw = iw / data.length;
  const ticks = [0, 0.5, 1].map((f) => f * max);

  return (
    <div className="chart" ref={wrap}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="chart-svg" width={W} height={H}>
        {ticks.map((t) => {
          const ty = pad.t + ih - (t / max) * ih;
          return (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={ty} y2={ty} className="chart-grid" />
              <text x={pad.l - 8} y={ty + 4} className="chart-tick" textAnchor="end">{format(t, true)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const v = y(d);
          const h = Math.max(v ? 2 : 0, (v / max) * ih);
          const bx = pad.l + i * bw + bw * 0.18;
          const w = bw * 0.64;
          const by = pad.t + ih - h;
          const r = Math.min(4, w / 2, h);
          const isLast = highlightLast && i === data.length - 1;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${x(d)}: ${format(v)}`}>
              <rect x={pad.l + i * bw} y={pad.t} width={bw} height={ih} fill="transparent" />
              <path
                d={`M${bx},${pad.t + ih} V${by + r} Q${bx},${by} ${bx + r},${by} H${bx + w - r} Q${bx + w},${by} ${bx + w},${by + r} V${pad.t + ih} Z`}
                className={`chart-bar ${isLast ? "is-accent" : ""} ${hover === i ? "is-hover" : ""} ${hover != null && hover !== i ? "is-dim" : ""}`}
              />
              {i % tickEvery === 0 && <text x={pad.l + i * bw + bw / 2} y={H - 8} className="chart-tick" textAnchor="middle">{x(d)}</text>}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div className="chart-tip" style={{ left: `${((pad.l + hover * bw + bw / 2) / W) * 100}%` }}>
          <b>{format(y(data[hover]))}</b>
          <span>{x(data[hover])}</span>
        </div>
      )}
    </div>
  );
}

/** Ranked horizontal bars with the value written at the end — readable without hovering. */
export function RankBars({ data, label, value, format = (v) => v, emoji }) {
  const max = Math.max(...data.map(value), 1);
  return (
    <ul className="rank-bars">
      {data.map((d, i) => (
        <li key={i} title={`${label(d)}: ${format(value(d))}`}>
          <span className="rank-label">{emoji && <span aria-hidden="true">{emoji(d)} </span>}{label(d)}</span>
          <span className="rank-track"><span className="rank-fill" style={{ width: `${(value(d) / max) * 100}%` }} /></span>
          <span className="rank-value">{format(value(d))}</span>
        </li>
      ))}
    </ul>
  );
}
