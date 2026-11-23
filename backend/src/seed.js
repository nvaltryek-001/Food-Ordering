/**
 * Builds the initial database: menu dataset, staff accounts, reviews drawn from the
 * Restaurant Reviews dataset (scored by the sentiment model) and two weeks of
 * simulated order history so the analytics dashboard has something to show.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { hashPassword } from "./lib/auth.js";
import { loadModel, predictProba, interpret } from "./sentiment.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "../data");

// Reviews that name foods not on this menu read oddly next to Indian dishes, so skip them.
const OFF_MENU = /pizza|crust|burger|pho|sushi|steak|taco|salad|bacon|pasta|sandwich|wing|fries|roll|beef|pork|burrito|chip|salsa|rib|buffet|vegas|sashimi|bagel|hummus|gyro|pita|lobster|scallop|ravoli|ravioli|tuna|salmon|mussel|oyster|crab|nacho|bloody mary|beer|wine|martini|margarita|brisket|meatloaf|potatoes|toast|waffle|pancake|cheesecake|tiramisu|gelato|bread pudding|filet|halibut|spaghetti|lasagna|ham|turkey|duck|lamb|sangria|eggplant|chow mein|egg roll|wonton|dim sum|bbq|hot dog|mac and cheese|cocktail|bar\b|bartender|club|hawaiian|greek|mexican|thai|italian|vietnamese|japanese|chinese|phoenix|airport|downtown|strip|tables|patio|casino|hotel|postino|dessert|sweet|cake|ice cream|coffee|drink|zero stars|\bvegas\b/i;

const NAMES = ["Aarav S.", "Diya P.", "Rohan K.", "Ananya R.", "Vihaan M.", "Isha T.", "Kabir J.", "Meera N.", "Arjun B.", "Saanvi G.", "Aditya V.", "Priya D.", "Reyansh A.", "Kavya L.", "Ishaan C.", "Nisha H.", "Dev R.", "Tara S.", "Yash P.", "Zara K.", "Omkar W.", "Riya F.", "Neel O.", "Pooja U."];

function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function buildSeed({ now = Date.now(), withHistory = true } = {}) {
  const rand = rng(20261122);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const menu = JSON.parse(readFileSync(join(dataDir, "menu.json"), "utf8"));
  const model = loadModel();

  const users = [
    { id: randomUUID(), name: "Asha Menon", email: "admin@foodsense.ai", role: "admin", passwordHash: hashPassword("admin123"), createdAt: new Date(now - 30 * 864e5).toISOString() },
    { id: randomUUID(), name: "Kitchen Crew", email: "kitchen@foodsense.ai", role: "kitchen", passwordHash: hashPassword("kitchen123"), createdAt: new Date(now - 30 * 864e5).toISOString() },
    { id: randomUUID(), name: "Demo Guest", email: "guest@foodsense.ai", role: "customer", passwordHash: hashPassword("guest123"), createdAt: new Date(now - 10 * 864e5).toISOString() },
  ];

  const dishes = menu.map((d) => ({ ...d, createdAt: new Date(now - 60 * 864e5).toISOString() }));

  // ---- Reviews from the dataset -------------------------------------------
  const dataset = readFileSync(join(dataDir, "raw/restaurant_reviews.tsv"), "utf8")
    .split(/\r?\n/).slice(1).filter(Boolean)
    .map((line) => {
      const i = line.lastIndexOf("\t");
      return { text: line.slice(0, i).trim(), label: Number(line.slice(i + 1)) };
    })
    .filter((r) => r.text.length >= 18 && !OFF_MENU.test(r.text));

  // Popular dishes collect more reviews; positive reviews are a bit more common.
  const weights = dishes.map((d) => (d.tags.includes("Bestseller") ? 6 : d.tags.includes("Chef's special") ? 4 : 1));
  const totalW = weights.reduce((a, b) => a + b, 0);
  const weightedDish = () => {
    let x = rand() * totalW;
    for (let i = 0; i < dishes.length; i++) if ((x -= weights[i]) <= 0) return dishes[i];
    return dishes.at(-1);
  };

  const reviews = [];
  for (const r of dataset) {
    if (r.label === 0 && rand() < 0.62) continue;
    const dish = weightedDish();
    const x = rand();
    const rating = r.label === 1 ? (x < 0.6 ? 5 : x < 0.95 ? 4 : 3) : x < 0.5 ? 2 : 1;
    const ai = interpret(predictProba(model, r.text), rating);
    reviews.push({
      id: randomUUID(),
      dishId: dish.id,
      dishName: dish.name,
      name: pick(NAMES),
      rating,
      text: r.text,
      ...ai,
      engine: "naive-bayes",
      source: "Restaurant Reviews dataset",
      createdAt: new Date(now - Math.floor(rand() * 30 * 864e5)).toISOString(),
    });
  }
  reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // ---- Simulated order history -------------------------------------------
  const orders = [];
  let counter = 1000;
  const hours = [8, 9, 10, 12, 12, 13, 13, 13, 14, 16, 17, 19, 19, 20, 20, 20, 21, 21, 22];
  const PAY = ["upi", "upi", "upi", "card", "card", "cash"];
  const makeOrder = (createdAt, status) => {
    const n = 1 + Math.floor(rand() * 4);
    const items = [];
    for (let i = 0; i < n; i++) {
      const d = weightedDish();
      const existing = items.find((x) => x.dishId === d.id);
      if (existing) existing.qty++;
      else items.push({ dishId: d.id, name: d.name, emoji: d.emoji, veg: d.veg, price: d.price, qty: 1 + (rand() < 0.2 ? 1 : 0) });
    }
    const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
    const tax = Math.round(subtotal * 0.05);
    const prep = Math.max(...items.map((x) => dishes.find((d) => d.id === x.dishId).prepMinutes));
    const steps = ["placed", "preparing", "ready", "served"];
    const upto = steps.indexOf(status);
    const timeline = steps.slice(0, upto + 1).map((s, i) => ({ status: s, at: new Date(createdAt + i * (prep / 3) * 60_000).toISOString() }));
    counter++;
    return {
      id: randomUUID(),
      code: `FS-${counter}`,
      tableNumber: String(1 + Math.floor(rand() * 20)),
      customerName: pick(NAMES),
      userId: null,
      items,
      subtotal,
      tax,
      total: subtotal + tax,
      paymentMethod: pick(PAY),
      paymentStatus: "paid",
      status,
      notes: "",
      etaMinutes: prep + 2 * items.length,
      timeline,
      createdAt: new Date(createdAt).toISOString(),
      updatedAt: timeline.at(-1).at,
    };
  };

  if (withHistory) {
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    for (let day = 13; day >= 0; day--) {
      const weekend = [0, 6].includes(new Date(startOfToday.getTime() - day * 864e5).getDay());
      const count = (weekend ? 16 : 10) + Math.floor(rand() * 7);
      for (let i = 0; i < count; i++) {
        const t = startOfToday.getTime() - day * 864e5 + pick(hours) * 36e5 + Math.floor(rand() * 60) * 60_000;
        if (t > now - 45 * 60_000) continue;
        orders.push(makeOrder(t, "served"));
      }
    }
    // A few live tickets so the kitchen board is busy on first launch.
    orders.push(makeOrder(now - 14 * 60_000, "ready"));
    orders.push(makeOrder(now - 9 * 60_000, "preparing"));
    orders.push(makeOrder(now - 6 * 60_000, "preparing"));
    orders.push(makeOrder(now - 2 * 60_000, "placed"));
    orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  return { users, dishes, orders, reviews, counters: { order: counter } };
}
