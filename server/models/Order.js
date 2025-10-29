import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    items: [
      {
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
        qty: { type: Number, required: true, min: 1 }
      }
    ],
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["PLACED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"], default: "PLACED" },
    deliveryAddress: { type: String, required: true }
  },
  { timestamps: true }  // <— add this
);

export default mongoose.model("Order", orderSchema);
