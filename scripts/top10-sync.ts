import { achievements } from "@/data/achievements";
import { fetchUserAchievements, GitHubApiError, getSecondsUntilReset } from "@/lib/github-api";
import { CANDIDATE_USERS, calculateAndSaveTop10 } from "@/lib/top10";

const DELAY_MIN_MS = 100;
const DELAY_MAX_MS = 200;
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): number {
  return Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS + 1)) + DELAY_MIN_MS;
}

async function fetchWithRetry(
  username: string,
  attempt = 1,
): Promise<{
  data: Awaited<ReturnType<typeof fetchUserAchievements>>["data"];
  rateLimit: Awaited<ReturnType<typeof fetchUserAchievements>>["rateLimit"];
} | null> {
  try {
    const result = await fetchUserAchievements(username);
    return result;
  } catch (error: unknown) {
    if (error instanceof GitHubApiError) {
      if (error.status === 403 || error.status === 429) {
        const rateLimitInfo = {
          limit: 0,
          remaining: 0,
          reset: Math.floor(Date.now() / 1000) + 60,
          used: 0,
        };

        if (attempt <= MAX_RETRIES) {
          const waitSeconds = getSecondsUntilReset(rateLimitInfo) ?? 60;
          const waitMs = Math.min(waitSeconds * 1000, 60000);
          console.warn(
            `  [${username}] Rate limited (attempt ${attempt}/${MAX_RETRIES}). Waiting ${waitMs}ms...`,
          );
          await sleep(waitMs);
          return fetchWithRetry(username, attempt + 1);
        }
        console.error(`  [${username}] Rate limited after ${MAX_RETRIES} attempts. Skipping.`);
        return null;
      }

      if (error.status === 404) {
        console.warn(`  [${username}] User not found (404). Skipping.`);
        return null;
      }

      if (attempt <= MAX_RETRIES && error.status >= 500) {
        const waitMs = randomDelay() * attempt;
        console.warn(
          `  [${username}] Server error (${error.status}), attempt ${attempt}/${MAX_RETRIES}. Retrying in ${waitMs}ms...`,
        );
        await sleep(waitMs);
        return fetchWithRetry(username, attempt + 1);
      }
    }

    console.error(
      `  [${username}] Failed:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════════");
  console.log("  GitHub Achievements Top 10 Sync");
  console.log("═══════════════════════════════════════════════");
  console.log(`Candidates: ${CANDIDATE_USERS.length}`);
  console.log("");

  // We'll fetch all users sequentially with delays, then calculate top 10
  const candidates = [...CANDIDATE_USERS] as string[];
  const fetchFn = async (
    username: string,
  ): Promise<{ data: Awaited<ReturnType<typeof fetchUserAchievements>>["data"] }> => {
    const delayMs = randomDelay();
    await sleep(delayMs);

    const result = await fetchWithRetry(username);
    if (!result) {
      return { data: [] };
    }
    return { data: result.data };
  };

  try {
    console.log("Calculating top 10...\n");
    const outputPath = "public/top10.json";
    const top10Data = await calculateAndSaveTop10(achievements, outputPath, candidates, fetchFn);

    console.log("");
    console.log("═══════════════════════════════════════════════");
    console.log("  Top 10 Results");
    console.log("═══════════════════════════════════════════════");

    for (let i = 0; i < top10Data.users.length; i++) {
      const user = top10Data.users[i];
      console.log(
        `${i + 1}. ${user.username} — Score: ${user.score.toFixed(1)} (${user.total_achievements} achievements)`,
      );
      console.log(
        `   Tiers: ${user.tier_breakdown.gold}🥇 ${user.tier_breakdown.silver}🥈 ${user.tier_breakdown.bronze}🥉 ${user.tier_breakdown.default}⬜`,
      );
    }

    if (top10Data.users.length === 0) {
      console.log("No users with achievements found!");
    }

    console.log("");
    console.log(`✓ Saved to ${outputPath}`);
    console.log(`✓ Generated at: ${top10Data.generated_at}`);
    console.log("═══════════════════════════════════════════════");

    process.exitCode = 0;
  } catch (error) {
    console.error("");
    console.error("═══════════════════════════════════════════════");
    console.error("  Critical Error");
    console.error("═══════════════════════════════════════════════");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

main();
