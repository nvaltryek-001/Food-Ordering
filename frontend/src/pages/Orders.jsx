import { Link, navigate } from "../lib/router.jsx";
import { useApp } from "../lib/store.jsx";
import { money, timeAgo } from "../lib/api.js";
import { Empty, ErrorNote, Skeleton, useFetch } from "../components/ui.jsx";

const LABEL = { placed: "Placed", preparing: "Cooking", ready: "Ready", served: "Served", cancelled: "Cancelled" };

export default function Orders() {
  const { orderIds, user } = useApp();
  const ids = orderIds.join(",");
  const path = user ? `/orders/mine?ids=${ids}` : ids ? `/orders/lookup?ids=${ids}` : null;
  const { data, error, loading, reload } = useFetch(path, [ids, user?.id]);
  const orders = data?.orders || [];

  return (
    <div className="container narrow">
      <h1 className="page-title">My orders</h1>
      {!user && <p className="muted">Orders placed on this device show up here. <Link to="/login" className="text-link">Sign in</Link> to see them on any device.</p>}
      {error && <ErrorNote error={error} onRetry={reload} />}
      {loading && <div className="order-list">{[0, 1, 2].map((i) => <Skeleton key={i} h={84} r={16} />)}</div>}
      {!loading && !orders.length && (
        <Empty emoji="🧾" title="No orders yet" action={<Link to="/menu" className="btn btn-primary">Browse the menu</Link>}>
          When you place an order, you can follow it live from here.
        </Empty>
      )}
      <ul className="order-list">
        {orders.map((o) => (
          <li key={o.id}>
            <button className="order-card" onClick={() => navigate(`/orders/${o.id}`)}>
              <span className="order-emojis" aria-hidden="true">{o.items.slice(0, 3).map((i) => i.emoji).join("")}</span>
              <span className="order-main">
                <b>{o.code}</b>
                <span className="muted small">{o.items.map((i) => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}`).join(", ")}</span>
                <span className="muted small">Table {o.tableNumber} · {timeAgo(o.createdAt)}</span>
              </span>
              <span className="order-side">
                <span className={`status status-${o.status}`}>{LABEL[o.status]}</span>
                <b>{money(o.total)}</b>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
