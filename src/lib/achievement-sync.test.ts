import { describe, expect, it } from "vitest";
import type { Achievement } from "../data/types";
import {
  classifyEarnability,
  diffAchievements,
  extractSourceAchievements,
  normalizeCriterion,
  slugify,
} from "./achievement-sync";

const README = [
  "## Achievements",
  "",
  "| Title | Badge | Earnable? | Earned by |",
  "| --- | --- | --- | --- |",
  "Pull Shark | img | ✔️ | 2 pull requests merged",
  "Arctic Code Vault Contributor | img | ❌ | Contributed code",
  "",
  "### Internal",
  "",
  "| Title | Badge | Earnable? | Earned by |",
  "| --- | --- | --- | --- |",
  "Proxima Pioneer | img | ❌ (Internal) | M0 Participant",
  "",
  "### Disabled",
  "",
  "| Title | Badge | Earnable? | Earned by |",
  "| --- | --- | --- | --- |",
  "Open Sourcerer | img | ❌ (🔜 Being tested) | PRs merged",
  "",
  "## Tiers",
  "",
  "| Title | Tier | Badge | Earned by |",
  "| --- | --- | --- | --- |",
  "Pull Shark x2 | Bronze 🥉 | img | 16 pull requests merged",
  "Pull Shark x4 | Gold 🥇 | img | 1024 pull requests merged",
  "",
  "## Details",
  "",
  "### Tier labels",
  "",
  "| Tier | Label |",
  "| --- | --- |",
  "Bronze 🥉 | x2 |",
  "",
  "## Previous versions",
  "",
  "| Title | Badge |",
  "| --- | --- |",
  "GitHub Sponsor | img |",
].join("\n");

describe("slugify", () => {
  it("converts titles to slugs", () => {
    expect(slugify("Pair Extraordinaire")).toBe("pair-extraordinaire");
    expect(slugify("Mars 2020 Contributor")).toBe("mars-2020-contributor");
  });
});

describe("classifyEarnability", () => {
  it("detects earnable, internal, and being-tested", () => {
    expect(classifyEarnability("✔️")).toEqual({ earnable: true, earnability: "earnable" });
    expect(classifyEarnability("❌ (Internal)")).toEqual({
      earnable: false,
      earnability: "internal",
    });
    expect(classifyEarnability("❌ (🔜 Being tested)")).toEqual({
      earnable: false,
      earnability: "being-tested",
    });
  });
});

describe("extractSourceAchievements", () => {
  it("extracts achievements with categories and tiers", () => {
    const source = extractSourceAchievements(README);

    const pullShark = source.find((a) => a.slug === "pull-shark");
    expect(pullShark).toBeDefined();
    expect(pullShark?.category).toBe("earnable");
    expect(pullShark?.earnable).toBe(true);
    expect(pullShark?.tiers).toHaveLength(2);
    expect(pullShark?.tiers[0]).toMatchObject({ tier: "bronze" });
    expect(pullShark?.tiers[1]).toMatchObject({ tier: "gold" });

    const arctic = source.find((a) => a.slug === "arctic-code-vault-contributor");
    expect(arctic?.category).toBe("obsolete");
    expect(arctic?.earnable).toBe(false);

    const proxima = source.find((a) => a.slug === "proxima-pioneer");
    expect(proxima?.category).toBe("internal");

    const openSourcerer = source.find((a) => a.slug === "open-sourcerer");
    expect(openSourcerer?.category).toBe("disabled");
    expect(openSourcerer?.earnability).toBe("being-tested");
  });

  it("ignores tables outside the achievements and tiers sections", () => {
    const source = extractSourceAchievements(README);
    const slugs = source.map((a) => a.slug);

    expect(slugs).toHaveLength(4);
    expect(slugs).not.toContain("bronze");
    expect(slugs).not.toContain("github-sponsor");
  });
});

