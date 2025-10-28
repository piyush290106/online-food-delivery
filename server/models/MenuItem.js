import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  name: String,
  description: String,
  price: Number,
  image: String
});

export default mongoose.model("MenuItem", menuItemSchema);
