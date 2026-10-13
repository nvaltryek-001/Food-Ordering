# 🍔 FoodSense AI — Smart Food Ordering & Review Analysis Platform

A full-stack food ordering platform that combines a modern React interface, backend APIs, database integration, and AI-powered food review analysis to deliver a smarter food ordering experience.

## 🚀 Overview

**FoodSense AI** is designed to simplify online food ordering while providing intelligent insights from customer reviews. Users can explore food items, manage their cart, place orders, and view order history through an interactive web interface.

The platform includes a separate AI service for food review analysis and a backend responsible for application APIs and database operations.

## ✨ Key Features

- 🔐 **User Authentication** — User registration and login.
- 🍽️ **Food Catalogue** — Browse and explore available food items.
- 🛒 **Shopping Cart** — Add food items and update quantities.
- 📦 **Order Management** — Complete checkout and create orders.
- 🧾 **Order History** — Retrieve previously placed orders.
- 🤖 **AI Review Analysis** — Dedicated AI service for food review analysis.
- 🔌 **REST API Integration** — Communication between the frontend and backend services.
- 📱 **Responsive Interface** — Designed to support different screen sizes.
- 🧪 **Automated Testing** — UI and end-to-end tests for important user flows.

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Node.js, Express.js |
| Database | Configured application database |
| AI Service | Python, FastAPI |
| AI Model | TensorFlow Lite model integration |
| Testing | Playwright and automated UI tests |
| Version Control | Git and GitHub |

## 🏗️ System Architecture

```text
                  ┌──────────────────────┐
                  │       User           │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ React + Vite Frontend│
                  │ Food Catalogue       │
                  │ Cart & Checkout      │
                  │ Orders & Reviews     │
                  └──────────┬───────────┘
                             │
                  ┌──────────┴───────────┐
                  ▼                      ▼
       ┌──────────────────┐   ┌──────────────────┐
       │ Express Backend  │   │ FastAPI AI       │
       │ REST APIs        │   │ Review Analysis  │
       └────────┬─────────┘   └──────────────────┘
                │
                ▼
       ┌──────────────────┐
       │ Application      │
       │ Database         │
       └──────────────────┘
```

## 📂 Project Structure

```text
FoodSense/
├── frontend/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── package.json
│   └── server source files
├── ai/
│   └── AI service source files
├── setup.ps1
├── run.ps1
├── build.ps1
├── test.ps1
├── FINAL-STATUS.txt
└── README.md
```

*Note: The exact folders and files may differ depending on the current repository contents.*

## ⚙️ Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) and npm
- [Python](https://www.python.org/)
- Git
- A configured application database
- Required Python and Node.js dependencies

## 💻 Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/nvaltryek-001/Food-Ordering.git
cd Food-Ordering
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

Open another terminal:

```bash
cd backend
npm install
```

Configure the backend environment variables and database connection using the environment variable names expected by the application.

### 4. Install AI service dependencies

Open another terminal:

```bash
cd ai
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the dependencies listed in the AI service's requirements file, if provided:

```bash
pip install -r requirements.txt
```

Configure the AI model and other required resources according to the project setup.

## ▶️ Running the Application

Run each service in a separate terminal.

### Frontend

```bash
cd frontend
npm run dev
```

### Backend

```bash
cd backend
npm run
```

Use the backend's configured start script from its `package.json` (for example, `npm run dev` or `npm start`).

### AI Service

Start the FastAPI application using its configured entry point. For example, if `ai/app.py` exposes an `app` object:

```bash
cd ai
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```

The AI service entry point and start command should match the actual project configuration.

## 🧪 Build and Testing

### Build the frontend

```bash
cd frontend
npm run build
```

### Run automated tests

The repository includes Playwright UI and end-to-end test files under `frontend/tests/`.

Check the configured test scripts in `frontend/package.json`. If Playwright is configured, install its browser dependencies and run the corresponding test command.

```bash
npx playwright install
```

The production frontend build has completed successfully in the development environment. Automated tests have also previously passed for key flows, including registration/login, cart quantity updates, checkout, order history, and UI checks.

## 🔄 Application Workflow

1. The user opens the FoodSense AI
