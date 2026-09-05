import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Achievement, Tier } from "../data/types";
import type { GitHubAchievement } from "./github-api";
import {
  buildTierBreakdown,
  CANDIDATE_USERS,
  calculateScore,
  calculateTop10,
  loadTop10,
  mapTier,
  saveTop10,
  TIE_BREAKER_WEIGHT,
  TIER_WEIGHTS,
} from "./top10";

// Mock achievements for testing
const mockAchievements: Achievement[] = [
  {
    slug: "pair-extraordinaire",
    title: { en: "Pair Extraordinaire", es: "Pair Extraordinaire" },
    category: "earnable",
    earnable: true,
    earnability: "earnable",
    badge: {
      default: "https://example.com/pair-extraordinaire-default.png",
      bronze: "https://example.com/pair-extraordinaire-bronze.png",
      silver: "https://example.com/pair-extraordinaire-silver.png",
      gold: "https://example.com/pair-extraordinaire-gold.png",
    },
    summary: { en: "Coauthor commits", es: "Coautoría" },
    howToGet: { en: ["Coauthor a commit"], es: ["Coautoriza un commit"] },
    tiers: [
      {
        tier: "bronze",
        label: "x2",
        emoji: "🥉",
        hex: "#F9BFA7",
        criterion: { en: "10 PRs", es: "10 PRs" },
      },
      {
        tier: "silver",
        label: "x3",
        emoji: "🥈",
        hex: "#E1E4E4",
        criterion: { en: "24 PRs", es: "24 PRs" },
      },
      {
        tier: "gold",
        label: "x4",
        emoji: "🥇",
        hex: "#FAE57E",
        criterion: { en: "48 PRs", es: "48 PRs" },
      },
    ],
    references: [],
  },
  {
    slug: "quickdraw",
    title: { en: "Quickdraw", es: "Quickdraw" },
    category: "earnable",
    earnable: true,
    earnability: "earnable",
    badge: { default: "https://example.com/quickdraw-default.png" },
    summary: { en: "Close issue quickly", es: "Cierra issue rápido" },
    howToGet: { en: ["Close within 5 min"], es: ["Cierra en 5 min"] },
    tiers: [],
    references: [],
  },
  {
    slug: "starstruck",
    title: { en: "Starstruck", es: "Starstruck" },
    category: "earnable",
    earnable: true,
    earnability: "earnable",
    badge: {
      default: "https://example.com/starstruck-default.png",
      bronze: "https://example.com/starstruck-bronze.png",
      silver: "https://example.com/starstruck-silver.png",
      gold: "https://example.com/starstruck-gold.png",
    },
    summary: { en: "Get stars", es: "Consigue estrellas" },
    howToGet: { en: ["Create popular repo"], es: ["Crea repo popular"] },
    tiers: [
      {
        tier: "bronze",
        label: "x2",
        emoji: "🥉",
        hex: "#F9BFA7",
        criterion: { en: "128 stars", es: "128 estrellas" },
      },
      {
        tier: "silver",
        label: "x3",
        emoji: "🥈",
        hex: "#E1E4E4",
        criterion: { en: "512 stars", es: "512 estrellas" },
      },
      {
        tier: "gold",
        label: "x4",
        emoji: "🥇",
        hex: "#FAE57E",
        criterion: { en: "4096 stars", es: "4096 estrellas" },
      },
    ],
    references: [],
  },
];

// Mock GitHub achievements response
const mockGitHubAchievements: GitHubAchievement[] = [
  {
    name: "pair-extraordinaire",
    description: "Coauthor commits in merged pull requests.",
    tier: "gold",
    earned_at: "2024-01-15T10:00:00Z",
    repository: { name: "test-repo", owner: { login: "testuser" } },
  },
  {
    name: "quickdraw",
    description: "Close an issue or pull request within 5 minutes of opening it.",
    tier: "default",
    earned_at: "2024-01-10T10:00:00Z",
  },
  {
    name: "starstruck",
    description: "Create a repository that earns stars.",
    tier: "silver",
    earned_at: "2024-01-05T10:00:00Z",
    repository: { name: "popular-repo", owner: { login: "testuser" } },
  },
];

