/**
 * Authentication primitives built on node:crypto.
 *  - Passwords: scrypt with a per-user random salt, constant-time comparison.
 *  - Tokens: compact HS256 JSON Web Tokens.
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { fail } from "./http.js";

const SECRET = process.env.JWT_SECRET || "foodsense-dev-secret-change-me";
const TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS || 60 * 60 * 24 * 7);

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn("⚠️  JWT_SECRET is not set — using an insecure development secret.");
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  const [, salt, hash] = String(stored).split("$");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(password, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const sign = (data) => createHmac("sha256", SECRET).update(data).digest("base64url");

export function signToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({ ...payload, iat: now, exp: now + TTL_SECONDS });
  return `${head}.${body}.${sign(`${head}.${body}`)}`;
}

export function verifyToken(token) {
  const [head, body, sig] = String(token).split(".");
  if (!head || !body || !sig) return null;
  const expected = Buffer.from(sign(`${head}.${body}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Reads the bearer token (or ?token= for EventSource) and attaches req.user. */
export function identify(req, db) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.query?.token;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = db.users.find((u) => u.id === payload.sub);
  return user ? publicUser(user) : null;
}

export const publicUser = ({ passwordHash, ...u }) => u;

export const requireUser = (req) => {
  if (!req.user) fail(401, "Please sign in to continue.");
};

export const requireStaff = (req) => {
  requireUser(req);
  if (!["admin", "kitchen"].includes(req.user.role)) fail(403, "Staff access only.");
};

export const requireAdmin = (req) => {
  requireUser(req);
  if (req.user.role !== "admin") fail(403, "Admin access only.");
};
