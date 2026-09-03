import { expect, test } from "@playwright/test";

test("renders the catalog with a title and achievement cards", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("GitHub Achievements");
  await expect(page.locator("a[href^='/achievements/']").first()).toBeVisible();
});

test("filters achievements by category", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Obsolete" }).click();
  await expect(page.getByText("Arctic Code Vault Contributor")).toBeVisible();
});

test("navigates to an achievement detail page", async ({ page }) => {
  await page.goto("/achievements/pull-shark");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pull Shark");
  await expect(page.getByRole("heading", { name: "How to get it" })).toBeVisible();
});

test("has a reachable theme toggle", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#theme-toggle")).toBeVisible();
});

test("has a reachable locale switcher", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#locale-switcher")).toBeVisible();
});
