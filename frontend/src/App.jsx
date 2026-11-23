import { useEffect, useState } from "react";
import { Link, match, navigate, useRoute } from "./lib/router.jsx";
import { useApp } from "./lib/store.jsx";
import { money } from "./lib/api.js";
import { Icon } from "./components/icons.jsx";
import { Toasts } from "./components/ui.jsx";
import { CartSheet } from "./components/CartSheet.jsx";
import { TablePicker } from "./components/TablePicker.jsx";
import Home from "./pages/Home.jsx";
import Menu from "./pages/Menu.jsx";
import Checkout from "./pages/Checkout.jsx";
import Track from "./pages/Track.jsx";
import Orders from "./pages/Orders.jsx";
import Login from "./pages/Login.jsx";
import Kitchen from "./pages/Kitchen.jsx";
import Admin from "./pages/Admin.jsx";
import NotFound from "./pages/NotFound.jsx";

const ROUTES = [
  ["/", Home],
  ["/menu", Menu],
  ["/menu/:dishId", Menu],
  ["/checkout", Checkout],
  ["/orders", Orders],
  ["/orders/:id", Track],
  ["/login", Login],
  ["/kitchen", Kitchen],
  ["/admin", Admin],
  ["/admin/:tab", Admin],
];

export default function App() {
  const { path } = useRoute();
  const { setTable, toast } = useApp();

  // QR codes on tables point at /t/<number>
  const tableMatch = match("/t/:n", path);
  useEffect(() => {
    if (!tableMatch) return;
    const n = Number(tableMatch.n);
    if (n >= 1 && n <= 50) {
      setTable(n);
      toast(`Welcome! You're seated at table ${n}.`, "success");
    }
    navigate("/menu", { replace: true });
  }, [path]);

  let page = <NotFound />;
  for (const [pattern, Page] of ROUTES) {
    const params = match(pattern, path);
    if (params) { page = <Page params={params} />; break; }
  }
  const staffArea = path.startsWith("/kitchen") || path.startsWith("/admin");

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header staffArea={staffArea} />
      <main id="main" key={path.split("/")[1]} className="page-enter">{page}</main>
      {!staffArea && <Footer />}
      {!staffArea && <MobileCartBar />}
      <CartSheet />
      <Toasts />
    </>
  );
}

function Header({ staffArea }) {
  const { totals, setCartOpen, cartButton, user, isStaff, isAdmin, table } = useApp();
  const [picking, setPicking] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(scrollY > 8);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`topbar ${scrolled ? "is-scrolled" : ""} ${staffArea ? "is-staff" : ""}`}>
      <div className="topbar-inner">
        <Link to="/" className="brand" aria-label="FoodSense home">
          <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="19" className="bm-plate" />
            <circle cx="20" cy="20" r="13.5" className="bm-rim" />
            <circle cx="14.5" cy="16" r="4.2" className="bm-a" />
            <circle cx="25" cy="15" r="3.4" className="bm-b" />
            <circle cx="21" cy="25.5" r="4.8" className="bm-c" />
          </svg>
          <span className="brand-name">FoodSense</span>
        </Link>

        {!staffArea && (
          <button className={`table-pill ${table ? "" : "is-empty"}`} onClick={() => setPicking(true)}>
            <Icon name="table" size={16} />
            {table ? <>Table <b>{table}</b></> : "Choose table"}
          </button>
        )}

        <nav className="nav" aria-label="Main">
          <Link to="/menu" activeClass="is-active">Menu</Link>
          <Link to="/orders" activeClass="is-active">My orders</Link>
          {isStaff && <Link to="/kitchen" activeClass="is-active">Kitchen</Link>}
          {isAdmin && <Link to="/admin" activeClass="is-active">Dashboard</Link>}
        </nav>

        <div className="topbar-actions">
          <Link to="/login" className="icon-btn account-btn" aria-label={user ? `Account: ${user.name}` : "Sign in"}>
            <Icon name="user" />
            <span className="account-name">{user ? user.name.split(" ")[0] : "Sign in"}</span>
          </Link>
          {!staffArea && (
            <button ref={cartButton} className="cart-btn" onClick={() => setCartOpen(true)} aria-label={`Your order, ${totals.count} items`}>
              <Icon name="bag" />
              <span className="cart-total">{totals.count ? money(totals.total) : "Order"}</span>
              {totals.count > 0 && <span className="cart-count" key={totals.count}>{totals.count}</span>}
            </button>
          )}
        </div>
      </div>
      <TablePicker open={picking} onClose={() => setPicking(false)} />
    </header>
  );
}

function MobileCartBar() {
  const { totals, setCartOpen, cartOpen } = useApp();
  const { path } = useRoute();
  if (!totals.count || cartOpen || path === "/checkout") return null;
  return (
    <button className="mobile-cart-bar" onClick={() => setCartOpen(true)}>
      <span><b>{totals.count}</b> item{totals.count > 1 ? "s" : ""} · {money(totals.total)}</span>
      <span>View order <Icon name="arrowRight" size={18} /></span>
    </button>
  );
}

function Footer() {
  const { meta } = useApp();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <p className="footer-brand">FoodSense Kitchen</p>
          <p className="muted">12 Residency Road, Bengaluru · Open 8 am – 11 pm</p>
        </div>
        <div className="footer-links">
          <Link to="/menu">Full menu</Link>
          <Link to="/orders">Track an order</Link>
          <Link to="/login">Staff sign in</Link>
        </div>
        <p className="muted small footer-note">
          Review insights come from a sentiment model trained on 1,000 labelled restaurant reviews
          {meta?.model?.accuracy ? ` (${Math.round(meta.model.accuracy * 100)}% accurate on held-out reviews)` : ""}.
          Payments in this demo are simulated.
        </p>
      </div>
    </footer>
  );
}
