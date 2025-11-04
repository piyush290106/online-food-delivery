// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        qty: { type: Number, required: true },
      },
    ],
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    total: { type: Number, required: true },
    deliveryAddress: { type: String, required: true },

    // ✅ new fields
    status: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "placed",
    },
    deliveredAt: { type: Date, default: null },
    deliveredBy: { type: String, default: null },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
