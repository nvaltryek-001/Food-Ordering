# Architecture

```
            ┌─────────────── browser ────────────────┐
 QR on table│  /t/12 → menu → cart → checkout → track │   diner (phone)
            │  /kitchen  live ticket board             │   kitchen (tablet)
            │  /admin    analytics · menu · table QRs  │   owner
            └───────────────┬──────────────────────────┘
                 fetch JSON │  ▲ Server-Sent Events (/api/events)
                            ▼  │
            ┌──────────────────────────────────────────┐
            │ Node.js API (backend/src) — no npm deps   │
            │  lib/http.js   router, CORS, rate limits, │
            │                security headers, static   │
            │  lib/auth.js   scrypt passwords, HS256 JWT│
            │  services.js   pricing, order flow, stats │
            │  sentiment.js  Naive Bayes review model ──┼──► optional /ai TFLite service
            │  events.js     SSE hub                    │
            │  db.js         JSON document store        │
            └───────────────┬──────────────────────────┘
                            ▼
              backend/data/runtime/db.json  (seeded from the datasets on first run)
```

## Why these choices

- **Zero-dependency backend.** Everything the API needs (HTTP routing, JWT, password hashing, SSE, gzip) is in Node's standard library, so `npm start` works on any machine with Node 20+ — nothing to install, nothing to audit.
- **Embedded JSON store.** One restaurant's data (≈200 dishes, a few thousand orders) fits comfortably in memory. Writes are debounced and atomic (temp file + rename). The store is a small module (`db.js`), so swapping in Postgres or MongoDB means re-implementing one file.
- **Server-side pricing.** The client only sends dish ids and quantities. Prices, GST and the ETA are recalculated on the server so a modified client can't change the bill.
- **SSE over WebSockets.** Updates only flow server → browser, so Server-Sent Events are simpler, reconnect automatically and pass through ordinary proxies.
- **React + esbuild.** The UI is React 19 with no other runtime libraries: a 50-line router, hand-written SVG charts and a built-in QR encoder. esbuild produces the production bundle in ~100 ms.

## Data pipeline

```
data/raw/menu_items.json          scripts/build-menu.js         data/menu.json
(214 rows: name, section, price,  ───────────────────────────►  212 dishes + veg flag, spice,
 description)                      dedupe + enrich                prep time, kcal, emoji, tags

data/raw/restaurant_reviews.tsv   scripts/train-sentiment.js    data/sentiment-model.json
(1,000 labelled reviews, MIT)     ───────────────────────────►  Naive Bayes, unigrams+bigrams,
                                   80/20 stratified split         negation handling;
                                   → metrics → retrain on all     84% accuracy / 0.85 F1 held-out

src/seed.js  → users, dataset reviews assigned to dishes (scored by the model),
               14 days of simulated orders, 4 live kitchen tickets
```

## Order lifecycle

```
placed ──► preparing ──► ready ──► served
   └──► cancelled (diner, only before cooking starts)
```

Every transition is appended to `order.timeline` and broadcast as an `order` event.
Cash orders become `paid` when served; UPI/card are marked paid at checkout (payments are simulated).

## Sentiment scoring

`P(positive | text)` from the model is blended with the star rating (70 / 30) to label a review
`positive` (≥ 0.6), `negative` (≤ 0.4) or `neutral`, and to give it a 0–100 score.
A dish's **model score** is the mean score of its reviews; the dashboard's *Needs attention* list
is the lowest-scoring dishes with at least three reviews.
