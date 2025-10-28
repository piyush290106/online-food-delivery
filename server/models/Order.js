import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  items: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
      qty: Number
    }
  ],
  total: Number,
  deliveryAddress: String,
  status: { type: String, default: "PLACED" }
});

export default mongoose.model("Order", orderSchema);
