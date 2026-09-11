import express from "express";

import {
  createOrder,
  getMyOrders,
  updateOrderStatus
} from "../controllers/orderController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();


/*
Customer
*/

router.post(
  "/",
  protect,
  createOrder
);


router.get(
  "/my",
  protect,
  getMyOrders
);


/*
Manager
*/

router.patch(
  "/:id/status",
  protect,
  updateOrderStatus
);


export default router;