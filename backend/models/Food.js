import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    image: {
      type: String,
      default: ""
    },

    rating: {
      type: Number,
      default: 4
    },

    score: {
      type: Number,
      default: 4
    },

    reviews: {
      type: Number,
      default: 0
    },

    totalPositive: {
      type: Number,
      default: 0
    },

    totalNeutral: {
      type: Number,
      default: 0
    },

    totalNegative: {
      type: Number,
      default: 0
    },

    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Food", foodSchema);
