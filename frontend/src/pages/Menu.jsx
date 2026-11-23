import { useEffect, useMemo, useRef, useState } from "react";
import { navigate } from "../lib/router.jsx";
import { useApp } from "../lib/store.jsx";
import { live, money, timeAgo } from "../lib/api.js";
import { Icon } from "../components/icons.jsx";
import { Dialog, Empty, ErrorNote, Katori, QtyStepper, SentimentBar, SentimentChip, Skeleton, Spice, Stars, VegMark, useFetch } from "../components/ui.jsx";

const SORTS = [
  ["menu", "Menu order"],
  ["popular", "Most ordered"],
  ["rating", "Highest rated"],
  ["quick", "Quickest to cook"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
];

export default function Menu({ params }) {
  const { data, error, loading, reload, setData } = useFetch("/dishes");
  const { meta } = useApp();
  const [q, setQ] = useState("");
  const [diet, setDiet] = useState("all");
  const [sort, setSort] = useState("menu");
  const [active, setActive] = useState(null);
  const sectionRefs = useRef({});

  // Sold-out changes from the kitchen arrive live.
  useEffect(() => live({}, {
    menu: (u) => setData((d) => d && { ...d, dishes: d.dishes.map((x) => (x.id === u.id ? { ...x, ...u } : x)) }),
  }), []);

  const categories = meta?.categories?.map((c) => c.name) || [...new Set((data?.dishes || []).map((d) => d.category))];

  const filtered = useMemo(() => {
    let list = data?.dishes || [];
    if (diet === "veg") list = list.filter((d) => d.veg);
    if (diet === "nonveg") list = list.filter((d) => !d.veg);
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length) list = list.filter((d) => terms.every((t) => `${d.name} ${d.category} ${d.description} ${d.tags.join(" ")}`.toLowerCase().includes(t)));
    const s = {
      popular: (a, b) => b.ordered - a.ordered,
      rating: (a, b) => b.rating - a.rating,
      quick: (a, b) => a.prepMinutes - b.prepMinutes,
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
    }[sort];
    return s ? [...list].sort(s) : list;
  }, [data, q, diet, sort]);

  const grouped = sort === "menu" && !q;
  const groups = grouped ? categories.map((c) => [c, filtered.filter((d) => d.category === c)]).filter(([, l]) => l.length) : [["", filtered]];

  // Scroll-spy for the category rail.
  useEffect(() => {
    if (!grouped) return;
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setActive(vis[0].target.dataset.cat);
    }, { rootMargin: "-120px 0px -60% 0px" });
    Object.values(sectionRefs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [grouped, groups.length, data]);

  const jump = (cat) => {
    const el = sectionRefs.current[cat];
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 128, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <div className="menu-layout">
      <aside className="menu-rail" aria-label="Categories">
        <p className="rail-title">On the menu</p>
        <ul>
          {categories.map((c) => {
            const n = (data?.dishes || []).filter((d) => d.category === c).length;
            return (
              <li key={c}>
                <button className={`rail-link ${active === c && grouped ? "is-active" : ""}`} onClick={() => { setSort("menu"); setQ(""); setTimeout(() => jump(c), 0); }}>
                  <span>{c}</span><span className="rail-count">{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="menu-main">
        <div className="menu-toolbar">
          <label className="search">
            <Icon name="search" size={18} />
            <span className="sr-only">Search dishes</span>
            <input type="search" placeholder="Search dosa, paneer, biryani…" value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <button className="search-clear" onClick={() => setQ("")} aria-label="Clear search"><Icon name="close" size={16} /></button>}
          </label>
          <div className="segmented" role="radiogroup" aria-label="Diet">
            {[["all", "All"], ["veg", "Veg"], ["nonveg", "Non-veg"]].map(([v, l]) => (
              <button key={v} role="radio" aria-checked={diet === v} className={diet === v ? "is-on" : ""} onClick={() => setDiet(v)}>
                {v !== "all" && <span aria-hidden="true"><VegMark veg={v === "veg"} size={11} /></span>}{l}
              </button>
            ))}
          </div>
          <label className="select">
            <span className="sr-only">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>

        <div className="chip-scroller" aria-hidden={false}>
          {categories.map((c) => (
            <button key={c} className={`chip-btn ${active === c && grouped ? "is-on" : ""}`} onClick={() => { setSort("menu"); setQ(""); setTimeout(() => jump(c), 0); }}>{c}</button>
          ))}
        </div>

        {error && <ErrorNote error={error} onRetry={reload} />}
        {loading && !data && <div className="dish-list">{Array.from({ length: 6 }, (_, i) => <DishSkeleton key={i} />)}</div>}

        {data && filtered.length === 0 && (
          <Empty emoji="🔍" title={`Nothing matches “${q}”`} action={<button className="btn btn-ghost" onClick={() => { setQ(""); setDiet("all"); }}>Clear filters</button>}>
            Try a dish name like “dosa” or an ingredient like “paneer”.
          </Empty>
        )}

        {data && filtered.length > 0 && !grouped && <p className="results-count muted small">{filtered.length} dishes</p>}

        {data && groups.map(([cat, list]) => (
          <section key={cat || "all"} className="menu-section" data-cat={cat} ref={(el) => (sectionRefs.current[cat] = el)}>
            {cat && <h2 className="menu-section-title">{cat}<span className="muted"> {list.length}</span></h2>}
            <div className="dish-list">{list.map((d) => <DishRow key={d.id} dish={d} />)}</div>
          </section>
        ))}
      </div>

      <DishDialog id={params.dishId} onClose={() => navigate("/menu")} />
    </div>
  );
}

function DishSkeleton() {
  return (
    <div className="dish-row is-loading">
      <Skeleton h={72} w={72} r={999} />
      <div style={{ flex: 1, display: "grid", gap: 8 }}><Skeleton w="50%" h={18} /><Skeleton w="85%" /><Skeleton w="30%" /></div>
    </div>
  );
}

export function AddButton({ dish, compact }) {
  const { cart, add, setQty } = useApp();
  const inCart = cart.find((x) => x.id === dish.id);
  if (!dish.available) return <span className="sold-out">Sold out</span>;
  if (inCart) return <QtyStepper qty={inCart.qty} onChange={(q) => setQty(dish.id, q)} size={compact ? "sm" : "md"} label={dish.name} />;
  return (
    <button className="btn btn-add" onClick={(e) => add(dish, 1, e.currentTarget)} aria-label={`Add ${dish.name} to order`}>
      <Icon name="plus" size={16} /> Add
    </button>
  );
}

function DishRow({ dish }) {
  const liked = dish.reviewCount ? Math.round((dish.sentiment.positive / dish.reviewCount) * 100) : null;
  return (
    <article className={`dish-row ${dish.available ? "" : "is-unavailable"}`}>
      <button className="dish-hit" onClick={() => navigate(`/menu/${dish.id}`)} aria-label={`Details for ${dish.name}`} />
      <Katori emoji={dish.emoji} size={76} />
      <div className="dish-body">
        <div className="dish-title-row">
          <VegMark veg={dish.veg} />
          <h3 className="dish-name">{dish.name}</h3>
          {dish.tags.filter((t) => t !== "Spicy").slice(0, 1).map((t) => <span key={t} className={`tag tag-${t.replace(/\W/g, "").toLowerCase()}`}>{t}</span>)}
        </div>
        <p className="dish-desc">{dish.description}</p>
        <div className="dish-meta">
          {dish.reviewCount ? (
            <span className="rating"><Icon name="star" size={13} fill="currentColor" /> {dish.rating.toFixed(1)}<span className="muted"> ({dish.reviewCount})</span></span>
          ) : <span className="tag tag-new">New</span>}
          {liked != null && dish.reviewCount >= 3 && <span className="muted">{liked}% liked it</span>}
          <span className="muted"><Icon name="clock" size={13} /> {dish.prepMinutes} min</span>
          <Spice level={dish.spice} />
        </div>
      </div>
      <div className="dish-buy">
        <span className="price">{money(dish.price)}</span>
        <AddButton dish={dish} />
      </div>
    </article>
  );
}

function DishDialog({ id, onClose }) {
  const { data, error, loading } = useFetch(id ? `/dishes/${id}` : null, [id]);
  const { add, cart } = useApp();
  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [id]);
  const dish = data?.dish;
  const inCart = dish && cart.find((x) => x.id === dish.id);

  return (
    <Dialog open={!!id} onClose={onClose} variant="sheet" title={dish?.name || "Dish"} className="dish-sheet">
      <div className="sheet-head sheet-head-float">
        <span />
        <button className="icon-btn" onClick={onClose} aria-label="Close" data-autofocus><Icon name="close" /></button>
      </div>
      {error && <ErrorNote error={error} />}
      {loading && !dish && <div className="dish-sheet-body"><Skeleton h={160} r={999} w={160} /><Skeleton h={28} w="60%" /><Skeleton h={60} /></div>}
      {dish && dish.id === id && (
        <div className="dish-sheet-body">
          <div className="dish-hero">
            <Katori emoji={dish.emoji} size={168} className="katori-xl" />
          </div>
          <div className="row gap-8 wrap">
            <VegMark veg={dish.veg} size={16} />
            <span className="muted small">{dish.category}</span>
            {dish.tags.map((t) => <span key={t} className={`tag tag-${t.replace(/\W/g, "").toLowerCase()}`}>{t}</span>)}
          </div>
          <h2 className="dish-sheet-title">{dish.name}</h2>
          <p className="dish-sheet-desc">{dish.description}.</p>

          <dl className="facts">
            <div><dt>Rating</dt><dd>{dish.reviewCount ? <><Icon name="star" size={15} fill="currentColor" className="star-ic" /> {dish.rating.toFixed(1)}</> : "New"}</dd></div>
            <div><dt>Ready in</dt><dd>{dish.prepMinutes} min</dd></div>
            <div><dt>Energy</dt><dd>~{dish.kcal} kcal</dd></div>
            <div><dt>Spice</dt><dd>{["None", "Mild", "Medium", "Hot"][dish.spice]}</dd></div>
          </dl>

          <div className="buy-bar">
            <span className="price price-lg">{money(dish.price * qty)}</span>
            {dish.available ? (
              <>
                <QtyStepper qty={qty} onChange={(q) => setQty(Math.max(1, q))} label={dish.name} />
                <button className="btn btn-primary" onClick={(e) => { add(dish, qty, e.currentTarget); onClose(); }}>
                  {inCart ? `Add ${qty} more` : "Add to order"}
                </button>
              </>
            ) : <span className="sold-out">Sold out right now</span>}
          </div>

          <section className="dish-section">
            <div className="row between">
              <h3>What diners said</h3>
              {dish.aiScore != null && <span className="muted small">Model score {dish.aiScore}/100</span>}
            </div>
            <SentimentBar sentiment={dish.sentiment} />
            <ul className="review-list">
              {data.reviews.slice(0, 6).map((r) => (
                <li key={r.id} className="review">
                  <div className="row between">
                    <span className="row gap-8"><Stars value={r.rating} size={12} /><b className="small">{r.name}</b></span>
                    <SentimentChip sentiment={r.sentiment} />
                  </div>
                  <p>{r.text}</p>
                  <span className="muted small">{timeAgo(r.createdAt)}</span>
                </li>
              ))}
              {!data.reviews.length && <li className="muted">No reviews yet — order it and be the first.</li>}
            </ul>
          </section>

          {data.pairsWith.length > 0 && (
            <section className="dish-section">
              <h3>Often ordered with</h3>
              <div className="pairs">
                {data.pairsWith.map((p) => (
                  <div key={p.id} className="pair">
                    <button className="pair-hit" onClick={() => navigate(`/menu/${p.id}`, { replace: true })} aria-label={`View ${p.name}`} />
                    <span className="pair-emoji" aria-hidden="true">{p.emoji}</span>
                    <span className="pair-name">{p.name}</span>
                    <span className="muted small">{money(p.price)}</span>
                    <AddButton dish={p} compact />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Dialog>
  );
}
