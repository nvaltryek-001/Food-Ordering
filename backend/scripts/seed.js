/** Resets data/runtime/db.json to a freshly seeded state. Run: npm run seed */
import { createStore } from "../src/db.js";
import { buildSeed } from "../src/seed.js";

const db = createStore();
db.replaceAll(buildSeed());
console.log(`Seeded ${db.path}: ${db.dishes.length} dishes, ${db.reviews.length} reviews, ${db.orders.length} orders, ${db.users.length} users`);
