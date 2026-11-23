/**
 * Trains the FoodSense review-sentiment model on the Restaurant Reviews dataset
 * (1,000 labeled reviews, MIT licence — data/raw/restaurant_reviews.tsv).
 *
 * 1. Stratified 80/20 split with a fixed seed → reports held-out metrics.
 * 2. Retrains on all 1,000 reviews and writes data/sentiment-model.json.
 *
 * Run: npm run data:train
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { train, predictProba, MODEL_PATH } from "../src/sentiment.js";

const here = dirname(fileURLToPath(import.meta.url));
const rows = readFileSync(join(here, "../data/raw/restaurant_reviews.tsv"), "utf8")
  .split(/\r?\n/)
  .slice(1)
  .filter(Boolean)
  .map((line) => {
    const i = line.lastIndexOf("\t");
    return { text: line.slice(0, i), label: Number(line.slice(i + 1)) };
  });

function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const rand = rng(42);
const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pos = shuffle(rows.filter((r) => r.label === 1));
const neg = shuffle(rows.filter((r) => r.label === 0));
const cut = (a) => Math.round(a.length * 0.8);
const trainSet = [...pos.slice(0, cut(pos)), ...neg.slice(0, cut(neg))];
const testSet = [...pos.slice(cut(pos)), ...neg.slice(cut(neg))];

const evalModel = train(trainSet);
let tp = 0, tn = 0, fp = 0, fn = 0;
for (const { text, label } of testSet) {
  const pred = predictProba(evalModel, text) >= 0.5 ? 1 : 0;
  if (pred === 1 && label === 1) tp++;
  else if (pred === 0 && label === 0) tn++;
  else if (pred === 1) fp++;
  else fn++;
}
const precision = tp / (tp + fp);
const recall = tp / (tp + fn);
const metrics = {
  dataset: "Restaurant Reviews (1,000 labeled reviews, MIT)",
  trainSize: trainSet.length,
  testSize: testSet.length,
  accuracy: +((tp + tn) / testSet.length).toFixed(4),
  precision: +precision.toFixed(4),
  recall: +recall.toFixed(4),
  f1: +((2 * precision * recall) / (precision + recall)).toFixed(4),
  confusion: { tp, tn, fp, fn },
};

const finalModel = { ...train(rows), metrics, trainedAt: new Date().toISOString() };
writeFileSync(MODEL_PATH, JSON.stringify(finalModel));
console.log("Held-out evaluation:", metrics);
console.log(`Model written to ${MODEL_PATH} (vocab ${finalModel.vocabSize})`);
