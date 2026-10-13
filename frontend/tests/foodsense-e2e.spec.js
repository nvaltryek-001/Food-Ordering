import { test, expect } from "@playwright/test";

const base = "http://localhost:5173";
const api = "http://localhost:5000/api";

test("FoodSense customer journey: register, cart, checkout", async ({ page, request }) => {
  const stamp = Date.now();
  const email = `foodsense.e2e.${stamp}@example.com`;
  const password = "QaTest!20261013";
  const name = "FoodSense QA";

  const health = await request.get(`${api}/health`);
  expect(health.ok(), "Backend health check failed").toBeTruthy();

  // Register through the actual UI.
  await page.goto(`${base}/register`);
  await expect(page.getByRole("heading", { name: "Join the table" })).toBeVisible();

  await page.getByPlaceholder("Your name").fill(name);
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByPlaceholder("At least 6 characters").fill(password);
  page.on("response", async response => {
    if (/\/api\/auth\/(register|login)/.test(response.url())) {
      let body = "";
      try { body = await response.text(); } catch {}
      console.log("AUTH RESPONSE:", response.status(), response.url(), body);
    }
  });

  await page.getByRole("button", { name: "Create account" }).click();

  await page.waitForTimeout(2000);

  if (!page.url().endsWith("/menu")) {
    const errors = await page.locator(".error-message").allTextContents();
    console.log("CURRENT URL:", page.url());
    console.log("VISIBLE AUTH ERRORS:", JSON.stringify(errors));
    throw new Error("Registration/login did not navigate to /menu. Inspect AUTH RESPONSE and VISIBLE AUTH ERRORS above.");
  }
  console.log("PASS: registration and automatic login");

  const token = await page.evaluate(() => localStorage.getItem("foodsense_token"));
  expect(token, "Login did not save a token").toBeTruthy();

  // Ensure the menu uses real backend food IDs.
  const foodsResponse = await request.get(`${api}/foods`);
  expect(foodsResponse.ok()).toBeTruthy();

  const foodsBody = await foodsResponse.json();
  const foods = Array.isArray(foodsBody)
    ? foodsBody
    : foodsBody.foods || foodsBody.data?.foods || foodsBody.data || [];

  const food = foods.find(item => item._id || item.id);
  expect(food, "No real food with a backend ID was found").toBeTruthy();

  // Search for the actual item in the menu.
  await page.goto(`${base}/menu`);
  await expect(page.getByText(food.name, { exact: true }).first()).toBeVisible({
    timeout: 15000
  });

  const card = page.locator(".food-card").filter({
    hasText: food.name
  }).first();

  await expect(card).toBeVisible();
  await card.getByRole("button", { name: /add/i }).click();
  console.log(`PASS: added ${food.name}`);

  // Verify cart and quantity calculation.
  await page.getByRole("link", { name: /shopping cart/i }).click();
  await expect(page.getByRole("heading", { name: "Your cart" })).toBeVisible();

  await expect(page.getByText(food.name, { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.locator(".quantity-control")).toContainText("2");

  const unitPrice = Number(food.price);
  expect(unitPrice, "Food price must be a positive number").toBeGreaterThan(0);

  const cartItem = page.locator(".cart-item").filter({ hasText: food.name });
  await expect(cartItem).toBeVisible();

  console.log("PASS: cart quantity updated to 2");

  // Checkout submits a real test order to the backend.
  await page.getByRole("link", { name: /continue to checkout/i }).click();
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

  await page.getByRole("button", { name: "Cash", exact: true }).click();

  const orderResponsePromise = page.waitForResponse(response =>
    response.url().includes("/api/orders") &&
    response.request().method() === "POST"
  );

  await page.getByRole("button", { name: /place order/i }).click();

  const orderResponse = await orderResponsePromise;
  const orderBody = await orderResponse.json().catch(() => ({}));

  expect(
    orderResponse.status(),
    `Order failed: HTTP ${orderResponse.status()} ${JSON.stringify(orderBody)}`
  ).toBeGreaterThanOrEqual(200);

  expect(orderResponse.status()).toBeLessThan(300);

  await expect(
    page.getByRole("heading", { name: "Order received!" })
  ).toBeVisible({ timeout: 15000 });

  console.log("PASS: order confirmation shown");

  // Confirm that the backend persisted the order for this customer.
  const myOrdersResponse = await request.get(`${api}/orders/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  expect(
    myOrdersResponse.ok(),
    `Could not retrieve customer orders: HTTP ${myOrdersResponse.status()}`
  ).toBeTruthy();

  const myOrdersBody = await myOrdersResponse.json();
  const myOrders = Array.isArray(myOrdersBody)
    ? myOrdersBody
    : myOrdersBody.orders || myOrdersBody.data?.orders || myOrdersBody.data || [];

  expect(
    myOrders.some(order =>
      order._id === (orderBody.order?._id || orderBody.data?.order?._id)
    ) || myOrders.length > 0,
    "Order was not found in the customer's order history"
  ).toBeTruthy();

  console.log("PASS: order found in backend order history");
});
