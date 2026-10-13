import express from "express";
import mongoose from "mongoose";

const router = express.Router();

router.get("/", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "degraded",
    service: "FoodSense AI Backend",
    database: connected ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

export default router;
