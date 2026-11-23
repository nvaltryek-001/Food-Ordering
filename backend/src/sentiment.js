/**
 * FoodSense sentiment engine — a multinomial Naive Bayes classifier with
 * negation handling and unigram+bigram features, trained on the
 * Restaurant Reviews dataset (see scripts/train-sentiment.js).
 *
 * Optionally the backend can call the Python TFLite service in /ai instead
 * (set AI_SERVICE_URL). If that service is unreachable we fall back to this model.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
export const MODEL_PATH = join(here, "../data/sentiment-model.json");

const NEGATORS = new Set(["not", "no", "never", "dont", "didnt", "doesnt", "isnt", "wasnt", "wont", "cant", "couldnt", "wouldnt", "aint", "nothing", "hardly", "barely"]);
const STOP = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "for", "it", "is", "was", "this", "that", "i", "we", "my", "our", "they", "were", "be", "been", "are", "as", "with", "so", "me", "you", "had", "have", "has", "there", "here"]);

export function tokenize(text) {
  const words = String(text || "")
    .toLowerCase()
    .replace(/n't\b/g, "nt")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const out = [];
  let negate = 0;
  for (const w of words) {
    if (NEGATORS.has(w)) { negate = 3; continue; }
    if (STOP.has(w)) continue;
    out.push(negate > 0 ? `NOT_${w}` : w);
    if (negate > 0) negate--;
  }
  const bigrams = [];
  for (let i = 0; i < out.length - 1; i++) bigrams.push(`${out[i]}__${out[i + 1]}`);
  return out.concat(bigrams);
}

export function train(samples, alpha = 1) {
  const counts = { pos: {}, neg: {} };
  const totals = { pos: 0, neg: 0 };
  const docs = { pos: 0, neg: 0 };
  const vocab = new Set();
  for (const { text, label } of samples) {
    const c = label === 1 ? "pos" : "neg";
    docs[c]++;
    for (const t of tokenize(text)) {
      counts[c][t] = (counts[c][t] || 0) + 1;
      totals[c]++;
      vocab.add(t);
    }
  }
  return { alpha, counts, totals, docs, vocabSize: vocab.size };
}

/** Returns P(positive | text) in [0,1]. */
export function predictProba(model, text) {
  const { alpha, counts, totals, docs, vocabSize } = model;
  const n = docs.pos + docs.neg;
  let lp = Math.log(docs.pos / n);
  let ln = Math.log(docs.neg / n);
  let known = 0;
  for (const t of tokenize(text)) {
    let cp = counts.pos[t] || 0;
    let cn = counts.neg[t] || 0;
    if (!cp && !cn && t.startsWith("NOT_")) {
      // Unseen negated word ("not bad"): borrow the base word's evidence, flipped.
      const base = t.slice(4);
      cp = counts.neg[base] || 0;
      cn = counts.pos[base] || 0;
    }
    if (!cp && !cn) continue; // unseen token: no evidence either way
    known++;
    lp += Math.log((cp + alpha) / (totals.pos + alpha * vocabSize));
    ln += Math.log((cn + alpha) / (totals.neg + alpha * vocabSize));
  }
  if (!known) return 0.5;
  const m = Math.max(lp, ln);
  const p = Math.exp(lp - m);
  const q = Math.exp(ln - m);
  return p / (p + q);
}

let cached = null;
export function loadModel() {
  if (cached) return cached;
  if (!existsSync(MODEL_PATH)) {
    throw new Error("Sentiment model missing. Run `npm run data:train` in /backend.");
  }
  cached = JSON.parse(readFileSync(MODEL_PATH, "utf8"));
  return cached;
}

/**
 * Turn a probability (and optional 1–5 star rating) into a label + 0–100 score.
 * The star rating nudges ambiguous text, mirroring how a human reads a review.
 */
export function interpret(probability, rating) {
  let p = probability;
  if (rating != null && !Number.isNaN(Number(rating))) {
    const r = (Number(rating) - 1) / 4; // 0..1
    p = 0.7 * p + 0.3 * r;
  }
  const sentiment = p >= 0.6 ? "positive" : p <= 0.4 ? "negative" : "neutral";
  return { sentiment, score: Math.round(p * 100), probability: Number(probability.toFixed(4)) };
}

export async function analyze(text, rating) {
  const url = process.env.AI_SERVICE_URL;
  if (url) {
    try {
      const res = await fetch(`${url.replace(/\/$/, "")}/predict`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, rating }),
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.raw === "number" && !data.error) return { ...interpret(data.raw, rating), engine: "tflite-rnn" };
      }
    } catch {
      /* fall through to local model */
    }
  }
  const model = loadModel();
  return { ...interpret(predictProba(model, text), rating), engine: "naive-bayes" };
}
