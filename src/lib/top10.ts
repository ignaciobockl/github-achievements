import type { Achievement, Tier } from "../data/types";
import type { GitHubAchievement } from "./github-api";

/**
 * Tier weight multipliers for scoring
 * Base score per achievement = 1 * tierWeight
 */
export const TIER_WEIGHTS: Record<Tier, number> = {
  default: 1,
  bronze: 2,
  silver: 3,
  gold: 4,
};

/**
 * Tie-breaker weight: adds (achievements_count * 0.5) to score
 */
export const TIE_BREAKER_WEIGHT = 0.5;

/**
 * Represents a single achievement in the top10 context,
 * mapped from GitHub's API response.
 */
export interface Top10Achievement {
  slug: string;
  title: string;
  tier: Tier;
  earned_at: string;
  repo_name?: string;
}

/**
 * Breakdown of achievements by tier
 */
export interface TierBreakdown {
  default: number;
  bronze: number;
  silver: number;
  gold: number;
}

/**
 * Represents a user in the top10 leaderboard
 */
export interface Top10User {
  username: string;
  avatar_url: string;
  profile_url: string;
  total_achievements: number;
  tier_breakdown: TierBreakdown;
  score: number;
  achievements: Top10Achievement[];
}

/**
 * Complete top10 data structure for persistence
 */
export interface Top10Data {
  generated_at: string;
  users: Top10User[];
}

/**
 * Hardcoded list of candidate users known for high achievement counts
 */
export const CANDIDATE_USERS = [
  "torvalds",
  "ljharb",
  "Schweinepriester",
  "Rongronggg9",
  "brannon",
  "timrogers",
  "gaearon",
  "sindresorhus",
  "tj",
  "paulirish",
  "addyosmani",
  "jakearchibald",
  "mattn",
  "rwaldron",
  "sebmarkbage",
  "getify",
  "danielchatfield",
  "nicklockwood",
  "laurentj",
  "mhevery",
] as const;

/**
 * Maps GitHub API tier string to our Tier type
 */
export function mapTier(tier: string): Tier {
  const lower = tier.toLowerCase();
  if (lower === "bronze" || lower === "silver" || lower === "gold") {
    return lower;
  }
  return "default";
}

/**
 * Converts GitHubAchievement to Top10Achievement
 */
function toTop10Achievement(
  ghAchievement: GitHubAchievement,
  achievements: Achievement[],
): Top10Achievement {
  const achievement = achievements.find((a) => a.slug === ghAchievement.name);
  const tier = mapTier(ghAchievement.tier);
  const repoName = ghAchievement.repository
    ? `${ghAchievement.repository.owner.login}/${ghAchievement.repository.name}`
    : undefined;

  return {
    slug: ghAchievement.name,
    title: achievement?.title.en ?? ghAchievement.name,
    tier,
    earned_at: ghAchievement.earned_at,
    repo_name: repoName,
  };
}

/**
 * Calculates the score for a user based on their achievements
 * Score = sum of (tier_weight) + (achievements_count * TIE_BREAKER_WEIGHT)
 */
export function calculateScore(achievements: Top10Achievement[]): number {
  const tierScore = achievements.reduce((sum, ach) => sum + TIER_WEIGHTS[ach.tier], 0);
  const tieBreaker = achievements.length * TIE_BREAKER_WEIGHT;
  return tierScore + tieBreaker;
}

/**
 * Builds tier breakdown from achievements
 */
export function buildTierBreakdown(achievements: Top10Achievement[]): TierBreakdown {
  const breakdown: TierBreakdown = {
    default: 0,
    bronze: 0,
    silver: 0,
    gold: 0,
  };

  for (const ach of achievements) {
    breakdown[ach.tier]++;
  }

  return breakdown;
}

/**
 * Fetches and processes achievements for a single candidate user
 */
async function processCandidate(
  username: string,
  achievements: Achievement[],
  fetchFn: (username: string) => Promise<{ data: GitHubAchievement[] }>,
): Promise<Top10User | null> {
  try {
    const { data: ghAchievements } = await fetchFn(username);

    if (!ghAchievements || ghAchievements.length === 0) {
      return null;
    }

    const top10Achievements = ghAchievements.map((ga) => toTop10Achievement(ga, achievements));
    const tierBreakdown = buildTierBreakdown(top10Achievements);
    const score = calculateScore(top10Achievements);

    // Fetch user profile for avatar and profile URL
    // We use a simple fetch since we don't want to import the whole github-api class here
    const userResponse = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    let avatar_url = `https://github.com/${username}.png`;
    let profile_url = `https://github.com/${username}`;

    if (userResponse.ok) {
      const userData = await userResponse.json();
      avatar_url = userData.avatar_url ?? avatar_url;
      profile_url = userData.html_url ?? profile_url;
    }

    return {
      username,
      avatar_url,
      profile_url,
      total_achievements: top10Achievements.length,
      tier_breakdown: tierBreakdown,
      score,
      achievements: top10Achievements,
    };
  } catch (error) {
    console.warn(`[top10] Failed to process candidate ${username}:`, error);
    return null;
  }
}

/**
 * Calculates the top 10 users by achievement score
 * @param candidates - Array of GitHub usernames to evaluate
 * @param achievements - Full list of achievement definitions for title mapping
 * @param fetchFn - Optional custom fetch function for testing (defaults to real API)
 * @returns Promise resolving to Top10Data with top 10 users sorted by score desc
 */
export async function calculateTop10(
  candidates: string[] = [...CANDIDATE_USERS],
  achievements: Achievement[],
  fetchFn: (username: string) => Promise<{ data: GitHubAchievement[] }> = async (username) => {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/achievements`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return { data: (await response.json()) as GitHubAchievement[] };
  },
): Promise<Top10Data> {
  const results = await Promise.allSettled(
    candidates.map((username) => processCandidate(username, achievements, fetchFn)),
  );

  const users: Top10User[] = results
    .filter(
      (r): r is PromiseFulfilledResult<Top10User> => r.status === "fulfilled" && r.value !== null,
    )
    .map((r) => r.value)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return {
    generated_at: new Date().toISOString(),
    users,
  };
}

/**
 * Saves Top10Data to a JSON file
 * @param data - The top10 data to save
 * @param filePath - Path to the JSON file (relative to project root)
 */
export async function saveTop10(data: Top10Data, filePath: string): Promise<void> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const fullPath = path.resolve(filePath);
  const dir = path.dirname(fullPath);

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Loads Top10Data from a JSON file
 * @param filePath - Path to the JSON file (relative to project root)
 * @returns Top10Data or null if file doesn't exist or is invalid
 */
export async function loadTop10(filePath: string): Promise<Top10Data | null> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const fullPath = path.resolve(filePath);

  try {
    const content = await fs.readFile(fullPath, "utf-8");
    return JSON.parse(content) as Top10Data;
  } catch {
    return null;
  }
}

/**
 * Convenience function to calculate and save top10 in one call
 */
export async function calculateAndSaveTop10(
  achievements: Achievement[],
  outputPath: string = "public/data/top10.json",
  candidates: string[] = [...CANDIDATE_USERS],
  fetchFn?: (username: string) => Promise<{ data: GitHubAchievement[] }>,
): Promise<Top10Data> {
  const data = await calculateTop10(candidates, achievements, fetchFn);
  await saveTop10(data, outputPath);
  return data;
}
