# FoodSense AI — Food Ordering & Review Analysis

FoodSense AI combines a React/Vite web client, Express/MongoDB API, a FastAPI/TFLite review-sentiment service, and the original Android customer/manager applications.

> **Important:** This ZIP is a cleaned and documented rebuild of the uploaded source, not a claim that every feature is production-verified. The frontend build could not be verified in this environment because dependency installation did not complete. Payment remains a demo flow, production database/API credentials are not included, and the food catalog must be populated with the real restaurant's menu.

## Features present in the source

- Customer menu, cart, checkout/order flow, QR/table workflow, reviews, and profile UI in the web application.
- Manager-facing order/menu/review/analytics views.
- Express API routes for authentication, foods, orders, reviews, analytics, and health.
- MongoDB models for users, foods, orders, and reviews.
- FastAPI sentiment service with the supplied TFLite model and vocabulary.
- Original Android customer and manager applications.

## Architecture

See [`docs/architecture.md`](docs/architecture.md). API overview: [`docs/api.md`](docs/api.md).

## Prerequisites

- Windows 10/11 with PowerShell 5.1 or PowerShell 7
- Node.js 22 LTS recommended and npm
- Python 3.11 or 3.12 recommended for the AI service (the available TFLite runtime may not support every Python version)
- MongoDB local installation or a MongoDB Atlas database
- Android Studio only if building the Android applications

## Quick setup (Windows)

Extract this ZIP, open PowerShell in the `FoodSense-AI-Rebuilt` folder, and run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\setup.ps1
```

Configure `backend/.env` from `backend/.env.example` and set a strong unique `JWT_SECRET` plus your `MONGO_URI`. Configure `frontend/.env` from `frontend/.env.example`. If using the AI service, configure `ai/.env` from `ai/.env.example`.

Then run the API and frontend:

```powershell
.\run.ps1
```

Run the AI service in another terminal when its dependencies are installed:

```powershell
.\run.ps1 -IncludeAI
```

The frontend defaults to `http://localhost:5173`, API to `http://localhost:5000`, and AI to `http://127.0.0.1:8000`.

## Data and model

- The TFLite model and vocabulary are supplied under `ai/models/` and are the model artifacts from the uploaded project.
- The current ZIP does **not** contain a verified, complete public food/review training dataset. The backend has a dataset acquisition script at `backend/scripts/download-datasets.ps1`; review its source URLs, terms, and output before running it.
- Do not describe seeded menu records as a real restaurant menu. Import the menu from the restaurant owner or an authorized source.
- Evaluate the model using a labeled dataset representative of your users before publishing accuracy claims.

## Commands

```powershell
.\test.ps1     # backend JS syntax checks + available tests
.\build.ps1    # production frontend build and backend syntax checks
```

For deployment guidance see [`DEPLOYMENT.md`](DEPLOYMENT.md). Hosting requires your own MongoDB URI, JWT secret, frontend URL, and service URLs. Never commit `.env` files or secrets.

## GitHub update safety

The supplied ZIP does not include `.git` history. Extract it separately, then compare the source with your existing clone before copying changes into that clone. Review `git status` and `git diff`, run tests, and only then commit and push. Do not force-push or replace the remote repository blindly.

## Verification status

- Archive structure and core source files: inspected.
- Several empty, unused frontend stubs and backup copies from the supplied archive: removed.
- Backend health endpoint: now reports HTTP 503 when MongoDB is disconnected.
- AI requirements: now declare the LiteRT package used by the service.
- Automated frontend build: **not verified** in this environment; dependency installation did not complete.
- Production deployment, live database integration, payment processing, and end-to-end browser tests: **not verified**.

See [`FINAL-STATUS.txt`](FINAL-STATUS.txt) for the delivery audit.
