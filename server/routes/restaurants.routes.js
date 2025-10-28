import { Router } from "express";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

const router = Router();

router.get("/", async (_req, res) => {
  res.json(await Restaurant.find());
});

router.get("/:id/menu", async (req, res) => {
  res.json(await MenuItem.find({ restaurant: req.params.id }));
});

export default router;
