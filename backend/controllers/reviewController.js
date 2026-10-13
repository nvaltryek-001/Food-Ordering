import Review from "../models/Review.js";
import { analyzeSentiment } from "../services/sentimentService.js";

export async function listReviews(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 200);
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, count: reviews.length, reviews });
  } catch (error) { next(error); }
}

export async function analyzeReview(req, res, next) {
  try {
    const text = String(req.body?.text || "").trim();
    const rating = req.body?.rating == null ? null : Number(req.body.rating);
    if (!text) return res.status(400).json({ success: false, message: "Review text is required" });
    if (rating !== null && (!Number.isFinite(rating) || rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }
    const result = await analyzeSentiment(text, rating);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
}
