import { expect, test } from "@playwright/test";

test("renders the landing page with the hero title", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
});

test("has a reachable theme toggle", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#theme-toggle")).toBeVisible();
});

test("has a reachable locale switcher", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#locale-switcher")).toBeVisible();
});
