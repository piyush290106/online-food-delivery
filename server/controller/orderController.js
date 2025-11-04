// controllers/orderController.js
const Order = require("../models/Order");

exports.markDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveredBy } = req.body || {};

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "cancelled")
      return res.status(400).json({ message: "Cannot deliver a cancelled order" });

    if (order.status === "delivered")
      return res.status(200).json({ message: "Order already delivered", order });

    order.status = "delivered";
    order.deliveredAt = new Date();
    if (deliveredBy) order.deliveredBy = deliveredBy;

    await order.save();

    res.status(200).json({ message: "Order marked as delivered", order });
  } catch (err) {
    console.error("markDelivered error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
