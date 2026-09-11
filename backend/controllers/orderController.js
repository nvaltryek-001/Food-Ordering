import Order from "../models/Order.js";
import Food from "../models/Food.js";


/*
============================================================
CREATE ORDER
============================================================
*/

export async function createOrder(req, res) {

  try {

    const {
      items,
      totalAmount,
      paymentMethod = "demo",
      paymentStatus = "paid",
      tableNumber = null
    } = req.body;


    if (!Array.isArray(items) || items.length === 0) {

      return res.status(400).json({
        success: false,
        message: "Order must contain at least one food item."
      });
    }


    /*
    ----------------------------------------------------------
    Resolve every food item
    ----------------------------------------------------------
    */

    const resolvedItems = [];


    for (const item of items) {

      const foodId =
        item.foodId ||
        item._id ||
        item.id;


      if (!foodId) {

        return res.status(400).json({
          success: false,
          message: "Food ID is missing from an order item."
        });
      }


      const food =
        await Food.findById(foodId);


      if (!food) {

        return res.status(404).json({
          success: false,
          message: `Food not found: ${foodId}`
        });
      }


      const quantity =
        Number(item.quantity || 1);


      if (quantity < 1) {

        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1."
        });
      }


      resolvedItems.push({
        foodId: food._id,
        name: food.name,
        price: Number(food.price || 0),
        quantity
      });
    }


    /*
    ----------------------------------------------------------
    Calculate total from database prices
    ----------------------------------------------------------
    */

    const calculatedTotal =
      resolvedItems.reduce(
        (sum, item) =>
          sum +
          item.price * item.quantity,
        0
      );


    const finalTotal =
      Number.isFinite(Number(totalAmount))
        ? Number(totalAmount)
        : calculatedTotal;


    /*
    ----------------------------------------------------------
    Create order
    ----------------------------------------------------------
    */

    const order =
      await Order.create({

        userId: req.user._id,

        items: resolvedItems,

        tableNumber,

        totalAmount: finalTotal,

        paymentMethod,

        paymentStatus,

        status: "placed",

        reviewAllowed: false
      });


    /*
    ----------------------------------------------------------
    Response
    ----------------------------------------------------------
    */

    return res.status(201).json({

      success: true,

      message: "Order placed successfully.",

      order

    });

  } catch (error) {

    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({

      success: false,

      message: error.message

    });
  }
}


/*
============================================================
MY ORDERS
============================================================
*/

export async function getMyOrders(req, res) {

  try {

    const orders =
      await Order.find({
        userId: req.user._id
      })
      .populate("items.foodId")
      .sort({
        createdAt: -1
      });


    return res.json({

      success: true,

      orders

    });

  } catch (error) {

    console.error(
      "Get my orders error:",
      error
    );

    return res.status(500).json({

      success: false,

      message: error.message

    });
  }
}


/*
============================================================
MANAGER UPDATE ORDER STATUS
============================================================
*/

export async function updateOrderStatus(
  req,
  res
) {

  try {

    const {
      status
    } = req.body;


    const allowedStatuses = [
      "placed",
      "accepted",
      "preparing",
      "served",
      "cancelled"
    ];


    if (
      !allowedStatuses.includes(status)
    ) {

      return res.status(400).json({

        success: false,

        message:
          `Invalid order status: ${status}`
      });
    }


    const order =
      await Order.findById(
        req.params.id
      );


    if (!order) {

      return res.status(404).json({

        success: false,

        message: "Order not found."
      });
    }


    order.status =
      status;


    if (status === "served") {

      order.reviewAllowed =
        true;
    }


    await order.save();


    return res.json({

      success: true,

      message:
        `Order status updated to ${status}.`,

      order

    });

  } catch (error) {

    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({

      success: false,

      message: error.message

    });
  }
}