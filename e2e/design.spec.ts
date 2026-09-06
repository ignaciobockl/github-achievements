import { expect, test } from "@playwright/test";

async function computedHex(
  page: import("@playwright/test").Page,
  selector: string,
  property: "background-color" | "color",
): Promise<string | null> {
  return page.evaluate(
    ({ selector, property }) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const value = getComputedStyle(el).getPropertyValue(property).trim();
      const m = value.match(/rgba?\(([^)]+)\)/i);
      if (!m) return value.toLowerCase();
      const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
      const [r, g, b] = parts;
      const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
    },
    { selector, property },
  );
}

async function bg(page: import("@playwright/test").Page, selector: string): Promise<string | null> {
  return computedHex(page, selector, "background-color");
}

async function fg(page: import("@playwright/test").Page, selector: string): Promise<string | null> {
  return computedHex(page, selector, "color");
}

test("light mode body background is #ffffff", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("gha-theme", "light");
  });
  await page.goto("/en/");
  expect(await bg(page, "body")).toBe("#ffffff");
});

test("dark mode body background is #0d1117", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("gha-theme", "dark");
  });
  await page.goto("/en/");
  expect(await bg(page, "body")).toBe("#0d1117");
});

test("accent color in light mode (.cta-primary is #059669)", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("gha-theme", "light");
  });
  await page.goto("/en/");
  expect(await bg(page, ".cta-primary")).toBe("#059669");
});

test("accent color in dark mode (.cta-primary is #10b981)", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("gha-theme", "dark");
  });
  await page.goto("/en/");
  expect(await bg(page, ".cta-primary")).toBe("#10b981");
});

test("typography uses Satoshi for h1 and Geist Mono for .stat-value", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("gha-theme", "light");
  });
  await page.goto("/en/");
  const h1Font = await page.evaluate(() => {
    const el = document.querySelector("h1");
    if (!el) return "";
    return getComputedStyle(el).fontFamily;
  });
  expect(h1Font).toContain("Satoshi");

  const statFont = await page.evaluate(() => {
    const el = document.querySelector(".stat-value");
    if (!el) return "";
    return getComputedStyle(el).fontFamily;
  });
  expect(statFont).toContain("Geist Mono");
});

test("cards have 14px radius and 1px border", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("gha-theme", "light");
  });
  await page.goto("/en/");
  const radius = await page.evaluate(() => {
    const el = document.querySelector("article.card");
    if (!el) return "";
    return getComputedStyle(el).borderRadius;
  });
  expect(radius).toContain("14px");

  const borderWidth = await page.evaluate(() => {
    const el = document.querySelector("article.card");
    if (!el) return "";
    return getComputedStyle(el).borderTopWidth;
  });
  expect(borderWidth).toContain("1px");
});

test("kicker uses accent color in light mode", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("gha-theme", "light");
  });
  await page.goto("/en/");
  expect(await fg(page, ".kicker")).toBe("#059669");
});

test("CTA section exists with heading and accent link", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("gha-theme", "light");
  });
  await page.goto("/en/");

  const section = page.locator('section[aria-labelledby="cta-title"]');
  await expect(section).toBeVisible();

  await expect(page.locator("#cta-title")).toBeVisible();

  const ctaLink = section.locator("a.cta-primary");
  await expect(ctaLink).toBeVisible();
  expect(await bg(page, 'section[aria-labelledby="cta-title"] a.cta-primary')).toBe("#059669");
});

test("display and mono webfonts actually load", async ({ page }) => {
  await page.goto("/en/");
  const loaded = await page.evaluate(() =>
    document.fonts.ready.then(() => [
      document.fonts.check("700 32px Satoshi"),
      document.fonts.check('500 16px "Geist Mono"'),
    ]),
  );
  expect(loaded).toEqual([true, true]);
});
