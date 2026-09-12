# 🚀 FoodSense AI — Production Deployment

## Architecture

Vercel
  ↓
React Frontend
  ↓
Render
  ↓
Node / Express API
  ↓
MongoDB Atlas
  ↓
AI Service

---

## 1. MongoDB Atlas

Create database:

foodsense_ai

Production variable:

MONGO_URI=mongodb+srv://...

---

## 2. Render Backend

Root directory:

backend

Build:

npm install

Start:

npm start

Environment variables:

NODE_ENV=production
PORT=10000
MONGO_URI=...
JWT_SECRET=...
CLIENT_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
AI_SERVICE_URL=https://YOUR-AI-SERVICE-URL

---

## 3. Vercel Frontend

Root directory:

frontend

Build command:

npm run build

Output:

dist

Environment variable:

VITE_API_URL=https://YOUR-RENDER-BACKEND.onrender.com/api

---

## 4. CORS

CLIENT_URL must exactly match the Vercel frontend URL.

---

## 5. Never deploy:

.env
MongoDB passwords
JWT secrets
Gemini/API keys
local database URLs
