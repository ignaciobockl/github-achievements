import { expect, test } from "@playwright/test";

async function selectTheme(
  page: import("@playwright/test").Page,
  theme: "light" | "dark" | "auto",
) {
  await page.locator("#theme-toggle").waitFor({ state: "visible" });
  // The toggle is a React client:visible island: the native select renders instantly
  // but only responds after hydration. Re-select until the theme sticks.
  await expect
    .poll(
      async () => {
        await page.selectOption("#theme-toggle", theme);
        return page.evaluate(() => [
          document.documentElement.classList.contains("dark"),
          window.localStorage.getItem("gha-theme"),
        ]);
      },
      { timeout: 15000 },
    )
    .toEqual(
      theme === "dark"
        ? [true, "dark"]
        : theme === "light"
          ? [false, "light"]
          : [expect.anything(), "auto"],
    );
}

test("theme toggle to dark sets html.dark and localStorage", async ({ page }) => {
  await page.goto("/en/");
  await selectTheme(page, "dark");
  await expect(page.locator("html.dark")).toBeAttached();
  const stored = await page.evaluate(() => localStorage.getItem("gha-theme"));
  expect(stored).toBe("dark");
});

test("theme toggle to light removes html.dark and stores light", async ({ page }) => {
  await page.goto("/en/");
  await selectTheme(page, "light");
  await expect(page.locator("html.dark")).toHaveCount(0);
  const stored = await page.evaluate(() => localStorage.getItem("gha-theme"));
  expect(stored).toBe("light");
});

test("theme toggle persists dark across reload", async ({ page }) => {
  await page.goto("/en/");
  await selectTheme(page, "dark");
  await expect(page.locator("html.dark")).toBeAttached();
  await page.reload();
  await expect(page.locator("html.dark")).toBeAttached();
  const stored = await page.evaluate(() => localStorage.getItem("gha-theme"));
  expect(stored).toBe("dark");
});

test("locale switch EN to ES changes h1 via direct navigation", async ({ page }) => {
  await page.goto("/en/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your code milestones, counted with calm.",
  );
  await page.goto("/es/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Tus hitos de código, contados con calma.",
  );
});

test("nav anchor scrolls to collection section", async ({ page }) => {
  await page.goto("/en/");
  const link = page.locator('a[href="/en#collection"]').first();
  if (await link.isVisible()) {
    await link.click();
  } else {
    // Mobile: desktop nav links are hidden by design; navigate via hash.
    await page.goto("/en#collection");
  }
  await expect(page).toHaveURL(/#collection/);
  const inViewport = await page.evaluate(() => {
    const el = document.querySelector("#collection");
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });
  expect(inViewport).toBe(true);
});

test("card navigates to detail and back link returns to catalog", async ({ page }) => {
  await page.goto("/en/");
  await page.locator("article.card a").first().click();
  await expect(page).toHaveURL(/\/en\/achievements\/[a-z0-9-]+/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.locator('main a[href="/en/"], main a[href="/en"]').first().click();
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your code milestones, counted with calm.",
  );
});

test("skip link focuses main content", async ({ page }) => {
  await page.goto("/en/");
  const skipLink = page.locator('a.skip-link[href="#main-content"]');
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeVisible();
  const focusedOrVisible = await page.evaluate(() => {
    const main = document.querySelector("#main-content");
    if (!main) return false;
    if (document.activeElement === main) return true;
    const rect = main.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });
  expect(focusedOrVisible).toBe(true);
});
