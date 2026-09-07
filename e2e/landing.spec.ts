import { expect, test } from "@playwright/test";

test("redirects root to a localized home", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/en|\/es/);
});

test("renders the catalog with a title and achievement cards", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your code milestones, counted with calm.",
  );
  await expect(page.locator("a[href^='/en/achievements/']").first()).toBeVisible();
});

test("renders the Spanish catalog", async ({ page }) => {
  await page.goto("/es/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Tus hitos de código, contados con calma.",
  );
});

test("navigates to a localized achievement detail page", async ({ page }) => {
  await page.goto("/en/achievements/pull-shark");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pull Shark");
  await expect(page.getByRole("heading", { name: "How to get it" })).toBeVisible();
});

test("has a reachable theme toggle", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.locator("#theme-toggle")).toBeVisible();
});

test("has collection section with achievement cards", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.getByRole("heading", { level: 2, name: "The collection" })).toBeVisible();
  await expect(page.locator('[role="list"]')).toBeVisible();
  await expect(page.locator('[role="listitem"]').first()).toBeVisible();
});
