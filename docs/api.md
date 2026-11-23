# FoodSense API reference

Base URL: `http://localhost:5000/api` — all bodies are JSON.
Authenticated routes take `Authorization: Bearer <token>` (from `/auth/login` or `/auth/register`).
Errors always look like `{ "error": "Human readable message", "details": { "field": "problem" } }`.

Roles: **guest** (no token), **customer**, **kitchen**, **admin**. Kitchen and admin together are "staff".

## Meta

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/health` | public | Uptime, dish/order counts, open live connections |
| GET | `/meta` | public | Restaurant info, categories with counts, sentiment-model metrics |
| GET | `/tables` | public | Every table with `busy` / `activeOrders` |

## Auth

| Method | Path | Access | Body → Response |
|---|---|---|---|
| POST | `/auth/register` | public | `{ name, email, password }` → `201 { user, token }` (422 field errors, 409 duplicate email) |
| POST | `/auth/login` | public | `{ email, password }` → `{ user, token }` (401 on bad credentials) |
| GET | `/auth/me` | signed in | `{ user }` |

Auth endpoints are rate-limited to 40 requests per 15 minutes per IP.

## Menu

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/dishes` | public | Query: `category`, `q` (multi-word search), `veg=veg\|nonveg`, `tag`, `sort=popular\|rating\|ai\|price-asc\|price-desc\|quick` |
| GET | `/dishes/:id` | public | `{ dish, reviews, pairsWith }` — `pairsWith` is mined from orders that contain the dish |
| PATCH | `/dishes/:id` | admin | `{ available?: boolean, price?: number }` — broadcasts a `menu` live event |

Every dish carries computed stats: `rating` (Bayesian average), `reviewCount`, `aiScore` (mean model score 0–100),
`sentiment { positive, neutral, negative }` and `ordered` (plates sold).

## Orders

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/orders` | public | `{ tableNumber, items: [{ dishId, qty }], paymentMethod: "upi"\|"card"\|"cash", customerName?, notes? }` → `201 { order }`. Prices, GST and ETA are calculated on the server. |
| GET | `/orders/:id` | public (by unguessable id or order code) | `{ order, queuePosition }` |
| GET | `/orders/lookup?ids=a,b` | public | Orders placed from this device |
| GET | `/orders/mine?ids=a,b` | signed in | The user's orders plus device orders |
| POST | `/orders/:id/cancel` | public | Only while status is `placed` |
| GET | `/orders?scope=active\|today\|all` | staff | Kitchen queue |
| PATCH | `/orders/:id/status` | staff | `{ status }` — must move forward: `placed → preparing → ready → served` |

## Reviews & sentiment

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/reviews` | public | Query: `dishId`, `sentiment`, `limit` |
| POST | `/reviews` | public | `{ dishId, rating 1–5, text, orderId?, name? }` → `201 { review, dish }` — the review is scored by the model |
| POST | `/sentiment` | public | `{ text, rating? }` → `{ sentiment, score, probability, engine }` |

## Analytics

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/analytics` | staff | KPIs (vs. same time yesterday), revenue by day (14 d), orders by hour, revenue by section, top dishes, sentiment split, best and worst dishes by model score, latest reviews |

## Live events (Server-Sent Events)

`GET /events?orders=<id,id>&token=<jwt>`

| Event | Who receives it | Payload |
|---|---|---|
| `order` | staff: every order · customers: only the ids in `orders` | full order |
| `review` | staff | the new review |
| `menu` | everyone | `{ id, available, price }` |
