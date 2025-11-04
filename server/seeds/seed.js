import "dotenv/config.js";
import { connectDB } from "../config/db.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

const run = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    console.log("🌱 Seeding started (All Veg • Mumbai, India)...");
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});

    // 1) Indian Veg
    const r1 = await Restaurant.create({
      name: "Spice Route (Veg)",
      address: "Curry Street, Mumbai, India",
      image: "https://picsum.photos/seed/indianveg/600/400",
      cuisine: ["Indian", "Vegetarian"]
    });
    await MenuItem.insertMany([
      { restaurant: r1._id, name: "Paneer Tikka", description: "Grilled cottage cheese with tikka spices.", price: 220, image: "https://picsum.photos/seed/paneertikka/500/300" },
      { restaurant: r1._id, name: "Veg Biryani", description: "Aromatic basmati rice with vegetables and spices.", price: 200, image: "https://picsum.photos/seed/vegbiryani/500/300" },
      { restaurant: r1._id, name: "Butter Naan", description: "Soft tandoor-baked naan with butter.", price: 60, image: "https://picsum.photos/seed/butternaan/500/300" }
    ]);

    // 2) Italian Veg
    const r2 = await Restaurant.create({
      name: "Pasta Palace (Veg)",
      address: "Marina Road, Mumbai, India",
      image: "https://picsum.photos/seed/italianveg/600/400",
      cuisine: ["Italian", "Vegetarian"]
    });
    await MenuItem.insertMany([
      { restaurant: r2._id, name: "Margherita Pizza", description: "Tomato, mozzarella, basil.", price: 320, image: "https://picsum.photos/seed/margherita/500/300" },
      { restaurant: r2._id, name: "Penne Alfredo (Veg)", description: "Creamy parmesan sauce, no egg.", price: 300, image: "https://picsum.photos/seed/pennealfredo/500/300" },
      { restaurant: r2._id, name: "Veg Lasagna", description: "Layers of pasta, veggies, cheese.", price: 340, image: "https://picsum.photos/seed/veglasagna/500/300" }
    ]);

    // 3) Chinese Veg
    const r3 = await Restaurant.create({
      name: "Dragon Dynasty (Veg)",
      address: "Lantern Street, Mumbai, India",
      image: "https://picsum.photos/seed/chineseveg/600/400",
      cuisine: ["Chinese", "Asian", "Vegetarian"]
    });
    await MenuItem.insertMany([
      { restaurant: r3._id, name: "Veg Chow Mein", description: "Stir-fried noodles with mixed veggies.", price: 240, image: "https://picsum.photos/seed/vegchowmein/500/300" },
      { restaurant: r3._id, name: "Veg Fried Rice", description: "Wok-tossed rice with vegetables.", price: 220, image: "https://picsum.photos/seed/vegfriedrice/500/300" },
      { restaurant: r3._id, name: "Veg Momos", description: "Steamed dumplings stuffed with greens.", price: 180, image: "https://picsum.photos/seed/vegmomos/500/300" }
    ]);

    // 4) South Indian Veg
    const r4 = await Restaurant.create({
      name: "Coastal Leaf (Veg)",
      address: "Temple Lane, Mumbai, India",
      image: "https://picsum.photos/seed/southindianveg/600/400",
      cuisine: ["South Indian", "Vegetarian"]
    });
    await MenuItem.insertMany([
      { restaurant: r4._id, name: "Masala Dosa", description: "Crispy dosa with spiced potato filling.", price: 140, image: "https://picsum.photos/seed/masaladosa/500/300" },
      { restaurant: r4._id, name: "Idli Sambar", description: "Steamed rice cakes with sambar & chutneys.", price: 120, image: "https://picsum.photos/seed/idlisambar/500/300" },
      { restaurant: r4._id, name: "Medu Vada", description: "Crispy lentil fritters.", price: 110, image: "https://picsum.photos/seed/meduvada/500/300" }
    ]);

    // 5) Bakery & Desserts (Veg)
    const r5 = await Restaurant.create({
      name: "Sweet Cravings (Veg)",
      address: "Frosting Lane, Mumbai, India",
      image: "https://picsum.photos/seed/dessertsveg/600/400",
      cuisine: ["Desserts", "Bakery", "Vegetarian"]
    });
    await MenuItem.insertMany([
      { restaurant: r5._id, name: "Chocolate Truffle Cake", description: "Eggless rich chocolate cake.", price: 180, image: "https://picsum.photos/seed/chocotruffle/500/300" },
      { restaurant: r5._id, name: "Blueberry Muffin (Eggless)", description: "Soft muffin with blueberries.", price: 110, image: "https://picsum.photos/seed/egglessmuffin/500/300" },
      { restaurant: r5._id, name: "Buttery Croissant (Veg)", description: "Flaky croissant (veg shortening).", price: 120, image: "https://picsum.photos/seed/vegcroissant/500/300" }
    ]);

    console.log("✅ Seeding completed (All Veg • Mumbai).");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding data:", err);
    process.exit(1);
  }
};

run();
