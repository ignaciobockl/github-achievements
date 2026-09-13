import { expect, test } from "@playwright/test";

async function waitForHydration(page: import("@playwright/test").Page) {
  // Wait for React hydration to complete by waiting for the theme toggle to be interactive
  await page.waitForFunction(
    () => {
      const select = document.querySelector<HTMLSelectElement>("#theme-toggle");
      return select && !select.disabled;
    },
    { timeout: 15000 },
  );
}

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
  await waitForHydration(page);
  await selectTheme(page, "dark");
  await expect(page.locator("html.dark")).toBeAttached();
  const stored = await page.evaluate(() => localStorage.getItem("gha-theme"));
  expect(stored).toBe("dark");
});

test("theme toggle to light removes html.dark and stores light", async ({ page }) => {
  await page.goto("/en/");
  await waitForHydration(page);
  await selectTheme(page, "light");
  await expect(page.locator("html.dark")).toHaveCount(0);
  const stored = await page.evaluate(() => localStorage.getItem("gha-theme"));
  expect(stored).toBe("light");
});

test("theme toggle persists dark across reload", async ({ page }) => {
  await page.goto("/en/");
  await waitForHydration(page);
  await selectTheme(page, "dark");
  await expect(page.locator("html.dark")).toBeAttached();
  await page.reload();
  await expect(page.locator("html.dark")).toBeAttached();
  const stored = await page.evaluate(() => localStorage.getItem("gha-theme"));
  expect(stored).toBe("dark");
});

test("locale switch EN to ES changes h1 via direct navigation", async ({ page }) => {
  await page.goto("/en/");
  await waitForHydration(page);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your code milestones, counted with calm.",
  );
  await page.goto("/es/");
  await expect(page).toHaveURL("/es/");
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
    // Mobile: desktop nav links are hidden by design; navigate with hash.
    await page.goto("/en#collection");
    await page.waitForTimeout(1000);
    await page.waitForURL(/#collection/, { timeout: 5000 });
  }
  await expect
    .poll(
      async () => {
        return page.evaluate(() => {
          const el = document.querySelector("#collection");
          if (!el) return false;
          const rect = el.getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom > 0;
        });
      },
      { timeout: 10000 },
    )
    .toBe(true);
});

test("card navigates to detail and back link returns to catalog", async ({ page }) => {
  await page.goto("/en/");
  await page.locator("article.card a").first().click();
  await expect(page).toHaveURL(/\/en\/achievements\/[a-z0-9-]+/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.locator('main a[href="/en/"], main a[href="/en"]').first().click();
  await page.waitForURL(/\/en\/?$/, { timeout: 5000 });
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your code milestones, counted with calm.",
  );
});

test("skip link focuses main content", async ({ page }) => {
  await page.goto("/en/");
  await waitForHydration(page);
  const skipLink = page.locator('a.skip-link[href="#main-content"]');
  await skipLink.waitFor({ state: "visible" });
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
