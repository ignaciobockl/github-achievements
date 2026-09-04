import { achievements } from "../src/data/achievements";
import {
  diffAchievements,
  extractSourceAchievements,
  fetchSourceReadme,
} from "../src/lib/achievement-sync";

async function main() {
  console.log("Fetching source README…");
  const markdown = await fetchSourceReadme();

  const source = extractSourceAchievements(markdown);
  const report = diffAchievements(achievements, source);

  console.log(`\nLocal achievements: ${achievements.length}`);
  console.log(`Source achievements: ${source.length}`);

  console.log(`\nAdded (${report.added.length}):`);
  for (const title of report.added) {
    console.log(`  + ${title}`);
  }
  if (report.added.length === 0) {
    console.log("  (none)");
  }

  console.log(`\nRemoved (${report.removed.length}):`);
  for (const title of report.removed) {
    console.log(`  - ${title}`);
  }
  if (report.removed.length === 0) {
    console.log("  (none)");
  }

  console.log(`\nUpdated tiers (${report.updatedTiers.length}):`);
  for (const title of report.updatedTiers) {
    console.log(`  ~ ${title}`);
  }
  if (report.updatedTiers.length === 0) {
    console.log("  (none)");
  }

  console.log(`\nUnchanged: ${report.unchanged.length}`);

  if (report.added.length > 0 || report.removed.length > 0 || report.updatedTiers.length > 0) {
    console.log(
      "\nThe local dataset is out of sync. Update src/data/achievements.ts to match the source, then re-run.",
    );
    process.exitCode = 1;
  } else {
    console.log("\nThe local dataset is up to date.");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
