import { useApp } from "../lib/store.jsx";
import { money } from "../lib/api.js";
import { navigate } from "../lib/router.jsx";
import { Icon } from "./icons.jsx";
import { Dialog, Empty, QtyStepper, VegMark } from "./ui.jsx";

export function CartSheet() {
  const { cart, setQty, totals, cartOpen, setCartOpen, table, clearCart } = useApp();
  const close = () => setCartOpen(false);
  return (
    <Dialog open={cartOpen} onClose={close} variant="sheet" title="Your order" className="cart-sheet">
      <div className="sheet-head">
        <div>
          <h2>Your order</h2>
          <p className="muted small">{table ? `Serving to table ${table}` : "Choose your table at checkout"}</p>
        </div>
        <button className="icon-btn" onClick={close} aria-label="Close" data-autofocus><Icon name="close" /></button>
      </div>

      {cart.length === 0 ? (
        <Empty emoji="🍽️" title="Your plate is empty" action={<button className="btn btn-primary" onClick={() => { close(); navigate("/menu"); }}>Browse the menu</button>}>
          Add a few dishes and they'll show up here.
        </Empty>
      ) : (
        <>
          <ul className="cart-list">
            {cart.map((item) => (
              <li key={item.id} className="cart-item">
                <span className="cart-emoji" aria-hidden="true">{item.emoji}</span>
                <div className="cart-item-main">
                  <p className="cart-item-name"><VegMark veg={item.veg} size={12} /> {item.name}</p>
                  <p className="muted small">{money(item.price)} each</p>
                </div>
                <QtyStepper qty={item.qty} onChange={(q) => setQty(item.id, q)} size="sm" label={item.name} />
                <span className="cart-line">{money(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <button className="link-btn small" onClick={clearCart}>Clear order</button>
          <div className="sheet-foot">
            <dl className="bill">
              <div><dt>Items</dt><dd>{money(totals.subtotal)}</dd></div>
              <div><dt>GST (5%)</dt><dd>{money(totals.tax)}</dd></div>
              <div className="bill-total"><dt>To pay</dt><dd>{money(totals.total)}</dd></div>
            </dl>
            <button className="btn btn-primary btn-lg btn-block" onClick={() => { close(); navigate("/checkout"); }}>
              Go to checkout <Icon name="arrowRight" size={18} />
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