describe("normalizeCriterion", () => {
  it("ignores trailing periods, case, and extra whitespace", () => {
    expect(normalizeCriterion("16 pull requests merged.")).toBe(
      normalizeCriterion("  16  pull requests merged"),
    );
    expect(normalizeCriterion("16 Pull Requests Merged.")).toBe("16 pull requests merged");
  });
});

describe("diffAchievements", () => {
  function makeAchievement(
    slug: string,
    title: string,
    overrides: Partial<Achievement> = {},
  ): Achievement {
    return {
      slug,
      title: { en: title, es: title },
      badge: { default: "/badge.png" },
      category: "earnable",
      earnable: true,
      earnability: "earnable",
      summary: { en: "", es: "" },
      howToGet: { en: [], es: [] },
      tiers: [],
      references: [],
      ...overrides,
    };
  }

  it("detects added, removed, and tier updates", () => {
    const local: Achievement[] = [
      makeAchievement("pull-shark", "Pull Shark", {
        tiers: [
          {
            tier: "bronze",
            label: "x2",
            emoji: "🥉",
            hex: "#fff",
            criterion: { en: "16 pull requests merged.", es: "" },
          },
        ],
      }),
      makeAchievement("yolo", "YOLO"),
    ];

    const source = extractSourceAchievements(README);

    const report = diffAchievements(local, source);

    expect(report.added).toContain("Arctic Code Vault Contributor");
    expect(report.removed).toContain("YOLO");
    expect(report.updatedTiers).toContain("Pull Shark");
  });

  it("ignores formatting differences in tier criteria", () => {
    const source = extractSourceAchievements(README);
    const pullSharkSource = source.find((a) => a.slug === "pull-shark");
    if (!pullSharkSource) {
      throw new Error("Pull Shark not found in fixture");
    }

    const local: Achievement[] = [
      makeAchievement("pull-shark", "Pull Shark", {
        tiers: pullSharkSource.tiers.map((tier) => ({
          tier: tier.tier,
          label: "x2",
          emoji: "🥉",
          hex: "#fff",
          criterion: { en: `${tier.criterion}.`, es: "" },
        })),
      }),
    ];

    const report = diffAchievements(local, source);

    expect(report.updatedTiers).toHaveLength(0);
  });

  it("flags tiers whose criteria moved across tier levels", () => {
    const source = extractSourceAchievements(README);
    const pullSharkSource = source.find((a) => a.slug === "pull-shark");
    if (!pullSharkSource) {
      throw new Error("Pull Shark not found in fixture");
    }
    const [bronze, gold] = pullSharkSource.tiers;
    if (!bronze || !gold) {
      throw new Error("Expected bronze and gold tiers in fixture");
    }

    const local: Achievement[] = [
      makeAchievement("pull-shark", "Pull Shark", {
        tiers: [
          {
            tier: "bronze",
            label: "x2",
            emoji: "🥉",
            hex: "#fff",
            criterion: { en: gold.criterion, es: "" },
          },
          {
            tier: "gold",
            label: "x4",
            emoji: "🥇",
            hex: "#fff",
            criterion: { en: bronze.criterion, es: "" },
          },
        ],
      }),
    ];

    const report = diffAchievements(local, source);

    expect(report.updatedTiers).toContain("Pull Shark");
  });

  it("reports no changes for identical data", () => {
    const source = extractSourceAchievements(README);
    const local: Achievement[] = source.map((a) => ({
      slug: a.slug,
      title: { en: a.title, es: a.title },
      badge: { default: "/badge.png" },
      category: a.category,
      earnable: a.earnable,
      earnability: a.earnability,
      summary: { en: a.earnedBy, es: "" },
      howToGet: { en: [a.earnedBy], es: [] },
      tiers: a.tiers.map((tier) => ({
        tier: tier.tier,
        label: "x2",
        emoji: "🥉",
        hex: "#fff",
        criterion: { en: tier.criterion, es: "" },
      })),
      references: [],
    }));

    const report = diffAchievements(local, source);

    expect(report.added).toHaveLength(0);
    expect(report.removed).toHaveLength(0);
    expect(report.updatedTiers).toHaveLength(0);
  });
});
