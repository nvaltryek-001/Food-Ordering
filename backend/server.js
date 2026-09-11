import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import {
  connectDatabase
} from "./config/database.js";

import authRoutes from "./routes/auth.js";
import foodRoutes from "./routes/food.js";
import orderRoutes from "./routes/order.js";
import reviewRoutes from "./routes/review.js";
import analyticsRoutes from "./routes/analytics.js";
import healthRoutes from "./routes/health.js";

const app = express();

const PORT =
  process.env.PORT || 5000;

app.use(
  helmet()
);

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
    credentials: true
  })
);

app.use(
  express.json({
    limit: "2mb"
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(
  morgan("dev")
);

const limiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  });

app.use(
  "/api",
  limiter
);

/* ============================================================
   API ROUTES
   ============================================================ */

app.use(
  "/api/health",
  healthRoutes
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/foods",
  foodRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/reviews",
  reviewRoutes
);

app.use(
  "/api/analytics",
  analyticsRoutes
);

/* ============================================================
   ROOT
   ============================================================ */

app.get(
  "/",
  (req, res) => {
    res.json({
      name: "FoodSense AI",
      description:
        "Food Ordering and Review Analyzer API",
      version: "1.0.0",
      status: "running"
    });
  }
);

/* ============================================================
   404
   ============================================================ */

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "API endpoint not found",
      path: req.originalUrl
    });
  }
);

/* ============================================================
   ERROR HANDLER
   ============================================================ */

app.use(
  (error, req, res, next) => {
    console.error(error);

    res.status(
      error.status || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Internal server error"
    });
  }
);

/* ============================================================
   START SERVER
   ============================================================ */

async function startServer() {
  await connectDatabase();

  app.listen(
    PORT,
    () => {
      console.log("");
      console.log(
        "================================================"
      );
      console.log(
        "       FoodSense AI Backend"
      );
      console.log(
        "================================================"
      );
      console.log("");
      console.log(
        `🚀 Server: http://localhost:${PORT}`
      );
      console.log(
        `❤️ Health: http://localhost:${PORT}/api/health`
      );
      console.log("");
      console.log(
        "API Routes:"
      );
      console.log(
        "POST /api/auth/register"
      );
      console.log(
        "POST /api/auth/login"
      );
      console.log(
        "GET  /api/foods"
      );
      console.log(
        "POST /api/orders"
      );
      console.log(
        "GET  /api/orders/my"
      );
      console.log(
        "POST /api/reviews"
      );
      console.log(
        "GET  /api/reviews/analytics"
      );
      console.log(
        "GET  /api/analytics/dashboard"
      );
      console.log("");
    }
  );
}

startServer();
