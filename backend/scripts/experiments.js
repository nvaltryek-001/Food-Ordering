/**
 * Reproducible experiments for the FoodSense sentiment model:
 *   1. Feature ablation on the fixed 80/20 split used by train-sentiment.js
 *   2. Stratified 5-fold cross-validation of every variant
 * Writes data/experiments.json and the split used (for the Python baselines).
 *
 * Run: node scripts/experiments.js
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const rows = readFileSync(join(here, "../data/raw/restaurant_reviews.tsv"), "utf8")
  .split(/\r?\n/).slice(1).filter(Boolean)
  .map((line, id) => { const i = line.lastIndexOf("\t"); return { id, text: line.slice(0, i), label: Number(line.slice(i + 1)) }; });

const NEG = new Set(["not", "no", "never", "dont", "didnt", "doesnt", "isnt", "wasnt", "wont", "cant", "couldnt", "wouldnt", "aint", "nothing", "hardly", "barely"]);
const STOP = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "for", "it", "is", "was", "this", "that", "i", "we", "my", "our", "they", "were", "be", "been", "are", "as", "with", "so", "me", "you", "had", "have", "has", "there", "here"]);

function tokenize(text, { negation, bigrams, stop }) {
  const words = String(text).toLowerCase().replace(/n't\b/g, "nt").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const out = [];
  let neg = 0;
  for (const w of words) {
    if (negation && NEG.has(w)) { neg = 3; continue; }
    if (stop && STOP.has(w)) continue;
    out.push(neg > 0 ? `NOT_${w}` : w);
    if (neg > 0) neg--;
  }
  const bi = [];
  if (bigrams) for (let i = 0; i < out.length - 1; i++) bi.push(`${out[i]}__${out[i + 1]}`);
  return out.concat(bi);
}

function train(samples, cfg) {
  const counts = { 1: new Map(), 0: new Map() }, totals = { 1: 0, 0: 0 }, docs = { 1: 0, 0: 0 }, vocab = new Set();
  for (const s of samples) {
    docs[s.label]++;
    for (const t of tokenize(s.text, cfg)) { counts[s.label].set(t, (counts[s.label].get(t) || 0) + 1); totals[s.label]++; vocab.add(t); }
  }
  return { counts, totals, docs, V: vocab.size, cfg };
}

function proba(m, text) {
  const n = m.docs[1] + m.docs[0];
  let lp = Math.log(m.docs[1] / n), ln = Math.log(m.docs[0] / n), known = 0;
  for (const t of tokenize(text, m.cfg)) {
    let cp = m.counts[1].get(t) || 0, cn = m.counts[0].get(t) || 0;
    if (!cp && !cn && m.cfg.backoff && t.startsWith("NOT_")) { const b = t.slice(4); cp = m.counts[0].get(b) || 0; cn = m.counts[1].get(b) || 0; }
    if (!cp && !cn) continue;
    known++;
    lp += Math.log((cp + 1) / (m.totals[1] + m.V));
    ln += Math.log((cn + 1) / (m.totals[0] + m.V));
  }
  if (!known) return 0.5;
  const mx = Math.max(lp, ln);
  return Math.exp(lp - mx) / (Math.exp(lp - mx) + Math.exp(ln - mx));
}

function evaluate(m, test) {
  let tp = 0, tn = 0, fp = 0, fn = 0;
  for (const s of test) {
    const p = proba(m, s.text) >= 0.5 ? 1 : 0;
    if (p && s.label) tp++; else if (!p && !s.label) tn++; else if (p) fp++; else fn++;
  }
  const precision = tp / (tp + fp), recall = tp / (tp + fn);
  return { accuracy: (tp + tn) / test.length, precision, recall, f1: (2 * precision * recall) / (precision + recall), tp, tn, fp, fn };
}

// Same seeded split as train-sentiment.js
function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
function split(seed) {
  const rand = rng(seed);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pos = shuffle(rows.filter((r) => r.label === 1)), neg = shuffle(rows.filter((r) => r.label === 0));
  return { pos, neg };
}

const VARIANTS = {
  "Unigrams": { negation: false, bigrams: false, stop: false, backoff: false },
  "Unigrams + stop-word removal": { negation: false, bigrams: false, stop: true, backoff: false },
  "+ bigrams": { negation: false, bigrams: true, stop: true, backoff: false },
  "+ negation scope": { negation: true, bigrams: true, stop: true, backoff: false },
  "+ negation back-off (full model)": { negation: true, bigrams: true, stop: true, backoff: true },
};

const { pos, neg } = split(42);
const cut = (a) => Math.round(a.length * 0.8);
const trainSet = [...pos.slice(0, cut(pos)), ...neg.slice(0, cut(neg))];
const testSet = [...pos.slice(cut(pos)), ...neg.slice(cut(neg))];

const holdout = {};
for (const [name, cfg] of Object.entries(VARIANTS)) holdout[name] = evaluate(train(trainSet, cfg), testSet);

// Stratified 5-fold CV (different seed from the hold-out split)
const cv = {};
const s2 = split(7);
const folds = Array.from({ length: 5 }, (_, k) => [...s2.pos.filter((_, i) => i % 5 === k), ...s2.neg.filter((_, i) => i % 5 === k)]);
for (const [name, cfg] of Object.entries(VARIANTS)) {
  const accs = [], f1s = [];
  for (let k = 0; k < 5; k++) {
    const test = folds[k], tr = folds.filter((_, j) => j !== k).flat();
    const r = evaluate(train(tr, cfg), test);
    accs.push(r.accuracy); f1s.push(r.f1);
  }
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const sd = (a) => Math.sqrt(a.reduce((x, y) => x + (y - mean(a)) ** 2, 0) / (a.length - 1));
  cv[name] = { accMean: mean(accs), accSd: sd(accs), f1Mean: mean(f1s), f1Sd: sd(f1s) };
}

// Inference speed of the full model
const full = train(trainSet, VARIANTS["+ negation back-off (full model)"]);
const t0 = process.hrtime.bigint();
for (let r = 0; r < 50; r++) for (const s of testSet) proba(full, s.text);
const usPerReview = Number(process.hrtime.bigint() - t0) / 1000 / (50 * testSet.length);

const out = {
  holdout, cv, usPerReview,
  split: { train: trainSet.map((r) => r.id), test: testSet.map((r) => r.id) },
  cvFolds: folds.map((f) => f.map((r) => r.id)),
};
writeFileSync(join(here, "../data/experiments.json"), JSON.stringify(out, null, 1));
console.table(Object.fromEntries(Object.entries(holdout).map(([k, v]) => [k, { acc: v.accuracy.toFixed(3), P: v.precision.toFixed(3), R: v.recall.toFixed(3), F1: v.f1.toFixed(3) }])));
console.table(Object.fromEntries(Object.entries(cv).map(([k, v]) => [k, { acc: `${v.accMean.toFixed(3)} ± ${v.accSd.toFixed(3)}`, F1: `${v.f1Mean.toFixed(3)} ± ${v.f1Sd.toFixed(3)}` }])));
console.log(`inference: ${usPerReview.toFixed(1)} µs / review`);
