import "dotenv/config.js";
import { connectDB } from "../config/db.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/menuitem.js";

const run = async () => {
  await connectDB(process.env.MONGO_URI);
  await Restaurant.deleteMany({});
  await MenuItem.deleteMany({});

  const r = await Restaurant.create({
    name: "Spice Route",
    address: "Curry Street",
    cuisine: ["Indian"],
    image: "https://picsum.photos/400"
  });

  await MenuItem.insertMany([
    { restaurant: r._id, name: "Paneer Tikka", price: 200 },
    { restaurant: r._id, name: "Veg Biryani", price: 180 }
  ]);

  console.log("Seeded sample data ✅");
  process.exit();
};
run();
