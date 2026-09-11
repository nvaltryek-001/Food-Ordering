# FoodSense AI Deployment

## 1. MongoDB Atlas

Create a MongoDB Atlas database.

Set:

MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER/foodsense_ai

Do NOT deploy:

mongodb://127.0.0.1:27017/foodsense_ai

## 2. Backend - Render

Root directory:

backend

Build:

npm install

Start:

npm start

Environment:

PORT=5000
NODE_ENV=production
MONGO_URI=YOUR_ATLAS_URI
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
CLIENT_URL=YOUR_VERCEL_URL
AI_SERVICE_URL=YOUR_AI_SERVICE_URL

Health:

/api/health

## 3. Frontend - Vercel

Root directory:

frontend

Build:

npm run build

Output:

dist

Environment:

VITE_API_URL=https://YOUR-RENDER-BACKEND.onrender.com/api

## 4. Important

Never put MongoDB password, JWT secret, Gemini/API keys or other secrets inside frontend code.

## 5. Final production flow

Customer
  -> Login
  -> Scan QR
  -> Menu
  -> Cart
  -> Checkout
  -> Order

Manager
  -> Login
  -> Accept
  -> Preparing
  -> Served

Customer
  -> Review
  -> RNN sentiment
  -> Food score
  -> Ranking

