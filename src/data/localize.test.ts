import { describe, expect, it } from "vitest";
import { achievements } from "./achievements";
import { localizeAchievement } from "./localize";
import type { Achievement } from "./types";

function getBySlug(slug: string): Achievement {
  const achievement = achievements.find((a) => a.slug === slug);
  if (!achievement) {
    throw new Error(`Achievement not found: ${slug}`);
  }
  return achievement;
}

describe("localizeAchievement", () => {
  it("localizes string and array fields for English", () => {
    const pair = getBySlug("pair-extraordinaire");

    const localized = localizeAchievement(pair, "en");
    expect(localized.title).toBe("Pair Extraordinaire");
    expect(Array.isArray(localized.howToGet)).toBe(true);
    expect(localized.tiers[0]?.criterion).toContain("10 merged pull requests");
  });

  it("localizes string and array fields for Spanish", () => {
    const pair = getBySlug("pair-extraordinaire");

    const localized = localizeAchievement(pair, "es");
    expect(localized.summary.toLowerCase()).toContain("coautoría");
    expect(localized.tiers[0]?.criterion).toContain("10 pull requests fusionados");
  });

  it("localizes references and previous names", () => {
    const sponsor = getBySlug("public-sponsor");

    const localized = localizeAchievement(sponsor, "es");
    expect(localized.references[0]?.label).toBe("GitHub Sponsors");
    expect(localized.previousNames).toContain("GitHub Sponsor");
  });
});
