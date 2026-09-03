import { describe, expect, it } from "vitest";
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
      expect(achievement.title).toBeTruthy();
      expect(achievement.badge.default).toBeTruthy();
      expect(validCategories).toContain(achievement.category);
      expect(Array.isArray(achievement.howToGet)).toBe(true);
      expect(achievement.howToGet.length).toBeGreaterThan(0);
      expect(Array.isArray(achievement.tiers)).toBe(true);
    }
  });

  it("assigns earnable achievements only to the earnable category", () => {
    for (const achievement of achievements) {
      if (achievement.earnable) {
        expect(achievement.category).toBe("earnable");
      }
    }
  });

  it("defines valid tiers", () => {
    for (const achievement of achievements) {
      for (const tier of achievement.tiers) {
        expect(["bronze", "silver", "gold"]).toContain(tier.tier);
        expect(tier.criterion).toBeTruthy();
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
