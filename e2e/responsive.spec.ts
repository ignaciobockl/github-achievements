import { expect, test } from "@playwright/test";

async function columnCount(
  page: import("@playwright/test").Page,
  selector: string,
): Promise<number> {
  const gridTemplateColumns = await page.$eval(selector, (el) =>
    getComputedStyle(el).gridTemplateColumns.trim(),
  );
  if (!gridTemplateColumns || gridTemplateColumns === "none") return 0;
  return gridTemplateColumns.split(/\s+/).filter(Boolean).length;
}

test.describe("responsive", () => {
  test("no horizontal overflow", async ({ page }) => {
    await page.goto("/en/");
    const fits = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(fits).toBe(true);
  });

  test("desktop: collection grid has 3 columns", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/en/");
    const grid = page.locator(".grid-3").first();
    await expect(grid).toBeVisible();
    expect(await columnCount(page, ".grid-3")).toBe(3);
  });

  test("mobile: grids collapse to 1 column", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/");

    for (const selector of [".grid-3", ".hero-grid", ".stat"]) {
      const loc = page.locator(selector).first();
      await expect(loc, `${selector} should be visible`).toBeVisible();
      expect(await columnCount(page, selector), selector).toBe(1);
    }
  });

  test("wrap container max-width is 1120px", async ({ page }) => {
    await page.goto("/en/");
    const wrap = page.locator(".wrap").first();
    await expect(wrap).toBeVisible();
    const maxWidth = await page.$eval(".wrap", (el) => getComputedStyle(el).maxWidth);
    expect(maxWidth).toBe("1120px");
  });

  test("cards are visible without horizontal scroll on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/");

    const cards = page.locator('[role="list"] article.card');
    await expect(cards.first()).toBeVisible();
    // All cards must stay inside the viewport horizontally.
    const overflows = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('[role="list"] article.card'));
      return els.filter((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        return r.left < 0 || r.right > window.innerWidth;
      }).length;
    });
    expect(overflows).toBe(0);

    const fits = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(fits).toBe(true);
  });
});
