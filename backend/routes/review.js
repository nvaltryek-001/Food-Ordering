import express from "express";

import Review from "../models/Review.js";
import Food from "../models/Food.js";
import Order from "../models/Order.js";

import { authenticate } from "../middleware/auth.js";

import { analyzeSentiment } from "../services/sentimentService.js";
import { calculateFoodScore } from "../services/foodScoreService.js";

const router = express.Router();

/*
=========================================================
SUBMIT REVIEW
POST /api/reviews
=========================================================
*/
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      foodId,
      orderId,
      rating,
      text
    } = req.body;

    console.log("\n========== REVIEW REQUEST ==========");
    console.log("User:", req.user);
    console.log("Food ID:", foodId);
    console.log("Order ID:", orderId);
    console.log("Rating:", rating);
    console.log("Text:", text);

    /*
    -----------------------------------------------------
    Validate input
    -----------------------------------------------------
    */

    if (!foodId || !orderId || rating === undefined || !text) {
      return res.status(400).json({
        success: false,
        message: "foodId, orderId, rating and text are required"
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isFinite(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    /*
    -----------------------------------------------------
    Find food
    -----------------------------------------------------
    */

    const food = await Food.findById(foodId);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found"
      });
    }

    /*
    -----------------------------------------------------
    Find order
    -----------------------------------------------------
    */

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    /*
    -----------------------------------------------------
    IMPORTANT FIX
    Order schema uses userId, NOT customer
    -----------------------------------------------------
    */

    const currentUserId = req.user?._id || req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "User authentication information missing"
      });
    }

    if (String(order.userId) !== String(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: "You cannot review this order"
      });
    }

    /*
    -----------------------------------------------------
    Review allowed only after served
    -----------------------------------------------------
    */

    if (order.status !== "served") {
      return res.status(400).json({
        success: false,
        message: "You can review the order only after it is served"
      });
    }

    if (!order.reviewAllowed) {
      return res.status(400).json({
        success: false,
        message: "Review is not available for this order"
      });
    }

    /*
    -----------------------------------------------------
    Verify food belongs to this order
    -----------------------------------------------------
    */

    const orderedFood = order.items.find(
      item => String(item.foodId) === String(foodId)
    );

    if (!orderedFood) {
      return res.status(400).json({
        success: false,
        message: "This food was not included in the selected order"
      });
    }

    /*
    -----------------------------------------------------
    Prevent duplicate review
    -----------------------------------------------------
    */

    const existingReview = await Review.findOne({
      order: orderId,
      food: foodId,
      customer: currentUserId
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You already reviewed this food"
      });
    }

    /*
    =====================================================
    AI SENTIMENT ANALYSIS
    =====================================================
    */

    let analysis;

    try {
      analysis = await analyzeSentiment(
        String(text).trim(),
        numericRating
      );
    } catch (aiError) {
      console.error("AI sentiment error:", aiError);

      /*
      Safe fallback if AI service is unavailable
      */

      let sentiment = "neutral";

      if (numericRating >= 4) {
        sentiment = "positive";
      } else if (numericRating <= 2) {
        sentiment = "negative";
      }

      analysis = {
        sentiment,
        confidence: 0.5,
        aspects: {
          food: sentiment,
          delivery: "neutral",
          packaging: "neutral",
          overall: sentiment
        },
        mode: "fallback"
      };
    }

    /*
    =====================================================
    FOOD SCORE CALCULATION
    =====================================================
    */

    const score = calculateFoodScore(
      food,
      analysis.sentiment
    );

    /*
    -----------------------------------------------------
    Update food statistics
    -----------------------------------------------------
    */

    const update = {
      score: score.newScore,
      rating: score.newScore,
      reviews: Number(food.reviews || 0) + 1
    };

    if (analysis.sentiment === "positive") {
      update.totalPositive =
        Number(food.totalPositive || 0) + 1;
    }

    if (analysis.sentiment === "neutral") {
      update.totalNeutral =
        Number(food.totalNeutral || 0) + 1;
    }

    if (analysis.sentiment === "negative") {
      update.totalNegative =
        Number(food.totalNegative || 0) + 1;
    }

    /*
    -----------------------------------------------------
    Update food
    -----------------------------------------------------
    */

    const updatedFood = await Food.findByIdAndUpdate(
      foodId,
      update,
      {
        new: true,
        runValidators: true
      }
    );

    /*
    =====================================================
    SAVE REVIEW
    =====================================================
    */

    const review = await Review.create({
      customer: currentUserId,

      food: foodId,

      order: orderId,

      customerName:
        req.user?.name ||
        req.user?.email ||
        "Customer",

      foodName: food.name,

      rating: numericRating,

      text: String(text).trim(),

      sentiment: analysis.sentiment,

      confidence:
        Number(analysis.confidence) || 0,

      aspects:
        analysis.aspects || {
          food: "neutral",
          delivery: "neutral",
          packaging: "neutral",
          overall: "neutral"
        }
    });

    /*
    =====================================================
    RESPONSE
    =====================================================
    */

    console.log("REVIEW CREATED:", review._id);
    console.log("Sentiment:", analysis.sentiment);
    console.log("Confidence:", analysis.confidence);
    console.log("Old Score:", score.oldScore);
    console.log("New Score:", score.newScore);
    console.log("====================================\n");

    return res.status(201).json({
      success: true,

      message:
        "Review analyzed and food score updated",

      review,

      analysis,

      scoreUpdate: {
        previousScore: score.oldScore,
        newScore: score.newScore,
        change: score.change
      },

      food: updatedFood
    });

  } catch (error) {
    console.error("SUBMIT REVIEW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit review"
    });
  }
});


/*
=========================================================
GET REVIEWS FOR FOOD
GET /api/reviews/food/:foodId
=========================================================
*/

router.get("/food/:foodId", async (req, res) => {
  try {
    const reviews = await Review.find({
      food: req.params.foodId
    })
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      reviews
    });

  } catch (error) {
    console.error("GET FOOD REVIEWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch reviews"
    });
  }
});


/*
=========================================================
GET REVIEW ANALYTICS
GET /api/reviews/analytics
=========================================================
*/

router.get("/analytics", async (req, res) => {
  try {
    const reviews = await Review.find();

    const total = reviews.length;

    const positive = reviews.filter(
      r => r.sentiment === "positive"
    ).length;

    const neutral = reviews.filter(
      r => r.sentiment === "neutral"
    ).length;

    const negative = reviews.filter(
      r => r.sentiment === "negative"
    ).length;

    const averageRating =
      total > 0
        ? Number(
            (
              reviews.reduce(
                (sum, review) =>
                  sum + Number(review.rating || 0),
                0
              ) / total
            ).toFixed(1)
          )
        : 0;

    return res.json({
      success: true,

      analytics: {
        totalReviews: total,

        positive,

        neutral,

        negative,

        positivePercentage:
          total > 0
            ? Math.round((positive / total) * 100)
            : 0,

        neutralPercentage:
          total > 0
            ? Math.round((neutral / total) * 100)
            : 0,

        negativePercentage:
          total > 0
            ? Math.round((negative / total) * 100)
            : 0,

        averageRating
      }
    });

  } catch (error) {
    console.error("REVIEW ANALYTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch review analytics"
    });
  }
});


export default router;

