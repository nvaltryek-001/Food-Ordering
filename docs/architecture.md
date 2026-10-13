# FoodSense AI Architecture

## Services

- **React + Vite frontend** (`frontend/`): customer ordering, QR/table flow, manager UI, reviews, and analytics views.
- **Express API** (`backend/`): authentication, food catalog, orders, reviews, analytics, and health endpoints.
- **MongoDB**: persistent users, foods, orders, and reviews. Configure `MONGO_URI`; do not use an ephemeral/local database for production.
- **FastAPI sentiment service** (`ai/`): original TFLite review model plus its vocabulary. The model and vocabulary are bundled under `ai/models/`.
- **Android applications** (`Food-Ordering-Application-with-Review-Analyzer-master/`): original customer and manager Android clients.

## Request flow

Frontend → Express API → MongoDB. Review sentiment requests may be sent by the API to the separate FastAPI service using `AI_SERVICE_URL`. Keep each service's environment configuration separate.

## Important operational notes

- A frontend build alone does not prove database connectivity or production readiness.
- Payment handling is a demo flow; no payment processor is integrated by this package.
- The food catalog must be populated with legitimate menu data for the restaurant that will operate the application.
- The AI model should be evaluated against a labeled, representative review dataset before making accuracy claims.
