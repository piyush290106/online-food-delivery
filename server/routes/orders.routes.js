import { Router } from "express";
import { auth } from "../middleware/auth.js";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";

const router = Router();

router.post("/", auth, async (req, res) => {
  const { items, deliveryAddress } = req.body;
  const ids = items.map(i => i.menuItemId);
  const dbItems = await MenuItem.find({ _id: { $in: ids } });
  const total = dbItems.reduce((sum, m, idx) => sum + m.price * items[idx].qty, 0);
  const restaurant = dbItems[0].restaurant;
  const order = await Order.create({
    user: req.user.id,
    restaurant,
    items: items.map((i, idx) => ({ menuItem: ids[idx], qty: i.qty })),
    total,
    deliveryAddress
  });
  res.status(201).json(order);
});

router.get("/me", auth, async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .populate("restaurant")
    .populate("items.menuItem");
  res.json(orders);
});

export default router;
