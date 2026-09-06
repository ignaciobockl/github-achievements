import { expect, test } from "@playwright/test";

type SkinTone = "default" | "light" | "light-medium" | "medium" | "medium-dark" | "dark";

async function selectTone(page: import("@playwright/test").Page, tone: SkinTone) {
  await page.locator("#skin-tone-select").waitFor({ state: "visible" });
  // The selector is a React client:load island: native select renders instantly
  // but only responds after hydration. Re-select until the badge src sticks.
  await expect
    .poll(
      async () => {
        await page.selectOption("#skin-tone-select", tone);
        return page.locator("#achievement-badge").getAttribute("src");
      },
      { timeout: 10000 },
    )
    .toContain(tone === "default" ? "default.png" : `default--${tone}.png`);
}

test("detail quickdraw shows skin tone selector", async ({ page }) => {
  await page.goto("/en/achievements/quickdraw");
  await expect(page.locator("#skin-tone-select")).toBeVisible();
});

test("detail starstruck shows skin tone selector", async ({ page }) => {
  await page.goto("/en/achievements/starstruck");
  await expect(page.locator("#skin-tone-select")).toBeVisible();
});

test("detail yolo shows onlyDefault note and no selector", async ({ page }) => {
  await page.goto("/en/achievements/yolo");
  const note = page.locator("#skin-tone-note");
  await expect(note).toBeVisible();
  await expect(note).toContainText("Only available in default tone");
  await expect(page.locator("#skin-tone-select")).toHaveCount(0);
});

test("changing tone updates badge src on quickdraw detail", async ({ page }) => {
  await page.goto("/en/achievements/quickdraw");
  await page.locator("#skin-tone-select").waitFor({ state: "visible" });
  await page.locator("#achievement-badge").waitFor({ state: "visible" });
  const _initialSrc = await page.locator("#achievement-badge").getAttribute("src");

  await expect
    .poll(
      async () => {
        await page.selectOption("#skin-tone-select", "dark");
        return page.locator("#achievement-badge").getAttribute("src");
      },
      { timeout: 10000 },
    )
    .toContain("/badges/variants/quickdraw-default--dark.png");

  await expect
    .poll(
      async () => {
        await page.selectOption("#skin-tone-select", "light");
        return page.locator("#achievement-badge").getAttribute("src");
      },
      { timeout: 10000 },
    )
    .toContain("quickdraw-default--light.png");
});

test("skin tone persists across reload", async ({ page }) => {
  await page.goto("/en/achievements/quickdraw");
  await selectTone(page, "dark");

  // Verify src is variant before reload
  await expect(page.locator("#achievement-badge")).toHaveAttribute(
    "src",
    /quickdraw-default--dark\.png/,
  );

  await page.reload();
  await page.locator("#skin-tone-select").waitFor({ state: "visible" });

  // After reload the stored tone should be re-applied
  await expect
    .poll(async () => page.locator("#achievement-badge").getAttribute("src"), { timeout: 10000 })
    .toContain("quickdraw-default--dark.png");

  // Also verify the select retains the stored value
  await expect(page.locator("#skin-tone-select")).toHaveValue("dark");
});

test("landing auto-applies stored tone to variant badges", async ({ page }) => {
  await page.goto("/en/achievements/quickdraw");
  await selectTone(page, "dark");
  await expect(page.locator("#achievement-badge")).toHaveAttribute(
    "src",
    /quickdraw-default--dark\.png/,
  );

  await page.goto("/en/");
  const quickdrawImg = page.locator('img[data-variant-slug="quickdraw"]');
  await quickdrawImg.waitFor({ state: "visible" });
  await expect
    .poll(async () => quickdrawImg.getAttribute("src"), { timeout: 10000 })
    .toContain("quickdraw-default--dark.png");

  const starstruckImg = page.locator('img[data-variant-slug="starstruck"]');
  await starstruckImg.waitFor({ state: "visible" });
  await expect
    .poll(async () => starstruckImg.getAttribute("src"), { timeout: 10000 })
    .toContain("starstruck-default--dark.png");
});
