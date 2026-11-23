/**
 * Embedded JSON document store.
 *
 * The whole dataset (a single restaurant: menu, users, orders, reviews) is small,
 * so it lives in memory and is persisted to disk with debounced, atomic writes
 * (write temp file → rename). No external database is needed to run FoodSense.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_DB_PATH = join(here, "../data/runtime/db.json");

export function createStore(path = process.env.DB_PATH || DEFAULT_DB_PATH) {
  const memory = path === ":memory:";
  let data = { users: [], dishes: [], orders: [], reviews: [], counters: { order: 1000 } };
  if (!memory && existsSync(path)) data = JSON.parse(readFileSync(path, "utf8"));

  let timer = null;
  const flush = () => {
    timer = null;
    if (memory) return;
    mkdirSync(dirname(path), { recursive: true });
    const tmp = `${path}.tmp`;
    writeFileSync(tmp, JSON.stringify(data));
    renameSync(tmp, path);
  };

  const store = {
    path,
    get users() { return data.users; },
    get dishes() { return data.dishes; },
    get orders() { return data.orders; },
    get reviews() { return data.reviews; },
    get isEmpty() { return data.dishes.length === 0; },
    id: () => randomUUID(),
    nextOrderCode() {
      data.counters.order += 1;
      return `FS-${data.counters.order}`;
    },
    replaceAll(next) {
      data = next;
      store.save(true);
    },
    save(immediate = false) {
      if (immediate) return flush();
      if (!timer) timer = setTimeout(flush, 150);
    },
    close() {
      if (timer) {
        clearTimeout(timer);
        flush();
      }
    },
  };
  return store;
}
