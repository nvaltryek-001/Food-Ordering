import express from "express";
import Food from "../models/Food.js";

const router = express.Router();

/*
  AI-ranked menu
*/

router.get("/", async (req, res) => {
  try {
    const {
      category,
      search
    } = req.query;

    const filter = {
      isAvailable: true
    };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i"
      };
    }

    const foods = await Food.find(filter)
      .sort({
        score: -1,
        rating: -1
      });

    res.json({
      success: true,
      count: foods.length,
      foods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found"
      });
    }

    res.json({
      success: true,
      food
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
