/** Thin fetch wrapper for the FoodSense API. */
const BASE = "/api";
const TOKEN_KEY = "fs.token";

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ }
};

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details || {};
  }
}

export async function api(path, { method = "GET", body, signal } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      signal,
      headers: { ...(body ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new ApiError(0, "Can't reach the restaurant server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `Request failed (${res.status})`, data.details);
  return data;
}

/** Subscribe to live server events. Returns an unsubscribe function. */
export function live(params, handlers) {
  const qs = new URLSearchParams(params);
  const token = getToken();
  if (token) qs.set("token", token);
  const es = new EventSource(`${BASE}/events?${qs}`);
  for (const [event, fn] of Object.entries(handlers)) es.addEventListener(event, (e) => fn(JSON.parse(e.data)));
  return () => es.close();
}

export const money = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");
export const timeAgo = (iso) => {
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};
