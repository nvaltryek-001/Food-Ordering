import { test, expect } from "@playwright/test";

const base = "http://127.0.0.1:5173";
const routes = ["/", "/menu", "/cart", "/checkout", "/scan"];

test.describe("FoodSense real browser UI", () => {
  test("each main page renders without a blank document", async ({ page }) => {
    for (const route of routes) {
      await page.goto(base + route);
      await expect(page.locator("body")).not.toBeEmpty();
      await expect(page.locator("body")).toBeVisible();
      console.log("PAGE PASS:", route);
    }
  });

  test("frontend JSX modules return JavaScript MIME types", async ({ page }) => {
    const failures = [];
    const modules = [
      "/src/main.jsx",
      "/src/App.jsx",
      "/src/components/QRScanner.jsx"
    ];

    page.on("response", async response => {
      const url = response.url();

      if (modules.some(path => url.includes(path))) {
        const headers = response.headers();
        const contentType = headers["content-type"] || "";

        if (!response.ok() || !/javascript|ecmascript/i.test(contentType)) {
          failures.push(
            `${url} => status ${response.status()}, content-type "${contentType}"`
          );
        } else {
          console.log("MODULE PASS:", url, contentType);
        }
      }
    });

    await page.goto(base);
    await page.waitForLoadState("networkidle");

    for (const modulePath of modules) {
      await page.request.get(base + modulePath);
    }

    expect(failures, failures.join("\n")).toEqual([]);
  });

  test("no uncaught page exceptions on main routes", async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));

    for (const route of routes) {
      await page.goto(base + route);
      await page.waitForTimeout(500);
    }

    expect(errors, errors.join("\n")).toEqual([]);
  });

  test("desktop and mobile layouts do not overflow horizontally", async ({ page }) => {
    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 390, height: 844 }
    ]) {
      await page.setViewportSize(viewport);

      for (const route of routes) {
        await page.goto(base + route);

        const sizes = await page.evaluate(() => ({
          body: document.body.scrollWidth,
          viewport: document.documentElement.clientWidth
        }));

        expect(
          sizes.body,
          `${route} overflows at ${viewport.width}px: ${JSON.stringify(sizes)}`
        ).toBeLessThanOrEqual(sizes.viewport + 1);
      }
    }
  });

  test("save screenshots of all main routes", async ({ page }) => {
    const fs = await import("node:fs/promises");
    await fs.mkdir("test-results/foodsense-ui", { recursive: true });

    for (const route of routes) {
      await page.setViewportSize({ width: 1366, height: 900 });
      await page.goto(base + route);

      await page.screenshot({
        path: `test-results/foodsense-ui/${route === "/" ? "home" : route.slice(1)}.png`,
        fullPage: true
      });
    }
  });
});
