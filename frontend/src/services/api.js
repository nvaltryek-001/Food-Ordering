import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("foodsense_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ==================== AUTH ====================

export async function registerUser(data) {
  const response = await api.post("/auth/register", data);

  if (response.data?.token) {
    localStorage.setItem(
      "foodsense_token",
      response.data.token
    );
  }

  if (response.data?.user) {
    localStorage.setItem(
      "foodsense_user",
      JSON.stringify(response.data.user)
    );
  }

  return response.data;
}

export async function loginUser(data) {
  const response = await api.post("/auth/login", data);

  if (response.data?.token) {
    localStorage.setItem(
      "foodsense_token",
      response.data.token
    );
  }

  if (response.data?.user) {
    localStorage.setItem(
      "foodsense_user",
      JSON.stringify(response.data.user)
    );
  }

  return response.data;
}

export function logoutUser() {
  localStorage.removeItem("foodsense_token");
  localStorage.removeItem("foodsense_user");
}

export function getStoredUser() {
  try {
    const user = localStorage.getItem("foodsense_user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem("foodsense_token");
}

// ==================== FOODS ====================

export async function getFoods(params = {}) {
  const response = await api.get("/foods", { params });
  return response.data;
}

// ==================== ORDERS ====================

export async function createOrder(data) {
  const response = await api.post("/orders", data);
  return response.data;
}

export async function getMyOrders() {
  const response = await api.get("/orders/my");
  return response.data;
}

// ==================== REVIEWS ====================

export async function createReview(data) {
  const response = await api.post("/reviews", data);
  return response.data;
}

export async function getReviewAnalytics() {
  const response = await api.get("/reviews/analytics");
  return response.data;
}

// ==================== MANAGER ====================

export async function getDashboardAnalytics() {
  const response = await api.get("/analytics/dashboard");
  return response.data;
}

export async function updateOrderStatus(orderId, status) {
  const response = await api.patch(
    `/orders/${orderId}/status`,
    { status }
  );
  return response.data;
}

export default api;

