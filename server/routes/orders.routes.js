import { Router } from "express";
import { auth } from "../middleware/auth.js";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";

const router = Router();

/**
 * Create an order
 * Body: { items: [{ menuItemId, qty }], deliveryAddress }
 */
router.post("/", auth, async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    const ids = items.map(i => i.menuItemId);
    const dbItems = await MenuItem.find({ _id: { $in: ids } });

    // Map for O(1) lookups & to avoid relying on array index alignment
    const itemMap = new Map(dbItems.map(m => [String(m._id), m]));

    // Normalize and validate
    const lineItems = [];
    for (const i of items) {
      const m = itemMap.get(String(i.menuItemId));
      if (!m) {
        return res.status(400).json({ message: `Menu item not found: ${i.menuItemId}` });
      }
      const qty = Number(i.qty) || 0;
      if (qty <= 0) {
        return res.status(400).json({ message: "Quantity must be > 0" });
      }
      lineItems.push({ menuItem: m._id, qty, _price: m.price, _restaurant: m.restaurant });
    }

    // Ensure all items are from the same restaurant (typical for single-restaurant orders)
    const restaurant = lineItems[0]._restaurant;
    const mixed = lineItems.some(li => String(li._restaurant) !== String(restaurant));
    if (mixed) {
      return res.status(400).json({ message: "All items must be from the same restaurant" });
    }

    // Compute total safely
    const total = lineItems.reduce((sum, li) => sum + li._price * li.qty, 0);

    const order = await Order.create({
      user: req.user.id,
      restaurant,
      items: lineItems.map(({ menuItem, qty }) => ({ menuItem, qty })),
      total,
      deliveryAddress,
      // if your schema has 'status' default, you can omit it here
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Get my orders
 */
router.get("/me", auth, async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate({ path: "restaurant", select: "name" })
    .populate({ path: "items.menuItem", select: "name price" });

  res.json(orders);
});


/**
 * Mark order as delivered
 * PATCH /api/orders/:id/deliver
 * Body (optional): { deliveredBy: "Rider-42" }
 */
router.patch("/:id/deliver", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveredBy } = req.body || {};

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Optional: enforce who can deliver (admin/rider/restaurant owner). Minimal version allows any authed user.
    // if (req.user.role === 'customer' && String(order.user) !== String(req.user.id)) {
    //   return res.status(403).json({ message: "Not allowed" });
    // }

    if (order.status === "cancelled") {
      return res.status(400).json({ message: "Cannot deliver a cancelled order" });
    }

    if (order.status === "delivered") {
      return res.status(200).json({ message: "Order already delivered", order });
    }

    order.status = "delivered";
    order.deliveredAt = new Date();
    if (deliveredBy) order.deliveredBy = deliveredBy;

    await order.save();

    res.status(200).json({ message: "Order marked as delivered", order });
  } catch (err) {
    console.error("Deliver order error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
