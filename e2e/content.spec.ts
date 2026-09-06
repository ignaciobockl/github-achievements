import { expect, test } from "@playwright/test";

test("renders 14 achievement cards on /en/", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.locator('[role="list"] article.card').first()).toBeVisible();
  await expect(page.locator('[role="list"] article.card')).toHaveCount(14);
});

test("shows known achievement titles", async ({ page }) => {
  await page.goto("/en/");
  for (const title of [
    "Pull Shark",
    "Quickdraw",
    "Starstruck",
    "Galaxy Brain",
    "Arctic Code Vault Contributor",
  ]) {
    await expect(
      page.locator("article.card", { hasText: title }).first(),
      `card with title "${title}" should be visible`,
    ).toBeVisible();
  }
});

test("shows EN hero title and collection heading", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Your code milestones, counted with calm.",
  );
  await expect(page.getByRole("heading", { level: 2, name: "The collection" })).toHaveText(
    "The collection",
  );
});

test("shows ES hero title and collection heading", async ({ page }) => {
  await page.goto("/es/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Tus hitos de código, contados con calma.",
  );
  await expect(page.getByRole("heading", { level: 2, name: "La colección" })).toHaveText(
    "La colección",
  );
});

test("shows stats values on /en/", async ({ page }) => {
  await page.goto("/en/");
  await expect(
    page.locator('aside[aria-label="Showcase statistics"]').getByText("09"),
  ).toBeVisible();
  await expect(
    page.locator('aside[aria-label="Showcase statistics"]').getByText("x4"),
  ).toBeVisible();
  await expect(
    page.locator('aside[aria-label="Showcase statistics"]').getByText("100%"),
  ).toBeVisible();
});

test("every card links to its detail page", async ({ page }) => {
  await page.goto("/en/");
  const links = page.locator("article.card a");
  await expect(links).toHaveCount(14);
  const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute("href")));
  expect(hrefs).toHaveLength(14);
  for (const href of hrefs) {
    expect(href).toMatch(/^\/en\/achievements\/[a-z0-9-]+$/);
  }
  expect(hrefs).toContain("/en/achievements/pull-shark");
});

test("renders earnable and not-earnable badges", async ({ page }) => {
  await page.goto("/en/");
  await expect(
    page.locator("article.card").getByText("Earnable", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.locator("article.card").getByText("Not earnable", { exact: true }).first(),
  ).toBeVisible();
});

test("tiered achievements show tier pills", async ({ page }) => {
  await page.goto("/en/");
  const tiers = page.locator(".tier");
  expect(await tiers.count()).toBeGreaterThan(0);
  await expect(tiers.first()).toBeVisible();
});