describe("top10 module", () => {
  describe("TIER_WEIGHTS", () => {
    it("has correct weights for all tiers", () => {
      expect(TIER_WEIGHTS.default).toBe(1);
      expect(TIER_WEIGHTS.bronze).toBe(2);
      expect(TIER_WEIGHTS.silver).toBe(3);
      expect(TIER_WEIGHTS.gold).toBe(4);
    });
  });

  describe("TIE_BREAKER_WEIGHT", () => {
    it("is 0.5", () => {
      expect(TIE_BREAKER_WEIGHT).toBe(0.5);
    });
  });

  describe("CANDIDATE_USERS", () => {
    it("contains expected users", () => {
      expect(CANDIDATE_USERS).toContain("torvalds");
      expect(CANDIDATE_USERS).toContain("ljharb");
      expect(CANDIDATE_USERS).toContain("Schweinepriester");
      expect(CANDIDATE_USERS).toContain("sindresorhus");
      expect(CANDIDATE_USERS).toContain("gaearon");
    });

    it("has 20 candidates", () => {
      expect(CANDIDATE_USERS).toHaveLength(20);
    });
  });

  describe("mapTier", () => {
    it("maps known tiers correctly", () => {
      expect(mapTier("bronze")).toBe("bronze");
      expect(mapTier("silver")).toBe("silver");
      expect(mapTier("gold")).toBe("gold");
    });

    it("maps unknown tiers to default", () => {
      expect(mapTier("platinum")).toBe("default");
      expect(mapTier("unknown")).toBe("default");
      expect(mapTier("")).toBe("default");
    });

    it("handles case insensitivity", () => {
      expect(mapTier("BRONZE")).toBe("bronze");
      expect(mapTier("Silver")).toBe("silver");
      expect(mapTier("Gold")).toBe("gold");
    });
  });

  describe("calculateScore", () => {
    it("calculates score with tier weights and tie-breaker", () => {
      const achievements = [
        { slug: "a", title: "A", tier: "gold" as Tier, earned_at: "2024-01-01T00:00:00Z" },
        { slug: "b", title: "B", tier: "silver" as Tier, earned_at: "2024-01-01T00:00:00Z" },
        { slug: "c", title: "C", tier: "bronze" as Tier, earned_at: "2024-01-01T00:00:00Z" },
        { slug: "d", title: "D", tier: "default" as Tier, earned_at: "2024-01-01T00:00:00Z" },
      ];

      // gold(4) + silver(3) + bronze(2) + default(1) = 10
      // tie-breaker: 4 * 0.5 = 2
      // total = 12
      expect(calculateScore(achievements)).toBe(12);
    });

    it("returns 0 for empty achievements", () => {
      expect(calculateScore([])).toBe(0);
    });

    it("handles only default tier achievements", () => {
      const achievements = [
        { slug: "a", title: "A", tier: "default" as Tier, earned_at: "2024-01-01T00:00:00Z" },
        { slug: "b", title: "B", tier: "default" as Tier, earned_at: "2024-01-01T00:00:00Z" },
      ];
      // 1 + 1 + (2 * 0.5) = 3
      expect(calculateScore(achievements)).toBe(3);
    });
  });

  describe("buildTierBreakdown", () => {
    it("counts achievements by tier correctly", () => {
      const achievements = [
        { slug: "a", title: "A", tier: "gold" as Tier, earned_at: "2024-01-01T00:00:00Z" },
        { slug: "b", title: "B", tier: "gold" as Tier, earned_at: "2024-01-01T00:00:00Z" },
        { slug: "c", title: "C", tier: "silver" as Tier, earned_at: "2024-01-01T00:00:00Z" },
        { slug: "d", title: "D", tier: "bronze" as Tier, earned_at: "2024-01-01T00:00:00Z" },
        { slug: "e", title: "E", tier: "default" as Tier, earned_at: "2024-01-01T00:00:00Z" },
      ];

      const breakdown = buildTierBreakdown(achievements);
      expect(breakdown.gold).toBe(2);
      expect(breakdown.silver).toBe(1);
      expect(breakdown.bronze).toBe(1);
      expect(breakdown.default).toBe(1);
    });

    it("returns zeros for empty array", () => {
      const breakdown = buildTierBreakdown([]);
      expect(breakdown).toEqual({ default: 0, bronze: 0, silver: 0, gold: 0 });
    });
  });

  describe("calculateTop10", () => {
    const mockFetchFn = vi.fn();

    beforeEach(() => {
      vi.resetAllMocks();
      mockFetchFn.mockReset();
    });

    it("returns top 10 users sorted by score desc", async () => {
      const candidates = ["user1", "user2", "user3"];

      // user1: 3 achievements (gold, silver, default) = score 10.5
      // user2: 2 achievements (gold, gold) = score 9
      // user3: 1 achievement (default) = score 1.5
      mockFetchFn
        .mockResolvedValueOnce({ data: mockGitHubAchievements }) // user1
        .mockResolvedValueOnce({
          data: [
            {
              name: "pair-extraordinaire",
              description: "",
              tier: "gold",
              earned_at: "2024-01-01T00:00:00Z",
            },
            {
              name: "starstruck",
              description: "",
              tier: "gold",
              earned_at: "2024-01-01T00:00:00Z",
            },
          ],
        }) // user2
        .mockResolvedValueOnce({
          data: [
            {
              name: "quickdraw",
              description: "",
              tier: "default",
              earned_at: "2024-01-01T00:00:00Z",
            },
          ],
        }); // user3

      // Mock user profile fetch
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avatar_url: "https://github.com/user1.png",
            html_url: "https://github.com/user1",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avatar_url: "https://github.com/user2.png",
            html_url: "https://github.com/user2",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            avatar_url: "https://github.com/user3.png",
            html_url: "https://github.com/user3",
          }),
        });

      const result = await calculateTop10(candidates, mockAchievements, mockFetchFn);

      expect(result.users).toHaveLength(3);
      expect(result.users[0].username).toBe("user1");
      expect(result.users[1].username).toBe("user2");
      expect(result.users[2].username).toBe("user3");
      expect(result.users[0].score).toBeGreaterThan(result.users[1].score);
      expect(result.users[1].score).toBeGreaterThan(result.users[2].score);
    });

    it("limits results to 10 users", async () => {
      const candidates = Array.from({ length: 15 }, (_, i) => `user${i}`);

      mockFetchFn.mockResolvedValue({ data: mockGitHubAchievements });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          avatar_url: "https://github.com/user.png",
          html_url: "https://github.com/user",
        }),
      });

      const result = await calculateTop10(candidates, mockAchievements, mockFetchFn);

      expect(result.users).toHaveLength(10);
    });

    it("excludes users with no achievements", async () => {
      const candidates = ["user-with-achievements", "user-without"];

      mockFetchFn
        .mockResolvedValueOnce({ data: mockGitHubAchievements }) // user-with-achievements
        .mockResolvedValueOnce({ data: [] }); // user-without

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          avatar_url: "https://github.com/user.png",
          html_url: "https://github.com/user",
        }),
      });

      const result = await calculateTop10(candidates, mockAchievements, mockFetchFn);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].username).toBe("user-with-achievements");
    });

    it("handles fetch errors gracefully", async () => {
      const candidates = ["failing-user", "success-user"];

      mockFetchFn
        .mockRejectedValueOnce(new Error("API error")) // failing-user
        .mockResolvedValueOnce({ data: mockGitHubAchievements }); // success-user

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          avatar_url: "https://github.com/user.png",
          html_url: "https://github.com/user",
        }),
      });

      const result = await calculateTop10(candidates, mockAchievements, mockFetchFn);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].username).toBe("success-user");
    });

    it("includes generated_at timestamp", async () => {
      const candidates = ["user1"];

      mockFetchFn.mockResolvedValue({ data: mockGitHubAchievements });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          avatar_url: "https://github.com/user1.png",
          html_url: "https://github.com/user1",
        }),
      });

      const before = new Date().toISOString();
      const result = await calculateTop10(candidates, mockAchievements, mockFetchFn);
      const after = new Date().toISOString();

      expect(result.generated_at).toBeDefined();
      expect(result.generated_at >= before).toBe(true);
      expect(result.generated_at <= after).toBe(true);
    });
  });

  describe("saveTop10 and loadTop10", () => {
    const testFilePath = "test-top10.json";

    beforeEach(() => {
      vi.resetAllMocks();
    });

    it("saves and loads data correctly", async () => {
      const testData = {
        generated_at: "2024-01-15T12:00:00.000Z",
        users: [
          {
            username: "testuser",
            avatar_url: "https://github.com/testuser.png",
            profile_url: "https://github.com/testuser",
            total_achievements: 3,
            tier_breakdown: { default: 1, bronze: 1, silver: 1, gold: 0 },
            score: 10.5,
            achievements: [
              { slug: "a", title: "A", tier: "gold" as Tier, earned_at: "2024-01-01T00:00:00Z" },
              { slug: "b", title: "B", tier: "silver" as Tier, earned_at: "2024-01-01T00:00:00Z" },
              { slug: "c", title: "C", tier: "bronze" as Tier, earned_at: "2024-01-01T00:00:00Z" },
            ],
          },
        ],
      };

      await saveTop10(testData, testFilePath);
      const loaded = await loadTop10(testFilePath);

      expect(loaded).toEqual(testData);
    });

    it("returns null for non-existent file", async () => {
      const loaded = await loadTop10("non-existent-file.json");
      expect(loaded).toBeNull();
    });
  });
});
