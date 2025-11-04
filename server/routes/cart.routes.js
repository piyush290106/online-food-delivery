// server/routes/cart.routes.js
import { Router } from "express";
import MenuItem from "../models/MenuItem.js";

const router = Router();

router.post("/price", async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    // Normalize qty & collect unique ids
    const normalized = items.map(i => ({
      menuItemId: String(i.menuItemId || "").trim(),
      qty: Math.max(1, Number(i.qty || 1)),
    }));
    const ids = [...new Set(normalized.map(i => i.menuItemId).filter(Boolean))];

    if (!ids.length) {
      return res.status(400).json({ message: "Invalid items" });
    }

    // Fetch from DB
    const dbItems = await MenuItem.find({ _id: { $in: ids } }).lean();
    const dbMap = new Map(dbItems.map(d => [String(d._id), d]));

    // Validate all items exist
    for (const i of normalized) {
      if (!dbMap.get(i.menuItemId)) {
        return res.status(400).json({ message: `Invalid menu item: ${i.menuItemId}` });
      }
    }

    // Build priced list
    const priced = normalized.map(i => {
      const m = dbMap.get(i.menuItemId);
      return {
        menuItemId: i.menuItemId,
        name: m.name,
        price: m.price,
        qty: i.qty,
        subtotal: m.price * i.qty,
        restaurant: String(m.restaurant),
      };
    });

    // Enforce single-restaurant order
    const restaurantSet = new Set(priced.map(p => p.restaurant));
    if (restaurantSet.size > 1) {
      return res.status(400).json({ message: "Items must be from one restaurant" });
    }

    const total = priced.reduce((s, x) => s + x.subtotal, 0);
    res.json({ items: priced, total, restaurant: [...restaurantSet][0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error while pricing cart" });
  }
});

export default router;
