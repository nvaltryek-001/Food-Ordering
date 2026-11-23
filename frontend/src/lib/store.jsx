/** App-wide state: session, table, cart, order history and toasts — persisted to localStorage. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, setToken, getToken } from "./api.js";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const persist = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => load("fs.user", null));
  const [table, setTableState] = useState(() => load("fs.table", null));
  const [cart, setCart] = useState(() => load("fs.cart", []));
  const [orderIds, setOrderIds] = useState(() => load("fs.orders", []));
  const [toasts, setToasts] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [meta, setMeta] = useState(null);
  const cartButton = useRef(null);

  useEffect(() => persist("fs.cart", cart), [cart]);
  useEffect(() => persist("fs.table", table), [table]);
  useEffect(() => persist("fs.orders", orderIds), [orderIds]);
  useEffect(() => persist("fs.user", user), [user]);

  useEffect(() => {
    api("/meta").then(setMeta).catch(() => {});
    if (getToken()) api("/auth/me").then((d) => setUser(d.user)).catch((e) => { if (e.status === 401) { setToken(null); setUser(null); } });
  }, []);

  const toast = useCallback((message, tone = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const setTable = useCallback((n) => setTableState(n ? String(n) : null), []);

  const add = useCallback((dish, qty = 1, fromEl) => {
    if (!dish.available) return;
    setCart((c) => {
      const found = c.find((x) => x.id === dish.id);
      if (found) return c.map((x) => (x.id === dish.id ? { ...x, qty: Math.min(20, x.qty + qty) } : x));
      return [...c, { id: dish.id, name: dish.name, price: dish.price, emoji: dish.emoji, veg: dish.veg, qty }];
    });
    if (fromEl && cartButton.current) flyToCart(fromEl, cartButton.current, dish.emoji);
  }, []);

  const setQty = useCallback((id, qty) => {
    setCart((c) => (qty <= 0 ? c.filter((x) => x.id !== id) : c.map((x) => (x.id === id ? { ...x, qty: Math.min(20, qty) } : x))));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);
  const rememberOrder = useCallback((id) => setOrderIds((ids) => [id, ...ids.filter((x) => x !== id)].slice(0, 30)), []);

  const signIn = useCallback(({ user, token }) => {
    setToken(token);
    setUser(user);
  }, []);
  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const totals = useMemo(() => {
    const count = cart.reduce((s, x) => s + x.qty, 0);
    const subtotal = cart.reduce((s, x) => s + x.qty * x.price, 0);
    const tax = Math.round(subtotal * 0.05);
    return { count, subtotal, tax, total: subtotal + tax };
  }, [cart]);

  const value = {
    user, signIn, signOut, isStaff: user && ["admin", "kitchen"].includes(user.role), isAdmin: user?.role === "admin",
    table, setTable, cart, add, setQty, clearCart, totals, cartOpen, setCartOpen, cartButton,
    orderIds, rememberOrder, toasts, toast, meta,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Animates a dish emoji along an arc from the tapped button into the cart. */
function flyToCart(fromEl, toEl, emoji) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return pulse(toEl);
  const a = fromEl.getBoundingClientRect();
  const b = toEl.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "fly-emoji";
  el.textContent = emoji;
  el.style.left = `${a.left + a.width / 2 - 18}px`;
  el.style.top = `${a.top + a.height / 2 - 18}px`;
  document.body.appendChild(el);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = el.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 90}px) scale(1.25)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0.6 },
    ],
    { duration: 720, easing: "cubic-bezier(.45,.05,.4,1)" },
  );
  anim.onfinish = () => { el.remove(); pulse(toEl); };
}
function pulse(el) {
  el.animate([{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }], { duration: 380, easing: "cubic-bezier(.3,1.6,.5,1)" });
}
