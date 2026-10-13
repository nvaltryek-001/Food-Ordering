import Food from "../models/Food.js";

export async function listFoods(req, res, next) {
  try {
    const filter = { isAvailable: true };
    if (req.query.category && req.query.category !== "All") filter.category = req.query.category;
    if (req.query.search) filter.name = { $regex: String(req.query.search).slice(0, 100), $options: "i" };
    const foods = await Food.find(filter).sort({ score: -1, rating: -1 }).limit(200);
    res.json({ success: true, count: foods.length, foods });
  } catch (error) { next(error); }
}

export async function getFood(req, res, next) {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: "Food not found" });
    res.json({ success: true, food });
  } catch (error) { next(error); }
}

export async function createFood(req, res, next) {
  try {
    const { name, category, price, description = "", image = "" } = req.body;
    if (!String(name || "").trim() || !String(category || "").trim() || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: "Valid name, category, and non-negative price are required" });
    }
    const food = await Food.create({ name: String(name).trim(), category: String(category).trim(), price: Number(price), description, image });
    res.status(201).json({ success: true, food });
  } catch (error) { next(error); }
}

export async function updateFood(req, res, next) {
  try {
    const allowed = ["name", "category", "price", "description", "image", "isAvailable"];
    const update = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
    if ("price" in update && (!Number.isFinite(Number(update.price)) || Number(update.price) < 0)) {
      return res.status(400).json({ success: false, message: "Price must be non-negative" });
    }
    const food = await Food.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!food) return res.status(404).json({ success: false, message: "Food not found" });
    res.json({ success: true, food });
  } catch (error) { next(error); }
}

export async function deleteFood(req, res, next) {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: "Food not found" });
    res.json({ success: true, message: "Food deleted" });
  } catch (error) { next(error); }
}
