import axios from "axios";

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

export async function analyzeSentiment(text, rating = null) {

  try {

    const response = await axios.post(
      `${AI_SERVICE_URL}/predict`,
      {
        text,
        rating
      },
      {
        timeout: 10000
      }
    );

    return {
      sentiment: response.data.sentiment || "neutral",
      confidence: Number(response.data.confidence || 0),
      mode: response.data.mode || "ai"
    };

  } catch (error) {

    console.log(
      "AI service unavailable, using backend fallback."
    );

    const positiveWords = [
      "good",
      "great",
      "excellent",
      "amazing",
      "delicious",
      "love",
      "loved",
      "perfect",
      "fresh",
      "tasty",
      "awesome"
    ];

    const negativeWords = [
      "bad",
      "terrible",
      "awful",
      "hate",
      "hated",
      "poor",
      "worst",
      "cold",
      "slow",
      "dirty",
      "bland"
    ];

    const words =
      String(text || "")
        .toLowerCase()
        .match(/[a-z]+/g) || [];

    let positive = 0;
    let negative = 0;

    for (const word of words) {

      if (positiveWords.includes(word)) {
        positive++;
      }

      if (negativeWords.includes(word)) {
        negative++;
      }
    }

    if (rating >= 4) positive += 2;
    if (rating <= 2) negative += 2;

    let sentiment = "neutral";

    if (positive > negative) {
      sentiment = "positive";
    }

    if (negative > positive) {
      sentiment = "negative";
    }

    return {
      sentiment,
      confidence: sentiment === "neutral" ? 0.60 : 0.70,
      mode: "backend-fallback"
    };
  }
}
