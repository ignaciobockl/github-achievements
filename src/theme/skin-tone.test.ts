import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { achievements } from "../data/achievements";
import { SKIN_TONE_OPTIONS } from "../data/types";
import {
  badgeVariantUrl,
  getStoredSkinTone,
  resolveVariantUrl,
  SKIN_TONE_EMOJI,
} from "./skin-tone";

describe("badgeVariantUrl", () => {
  it("returns baseUrl when tone is default and baseUrl is provided", () => {
    expect(badgeVariantUrl("quickdraw", "default", "/base.png")).toBe("/base.png");
  });

  it("returns default variant path when tone is default and baseUrl is not provided", () => {
    expect(badgeVariantUrl("quickdraw", "default")).toBe("/badges/variants/quickdraw-default.png");
  });

  it("returns baseUrl with starstruck default when provided", () => {
    expect(badgeVariantUrl("starstruck", "default", "/star.png")).toBe("/star.png");
  });

  it("returns dark variant URL for quickdraw", () => {
    expect(badgeVariantUrl("quickdraw", "dark", "/base.png")).toBe(
      "/badges/variants/quickdraw-default--dark.png",
    );
  });

  const tones = ["light", "light-medium", "medium", "medium-dark", "dark"] as const;
  const slugs = ["quickdraw", "starstruck"] as const;

  for (const tone of tones) {
    for (const slug of slugs) {
      it(`returns variant URL for tone "${tone}" with slug "${slug}"`, () => {
        expect(badgeVariantUrl(slug, tone, "/base.png")).toBe(
          `/badges/variants/${slug}-default--${tone}.png`,
        );
      });
    }
  }

  it("ignores baseUrl when tone is not default", () => {
    expect(badgeVariantUrl("quickdraw", "light", "/ignored.png")).toBe(
      "/badges/variants/quickdraw-default--light.png",
    );
  });
});

describe("resolveVariantUrl", () => {
  const base = "/base.png";

  it("returns base regardless of tone when hasVariants is false", () => {
    expect(resolveVariantUrl(false, "quickdraw", base, "dark")).toBe(base);
    expect(resolveVariantUrl(false, "quickdraw", base, "light")).toBe(base);
    expect(resolveVariantUrl(false, "starstruck", base, "medium-dark")).toBe(base);
    expect(resolveVariantUrl(false, "yolo", base, "default")).toBe(base);
  });

  it("returns base when hasVariants is true but tone is default", () => {
    expect(resolveVariantUrl(true, "quickdraw", base, "default")).toBe(base);
    expect(resolveVariantUrl(true, "starstruck", base, "default")).toBe(base);
  });

  it("returns variant URL when hasVariants is true and tone is light", () => {
    expect(resolveVariantUrl(true, "quickdraw", base, "light")).toBe(
      "/badges/variants/quickdraw-default--light.png",
    );
  });

  it("returns variant URL when hasVariants is true and tone is dark", () => {
    expect(resolveVariantUrl(true, "starstruck", base, "dark")).toBe(
      "/badges/variants/starstruck-default--dark.png",
    );
  });

  it("delegates to badgeVariantUrl for any non-default tone", () => {
    for (const tone of ["light-medium", "medium", "medium-dark"] as const) {
      expect(resolveVariantUrl(true, "quickdraw", base, tone)).toBe(
        badgeVariantUrl("quickdraw", tone, base),
      );
    }
  });
});

describe("SKIN_TONE_EMOJI and SKIN_TONE_OPTIONS", () => {
  it("SKIN_TONE_EMOJI has length 6", () => {
    expect(Object.keys(SKIN_TONE_EMOJI)).toHaveLength(6);
  });

  it("SKIN_TONE_OPTIONS has length 6", () => {
    expect(SKIN_TONE_OPTIONS).toHaveLength(6);
  });

  it("SKIN_TONE_EMOJI contains all expected tones", () => {
    expect(SKIN_TONE_EMOJI.default).toBe("✌️");
    expect(SKIN_TONE_EMOJI.light).toBe("✌🏻");
    expect(SKIN_TONE_EMOJI["light-medium"]).toBe("✌🏼");
    expect(SKIN_TONE_EMOJI.medium).toBe("✌🏽");
    expect(SKIN_TONE_EMOJI["medium-dark"]).toBe("✌🏾");
    expect(SKIN_TONE_EMOJI.dark).toBe("✌🏿");
  });

  it("SKIN_TONE_OPTIONS emojis match SKIN_TONE_EMOJI", () => {
    for (const option of SKIN_TONE_OPTIONS) {
      expect(option.emoji).toBe(SKIN_TONE_EMOJI[option.tone]);
    }
  });
});

describe("getStoredSkinTone", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to default when window is undefined", () => {
    vi.stubGlobal("window", undefined as unknown as Window & typeof globalThis);
    expect(getStoredSkinTone()).toBe("default");
  });

  it("defaults to default when localStorage is empty", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn().mockReturnValue(null),
      },
    } as unknown as Window & typeof globalThis);
    expect(getStoredSkinTone()).toBe("default");
  });

  it("defaults to default when localStorage returns invalid value", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn().mockReturnValue("invalid"),
      },
    } as unknown as Window & typeof globalThis);
    expect(getStoredSkinTone()).toBe("default");
  });

  it("defaults to default when localStorage returns empty string", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn().mockReturnValue(""),
      },
    } as unknown as Window & typeof globalThis);
    expect(getStoredSkinTone()).toBe("default");
  });

  it("returns stored value when it is a valid tone", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn().mockReturnValue("dark"),
      },
    } as unknown as Window & typeof globalThis);
    expect(getStoredSkinTone()).toBe("dark");
  });

  it("returns each valid stored tone correctly", () => {
    const validTones = ["default", "light", "light-medium", "medium", "medium-dark", "dark"];
    for (const tone of validTones) {
      vi.stubGlobal("window", {
        localStorage: {
          getItem: vi.fn().mockReturnValue(tone),
        },
      } as unknown as Window & typeof globalThis);
      expect(getStoredSkinTone()).toBe(tone);
    }
  });
});

describe("achievements variants", () => {
  it("quickdraw has variants with length 5", () => {
    const quickdraw = achievements.find((a) => a.slug === "quickdraw");
    expect(quickdraw).toBeDefined();
    expect(quickdraw?.variants).toHaveLength(5);
    expect(quickdraw?.variants).toEqual(["light", "light-medium", "medium", "medium-dark", "dark"]);
  });

  it("starstruck has variants with length 5", () => {
    const starstruck = achievements.find((a) => a.slug === "starstruck");
    expect(starstruck).toBeDefined();
    expect(starstruck?.variants).toHaveLength(5);
    expect(starstruck?.variants).toEqual([
      "light",
      "light-medium",
      "medium",
      "medium-dark",
      "dark",
    ]);
  });

  it("yolo has no variants (undefined)", () => {
    const yolo = achievements.find((a) => a.slug === "yolo");
    expect(yolo).toBeDefined();
    expect(yolo?.variants).toBeUndefined();
  });

  it("other achievements without skin tones have undefined variants", () => {
    const slugsWithoutVariants = ["pair-extraordinaire", "galaxy-brain", "pull-shark", "yolo"];
    for (const slug of slugsWithoutVariants) {
      const achievement = achievements.find((a) => a.slug === slug);
      expect(achievement).toBeDefined();
      expect(achievement?.variants).toBeUndefined();
    }
  });
});
