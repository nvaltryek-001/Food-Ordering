# API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Backend and database health |
| POST | `/auth/register` | Register a customer |
| POST | `/auth/login` | Authenticate a user |
| GET | `/foods` | List available menu items; supports `category` and `search` query parameters |
| GET | `/foods/:id` | Get one menu item |
| POST | `/orders` | Create an authenticated order |
| GET | `/orders/my` | List the authenticated user's orders |
| POST | `/reviews` | Submit an authenticated review |
| GET | `/reviews/analytics` | Review sentiment/ratings analytics |
| GET | `/analytics/dashboard` | Manager analytics |

Authenticated routes expect `Authorization: Bearer <JWT>`. Exact manager endpoints and payloads should be checked in `backend/routes/` before client integration; this reference lists the main routes exposed by the current source.
