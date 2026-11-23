/**
 * A tiny, dependency-free HTTP toolkit: router with path params, JSON bodies,
 * security headers, CORS, rate limiting and static file serving (SPA fallback).
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { gzipSync } from "node:zlib";

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const fail = (status, message, details) => {
  throw new HttpError(status, message, details);
};

export class Router {
  constructor() {
    this.routes = [];
  }
  add(method, pattern, ...handlers) {
    const keys = [];
    const regex = new RegExp(
      "^" +
        pattern.replace(/\/:([A-Za-z_]+)/g, (_, k) => {
          keys.push(k);
          return "/([^/]+)";
        }) +
        "/?$",
    );
    this.routes.push({ method, regex, keys, handlers });
    return this;
  }
  get(p, ...h) { return this.add("GET", p, ...h); }
  post(p, ...h) { return this.add("POST", p, ...h); }
  patch(p, ...h) { return this.add("PATCH", p, ...h); }
  delete(p, ...h) { return this.add("DELETE", p, ...h); }

  match(method, path) {
    let pathMatched = false;
    for (const r of this.routes) {
      const m = r.regex.exec(path);
      if (!m) continue;
      pathMatched = true;
      if (r.method !== method) continue;
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { route: r, params };
    }
    return { route: null, pathMatched };
  }
}

export function send(res, status, body, headers = {}) {
  if (res.headersSent) return;
  const payload = body === undefined ? "" : JSON.stringify(body);
  const accepts = res.req?.headers["accept-encoding"] || "";
  if (payload.length > 2048 && accepts.includes("gzip")) {
    const gz = gzipSync(payload);
    res.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-encoding": "gzip", vary: "accept-encoding", ...headers });
    return res.end(gz);
  }
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", ...headers });
  res.end(payload);
}

export async function readJson(req, limit = 1_000_000) {
  if (req.method === "GET" || req.method === "HEAD") return {};
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) fail(413, "Request body too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    fail(400, "Malformed JSON body");
  }
}

export function securityHeaders(res) {
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("referrer-policy", "strict-origin-when-cross-origin");
  res.setHeader("permissions-policy", "camera=(self), microphone=(), geolocation=()");
  res.setHeader("cross-origin-opener-policy", "same-origin");
}

export function cors(req, res, allowed) {
  const origin = req.headers.origin;
  if (origin && (allowed.includes("*") || allowed.includes(origin))) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "origin");
    res.setHeader("access-control-allow-credentials", "true");
    res.setHeader("access-control-allow-headers", "content-type, authorization");
    res.setHeader("access-control-allow-methods", "GET, POST, PATCH, DELETE, OPTIONS");
  }
}

/** Fixed-window in-memory rate limiter keyed by client IP. */
export function rateLimiter({ windowMs, max }) {
  const hits = new Map();
  setInterval(() => hits.clear(), windowMs).unref();
  return (req) => {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress;
    const n = (hits.get(ip) || 0) + 1;
    hits.set(ip, n);
    if (n > max) fail(429, "Too many requests — please slow down.");
  };
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".json": "application/json", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".map": "application/json",
  ".webmanifest": "application/manifest+json",
};

/** Serve files from `root`; unknown paths fall back to index.html (client-side routing). */
export function staticFiles(root) {
  const base = resolve(root);
  return (req, res) => {
    if (!existsSync(base)) return false;
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = normalize(join(base, urlPath));
    if (!file.startsWith(base)) return false;
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(base, "index.html");
    if (!existsSync(file)) return false;
    const ext = extname(file);
    const immutable = /\.[a-f0-9]{8,}\./.test(file) || urlPath.startsWith("/assets/");
    res.writeHead(200, {
      "content-type": MIME[ext] || "application/octet-stream",
      "cache-control": ext === ".html" ? "no-cache" : immutable ? "public, max-age=31536000, immutable" : "public, max-age=3600",
    });
    createReadStream(file).pipe(res);
    return true;
  };
}
