import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn("⚠️ MONGO_URI is not configured.");
    return false;
  }

  try {
    await mongoose.connect(uri);

    console.log("✅ MongoDB connected");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error(error.message);

    return false;
  }
}
