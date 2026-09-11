import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food"
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },

    customerName: String,

    foodName: String,

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },

    text: {
      type: String,
      required: true
    },

    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral"
    },

    confidence: {
      type: Number,
      default: 0
    },

    aspects: {
      food: {
        type: String,
        default: "neutral"
      },

      delivery: {
        type: String,
        default: "neutral"
      },

      packaging: {
        type: String,
        default: "neutral"
      },

      overall: {
        type: String,
        default: "neutral"
      }
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Review", reviewSchema);
