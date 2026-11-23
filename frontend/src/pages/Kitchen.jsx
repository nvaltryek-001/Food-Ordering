import { useEffect, useRef, useState } from "react";
import { Link } from "../lib/router.jsx";
import { useApp } from "../lib/store.jsx";
import { api, live } from "../lib/api.js";
import { Icon } from "../components/icons.jsx";
import { Empty, ErrorNote, VegMark, useFetch } from "../components/ui.jsx";

const COLUMNS = [
  { status: "placed", title: "New tickets", action: "Start cooking", next: "preparing" },
  { status: "preparing", title: "Cooking", action: "Mark ready", next: "ready" },
  { status: "ready", title: "Ready to serve", action: "Mark served", next: "served" },
];

export function StaffGate({ children, admin = false }) {
  const { user, isStaff, isAdmin } = useApp();
  if (!user || (admin ? !isAdmin : !isStaff)) {
    return (
      <div className="container narrow">
        <Empty emoji="🔒" title={admin ? "Admins only" : "Staff only"} action={<Link to="/login" className="btn btn-primary">Sign in as staff</Link>}>
          {user ? `You're signed in as ${user.name}, who doesn't have access to this page.` : "Sign in with a staff account to open this page."}
        </Empty>
      </div>
    );
  }
  return children;
}

export default function Kitchen() {
  return <StaffGate><Board /></StaffGate>;
}

function chime() {
  try {
    const ctx = new AudioContext();
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.16);
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + i * 0.16 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.16 + 0.4);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.16);
      o.stop(ctx.currentTime + i * 0.16 + 0.45);
    });
  } catch { /* audio unavailable */ }
}

function Board() {
  const { data, error, reload, setData } = useFetch("/orders?scope=active");
  const { toast } = useApp();
  const [sound, setSound] = useState(false);
  const [fresh, setFresh] = useState(() => new Set());
  const [now, setNow] = useState(Date.now());
  const soundRef = useRef(sound);
  soundRef.current = sound;

  useEffect(() => live({}, {
    order: (o) => {
      setData((d) => {
        const list = d?.orders || [];
        const exists = list.some((x) => x.id === o.id);
        const next = exists ? list.map((x) => (x.id === o.id ? o : x)) : [o, ...list];
        return { ...d, orders: next.filter((x) => ["placed", "preparing", "ready"].includes(x.status)) };
      });
      if (o.status === "placed" && o.timeline.length === 1) {
        setFresh((s) => new Set(s).add(o.id));
        toast(`New order ${o.code} · table ${o.tableNumber}`, "success");
        if (soundRef.current) chime();
      }
    },
  }), []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15_000); return () => clearInterval(t); }, []);

  const move = async (o, status) => {
    // Optimistic: move the ticket immediately, roll back if the server refuses.
    const prev = data;
    setData((d) => ({ ...d, orders: d.orders.map((x) => (x.id === o.id ? { ...x, status } : x)).filter((x) => x.status !== "served") }));
    try {
      await api(`/orders/${o.id}/status`, { method: "PATCH", body: { status } });
    } catch (e) {
      setData(prev);
      toast(e.message, "error");
    }
  };

  const orders = data?.orders || [];
  const oldest = orders.length ? Math.round((now - Math.min(...orders.map((o) => Date.parse(o.createdAt)))) / 60_000) : 0;

  return (
    <div className="kitchen">
      <div className="kitchen-head">
        <div>
          <h1 className="page-title">Kitchen</h1>
          <p className="muted">{orders.length} open ticket{orders.length === 1 ? "" : "s"}{orders.length ? ` · oldest waiting ${oldest} min` : ""} <span className="live-dot" /> live</p>
        </div>
        <div className="row gap-8">
          <button className={`btn btn-ghost btn-sm ${sound ? "is-on" : ""}`} onClick={() => { setSound(!sound); if (!sound) chime(); }} aria-pressed={sound}>
            <Icon name="bell" size={16} /> {sound ? "Chime on" : "Chime off"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={reload}><Icon name="refresh" size={16} /> Refresh</button>
        </div>
      </div>
      {error && <ErrorNote error={error} onRetry={reload} />}
      <div className="kanban">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => o.status === col.status).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          return (
            <section key={col.status} className={`lane lane-${col.status}`} aria-label={col.title}>
              <h2 className="lane-title">{col.title} <span className="lane-count">{list.length}</span></h2>
              <div className="lane-body">
                {list.map((o) => (
                  <Ticket key={o.id} order={o} col={col} now={now} fresh={fresh.has(o.id)} onMove={move} />
                ))}
                {!list.length && <p className="lane-empty muted small">No tickets</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Ticket({ order, col, now, fresh, onMove }) {
  const mins = Math.floor((now - Date.parse(order.createdAt)) / 60_000);
  const late = mins >= order.etaMinutes;
  return (
    <article className={`kot ${fresh ? "is-fresh" : ""} ${late ? "is-late" : ""}`}>
      <header className="kot-head">
        <span className="kot-table">T{order.tableNumber}</span>
        <span className="kot-code">{order.code}<br /><span className="muted small">{order.customerName}</span></span>
        <span className={`kot-timer ${late ? "is-late" : ""}`}><Icon name="clock" size={14} /> {mins}m</span>
      </header>
      <ul className="kot-items">
        {order.items.map((i) => (
          <li key={i.dishId}><b>{i.qty}×</b> <VegMark veg={i.veg} size={10} /> {i.name}</li>
        ))}
      </ul>
      {order.notes && <p className="kot-note">“{order.notes}”</p>}
      <footer className="kot-foot">
        <span className="muted small">{order.paymentMethod.toUpperCase()} · {order.paymentStatus}</span>
        <button className="btn btn-primary btn-sm" onClick={() => onMove(order, col.next)}>{col.action}</button>
      </footer>
    </article>
  );
}
