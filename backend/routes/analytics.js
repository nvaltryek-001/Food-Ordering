import express from "express";

import Food from "../models/Food.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";

const router = express.Router();

router.get(
  "/dashboard",
  async (req, res) => {
    try {
      const [
        totalOrders,
        totalReviews,
        foods
      ] = await Promise.all([
        Order.countDocuments(),
        Review.countDocuments(),
        Food.find()
          .sort({
            score: -1
          })
          .limit(10)
      ]);

      const revenueData =
        await Order.aggregate([
          {
            $match: {
              paymentStatus: "paid"
            }
          },
          {
            $group: {
              _id: null,
              revenue: {
                $sum: "$total"
              }
            }
          }
        ]);

      const revenue =
        revenueData[0]?.revenue || 0;

      const reviews =
        await Review.find();

      const positive =
        reviews.filter(
          r => r.sentiment === "positive"
        ).length;

      const neutral =
        reviews.filter(
          r => r.sentiment === "neutral"
        ).length;

      const negative =
        reviews.filter(
          r => r.sentiment === "negative"
        ).length;

      res.json({
        success: true,

        metrics: {
          totalOrders,
          totalReviews,
          totalRevenue: revenue,

          positive,
          neutral,
          negative
        },

        topFoods: foods
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;
