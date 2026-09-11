import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Food from "../models/Food.js";
import { authenticate, managerOnly } from "../middleware/auth.js";

const router = express.Router();

/* =========================================================
   CREATE ORDER
   POST /api/orders
========================================================= */
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      items,
      tableNumber = null,
      paymentMethod = "demo",
      paymentStatus = "paid"
    } = req.body;

    console.log("\n========== CREATE ORDER ==========");
    console.log("Request user:", req.user);
    console.log("Request items:", JSON.stringify(items, null, 2));

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item"
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {

      // Accept all common frontend formats
      const foodId =
        item.foodId ??
        item.food ??
        item._id ??
        item.id ??
        item.food?._id ??
        item.food?.id;

      console.log("Resolved foodId:", foodId);

      if (!foodId) {
        return res.status(400).json({
          success: false,
          message: "Food ID is missing from order item"
        });
      }

      if (!mongoose.Types.ObjectId.isValid(foodId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid food ID: ${foodId}`
        });
      }

      const quantity = Number(item.quantity ?? 1);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive integer"
        });
      }

      const food = await Food.findById(foodId);

      if (!food) {
        return res.status(404).json({
          success: false,
          message: `Food not found: ${foodId}`
        });
      }

      if (food.isAvailable === false) {
        return res.status(400).json({
          success: false,
          message: `${food.name} is currently unavailable`
        });
      }

      const price = Number(food.price);

      if (!Number.isFinite(price)) {
        return res.status(500).json({
          success: false,
          message: `Invalid price for food: ${food.name}`
        });
      }

      orderItems.push({
        foodId: food._id,
        name: food.name,
        price,
        quantity
      });

      totalAmount += price * quantity;
    }

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found"
      });
    }

    const order = await Order.create({
      userId,
      items: orderItems,
      tableNumber,
      totalAmount,
      paymentMethod,
      paymentStatus,
      status: "placed",
      reviewAllowed: false
    });

    console.log("ORDER CREATED:", order._id);
    console.log("Total:", totalAmount);
    console.log("=================================\n");

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order
    });

  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order"
    });
  }
});


/* =========================================================
   GET MY ORDERS
   GET /api/orders/my
========================================================= */
router.get("/my", authenticate, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const orders = await Order.find({ userId })
      .populate("items.foodId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error("GET MY ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders"
    });
  }
});


/* =========================================================
   GET ALL ORDERS FOR MANAGER
   GET /api/orders/manager/all
========================================================= */
router.get("/manager/all", authenticate, managerOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("items.foodId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error("MANAGER ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch manager orders"
    });
  }
});


/* =========================================================
   UPDATE ORDER STATUS
   PATCH /api/orders/:id/status
========================================================= */
router.patch("/:id/status", authenticate, managerOnly, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "placed",
      "accepted",
      "preparing",
      "served",
      "cancelled"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    order.status = status;

    if (status === "served") {
      order.reviewAllowed = true;
    }

    await order.save();

    return res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    });

  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status"
    });
  }
});


export default router;