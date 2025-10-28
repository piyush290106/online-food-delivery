import { Router } from "express";
import MenuItem from "../models/MenuItem.js";

const router = Router();

router.post("/price", async (req, res) => {
  const { items } = req.body;
  const ids = items.map(i => i.menuItemId);
  const dbItems = await MenuItem.find({ _id: { $in: ids } });
  let total = 0;
  const priced = items.map(i => {
    const m = dbItems.find(d => String(d._id) === i.menuItemId);
    const subtotal = m.price * i.qty;
    total += subtotal;
    return { ...i, name: m.name, subtotal };
  });
  res.json({ items: priced, total });
});

export default router;
