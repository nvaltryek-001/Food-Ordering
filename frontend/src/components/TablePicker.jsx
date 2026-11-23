import { useApp } from "../lib/store.jsx";
import { Icon } from "./icons.jsx";
import { Dialog, useFetch } from "./ui.jsx";

/** Seat map of the restaurant floor. Used from the header and on checkout. */
export function TableGrid({ value, onChange }) {
  const { data } = useFetch("/tables");
  const tables = data?.tables || Array.from({ length: 20 }, (_, i) => ({ number: String(i + 1), busy: false }));
  return (
    <div className="table-grid" role="radiogroup" aria-label="Table number">
      {tables.map((t) => (
        <button
          key={t.number}
          type="button"
          role="radio"
          aria-checked={value === t.number}
          className={`table-seat ${value === t.number ? "is-selected" : ""} ${t.busy ? "is-busy" : ""}`}
          onClick={() => onChange(t.number)}
          title={t.busy ? "Has an order in progress" : "Free"}
        >
          {t.number}
        </button>
      ))}
    </div>
  );
}

export function TablePicker({ open, onClose }) {
  const { table, setTable, toast } = useApp();
  return (
    <Dialog open={open} onClose={onClose} title="Choose your table" className="table-dialog">
      <div className="sheet-head">
        <div>
          <h2>Where are you sitting?</h2>
          <p className="muted small">The number is on the QR card on your table. Dotted tables already have an order cooking.</p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close" data-autofocus><Icon name="close" /></button>
      </div>
      <TableGrid value={table} onChange={(n) => { setTable(n); toast(`Table ${n} selected`, "success"); onClose(); }} />
    </Dialog>
  );
}
