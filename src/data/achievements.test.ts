import { describe, expect, it } from "vitest";
import { locales } from "../i18n";
import { achievements } from "./achievements";
import type { AchievementCategory } from "./types";

const validCategories: AchievementCategory[] = ["earnable", "obsolete", "internal", "disabled"];

describe("achievements data", () => {
  it("contains all expected achievements", () => {
    expect(achievements.length).toBe(14);
  });

  it("has unique slugs", () => {
    const slugs = achievements.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has required fields on every achievement", () => {
    for (const achievement of achievements) {
      expect(achievement.slug).toBeTruthy();
      expect(achievement.badge.default).toBeTruthy();
      expect(validCategories).toContain(achievement.category);
      for (const locale of locales) {
        expect(achievement.title[locale]).toBeTruthy();
        expect(achievement.summary[locale]).toBeTruthy();
        expect(Array.isArray(achievement.howToGet[locale])).toBe(true);
        expect(achievement.howToGet[locale].length).toBeGreaterThan(0);
      }
    }
  });

  it("assigns earnable achievements only to the earnable category", () => {
    for (const achievement of achievements) {
      if (achievement.earnable) {
        expect(achievement.category).toBe("earnable");
      }
    }
  });

  it("defines valid tiers with localized criteria", () => {
    for (const achievement of achievements) {
      for (const tier of achievement.tiers) {
        expect(["bronze", "silver", "gold"]).toContain(tier.tier);
        for (const locale of locales) {
          expect(tier.criterion[locale]).toBeTruthy();
        }
      }
    }
  });

  it("provides tier badge images for tiered achievements", () => {
    for (const achievement of achievements) {
      if (achievement.tiers.length > 0) {
        expect(achievement.badge.bronze).toBeTruthy();
        expect(achievement.badge.silver).toBeTruthy();
        expect(achievement.badge.gold).toBeTruthy();
      }
    }
  });
});
