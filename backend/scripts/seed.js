import "dotenv/config";

import mongoose from "mongoose";

import {
  connectDatabase
} from "../config/database.js";

import Food from "../models/Food.js";
import User from "../models/User.js";

import bcrypt from "bcryptjs";

const foods = [
  {
    name: "Chicken Burger",
    category: "Burgers",
    price: 149,
    rating: 4.8,
    score: 4.7,
    reviews: 124,
    description:
      "Juicy grilled chicken with fresh lettuce, tomatoes and special house sauce.",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80"
  },

  {
    name: "Paneer Pizza",
    category: "Pizza",
    price: 229,
    rating: 4.6,
    score: 4.5,
    reviews: 98,
    description:
      "Crispy pizza loaded with paneer, vegetables and melted cheese.",
    image:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&q=80"
  },

  {
    name: "Chicken Biryani",
    category: "Biryani",
    price: 199,
    rating: 4.4,
    score: 4.3,
    reviews: 86,
    description:
      "Aromatic basmati rice cooked with tender chicken and traditional spices.",
    image:
      "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=700&q=80"
  },

  {
    name: "French Fries",
    category: "Snacks",
    price: 99,
    rating: 4.2,
    score: 4.1,
    reviews: 74,
    description:
      "Golden crispy fries served hot with signature seasoning.",
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=80"
  },

  {
    name: "Masala Dosa",
    category: "South Indian",
    price: 89,
    rating: 4.7,
    score: 4.6,
    reviews: 65,
    description:
      "Crispy dosa filled with flavorful potato masala.",
    image:
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=700&q=80"
  },

  {
    name: "Chocolate Shake",
    category: "Drinks",
    price: 129,
    rating: 4.5,
    score: 4.4,
    reviews: 51,
    description:
      "Creamy chocolate shake topped with whipped cream.",
    image:
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=700&q=80"
  }
];

async function seed() {
  await connectDatabase();

  await Food.deleteMany({});

  await Food.insertMany(foods);

  const password =
    await bcrypt.hash(
      "Manager@123",
      10
    );

  const manager =
    await User.findOne({
      email: "manager@foodsense.ai"
    });

  if (!manager) {
    await User.create({
      name: "FoodSense Manager",
      email: "manager@foodsense.ai",
      password,
      role: "manager"
    });
  }

  console.log("");
  console.log("================================");
  console.log("FoodSense AI Seed Complete");
  console.log("================================");
  console.log("");
  console.log("Manager Login");
  console.log("Email: manager@foodsense.ai");
  console.log("Password: Manager@123");
  console.log("");

  await mongoose.connection.close();
}

seed().catch(error => {
  console.error(error);
  process.exit(1);
});
