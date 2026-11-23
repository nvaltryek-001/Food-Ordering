/**
 * Builds data/menu.json from the raw FoodSense menu dataset (data/raw/menu_items.json).
 *
 * Raw rows are [name, category, price, description]. This script de-duplicates the
 * rows and enriches each dish with derived attributes the UI relies on:
 * veg / non-veg, spice level, preparation time, calorie estimate, emoji artwork and tags.
 *
 * Run: npm run data:menu
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(readFileSync(join(here, "../data/raw/menu_items.json"), "utf8"));

const CATEGORY_MAP = {
  "South Indian": "South Indian",
  "North Indian": "North Indian",
  "Rice & Biryani": "Biryani & Rice",
  Chinese: "Indo-Chinese",
  "Fast Food": "Fast Food",
  Snacks: "Street Snacks",
  "Non-Veg": "Tandoor & Grill",
  Beverages: "Hot & Cold Drinks",
  Juices: "Juices & Shakes",
  Desserts: "Desserts",
  "Ice Cream": "Ice Cream",
};

const NON_VEG = /chicken|mutton|egg|omelette|fish|prawn|keema/i;
const SPICY_3 = /schezwan|chilli|65|pepper|mirchi|dragon|peri peri|kolhapuri|chettinad|vindaloo/i;
const SPICY_2 = /masala|biryani|tikka|kadai|manchurian|curry|bhaji|samosa|chole|65|bhurji|tandoori|kebab|lollipop|pakoda|bajji|vada|maggi/i;
const SPICY_1 = /dal|paneer|dosa|uttapam|noodles|fried rice|pulao|paratha|wrap|roll|sandwich|burger|pizza|momos|bonda|cutlet|thali|bath|rice/i;

const EMOJI_RULES = [
  [/ice cream|sundae/i, "🍨"],
  [/cake|brownie/i, "🍰"],
  [/gulab|rasmalai|jalebi/i, "🍡"],
  [/kheer|payasam|halwa|kesari/i, "🍮"],
  [/fruit salad/i, "🍓"],
  [/coffee|tea|chocolate$|hot chocolate/i, "☕"],
  [/shake|lassi|milk|buttermilk/i, "🥛"],
  [/juice|punch|lime/i, "🧃"],
  [/pizza/i, "🍕"],
  [/burger/i, "🍔"],
  [/fries/i, "🍟"],
  [/sandwich/i, "🥪"],
  [/wrap|roll/i, "🌯"],
  [/momos|samosa|spring roll/i, "🥟"],
  [/noodles|maggi/i, "🍜"],
  [/biryani|fried rice|pulao|rice bowl|schezwan rice|jeera rice|ghee rice|steamed rice/i, "🍚"],
  [/curd rice|lemon rice|tamarind rice|bisibele|pongal/i, "🍛"],
  [/dosa|uttapam/i, "🥞"],
  [/idli/i, "🍥"],
  [/vada|bonda|pakoda|bajji|cutlet/i, "🧆"],
  [/naan|roti|paratha|bhature|poori|kathi/i, "🫓"],
  [/omelette|egg/i, "🍳"],
  [/chicken|mutton|kebab|tikka|tandoori|lollipop/i, "🍗"],
  [/corn/i, "🌽"],
  [/peanut/i, "🥜"],
  [/thali/i, "🍱"],
  [/paneer/i, "🧀"],
  [/.*/, "🍛"],
];

const PREP_BY_CATEGORY = {
  "South Indian": 12, "North Indian": 18, "Biryani & Rice": 22, "Indo-Chinese": 15,
  "Fast Food": 12, "Street Snacks": 10, "Tandoor & Grill": 25, "Hot & Cold Drinks": 5,
  "Juices & Shakes": 6, Desserts: 6, "Ice Cream": 3,
};

const KCAL_BY_CATEGORY = {
  "South Indian": 320, "North Indian": 420, "Biryani & Rice": 560, "Indo-Chinese": 460,
  "Fast Food": 520, "Street Snacks": 280, "Tandoor & Grill": 480, "Hot & Cold Drinks": 140,
  "Juices & Shakes": 220, Desserts: 360, "Ice Cream": 250,
};

const BESTSELLERS = new Set([
  "Masala Dosa", "Paneer Butter Masala", "Hyderabadi Chicken Biryani", "Butter Chicken",
  "Chole Bhature", "Chicken Momos", "Pav Bhaji", "Filter Coffee", "Mango Lassi",
  "Gulab Jamun", "Veg Hakka Noodles", "Chicken 65", "Dal Makhani", "Cold Coffee",
]);
const CHEF_SPECIAL = new Set([
  "Mysore Masala Dosa", "North Indian Special Thali", "Mutton Biryani", "Dragon Chicken",
  "Jalebi With Rabdi", "Chicken Tandoori", "Kanchipuram Idli", "Brownie With Ice Cream",
]);

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Small deterministic hash -> stable pseudo-random values per dish.
function hash(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967295;
}

const seen = new Set();
const menu = [];
for (const [name, rawCategory, price, description] of raw) {
  const key = name.toLowerCase();
  if (seen.has(key) || /gajar ka halwa/i.test(name)) continue; // duplicate of Carrot Halwa
  seen.add(key);

  const category = CATEGORY_MAP[rawCategory] || rawCategory;
  const veg = !NON_VEG.test(name);
  const spice = SPICY_3.test(name) ? 3 : SPICY_2.test(name) ? 2 : SPICY_1.test(name) ? 1 : 0;
  const r = hash(name);
  const tags = [];
  if (BESTSELLERS.has(name)) tags.push("Bestseller");
  if (CHEF_SPECIAL.has(name)) tags.push("Chef's special");
  if (spice === 3) tags.push("Spicy");
  if (veg && /dal|idli|green tea|buttermilk|juice|fruit salad|steamed|upma|pongal/i.test(name)) tags.push("Light");

  menu.push({
    id: slug(name),
    name,
    category,
    price,
    description,
    veg,
    spice,
    prepMinutes: Math.round(PREP_BY_CATEGORY[category] * (0.8 + r * 0.5)),
    kcal: Math.round((KCAL_BY_CATEGORY[category] * (0.75 + r * 0.6)) / 10) * 10,
    emoji: EMOJI_RULES.find(([re]) => re.test(name))[1],
    tags,
    available: true,
  });
}

writeFileSync(join(here, "../data/menu.json"), JSON.stringify(menu, null, 2) + "\n");
const cats = [...new Set(menu.map((m) => m.category))];
console.log(`menu.json: ${menu.length} dishes across ${cats.length} categories`);
