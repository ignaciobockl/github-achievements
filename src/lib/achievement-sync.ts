import type { Achievement, Earnability, TierDefinition } from "../data/types";
import { type MarkdownTable, parseMarkdownTable } from "./markdown";

const RAW_README_URL =
  "https://raw.githubusercontent.com/Schweinepriester/github-profile-achievements/main/README.md";

export interface SourceTier {
  tier: TierDefinition["tier"];
  criterion: string;
}

interface ParsedTier extends SourceTier {
  baseTitle: string;
}

export interface SourceAchievement {
  slug: string;
  title: string;
  category: Achievement["category"];
  earnable: boolean;
  earnability: Earnability;
  earnedBy: string;
  tiers: SourceTier[];
}

export interface SyncReport {
  added: string[];
  removed: string[];
  updatedTiers: string[];
  unchanged: string[];
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function classifyEarnability(cell: string): { earnable: boolean; earnability: Earnability } {
  if (cell.includes("✔️")) {
    return { earnable: true, earnability: "earnable" };
  }
  if (cell.toLowerCase().includes("internal")) {
    return { earnable: false, earnability: "internal" };
  }
  if (cell.toLowerCase().includes("being tested")) {
    return { earnable: false, earnability: "being-tested" };
  }
  return { earnable: false, earnability: "not-earnable" };
}

interface SectionedTable {
  section: string;
  table: MarkdownTable;
}

function extractSectionedTables(markdown: string): SectionedTable[] {
  const lines = markdown.split(/\r?\n/);
  const result: SectionedTable[] = [];
  let currentSection = "";
  let currentBucket: string[] = [];

  const flush = () => {
    if (currentBucket.length > 0) {
      const table = parseMarkdownTable(currentBucket);
      if (table) {
        result.push({ section: currentSection, table });
      }
      currentBucket = [];
    }
  };

  for (const line of lines) {
    const headerMatch = /^(#{2,3})\s+(.+)$/.exec(line);
    if (headerMatch) {
      flush();
      currentSection = headerMatch[2].toLowerCase();
      continue;
    }
    if (line.includes("|")) {
      currentBucket.push(line);
    } else {
      flush();
    }
  }
  flush();

  return result;
}

type SectionKind = Achievement["category"] | "achievements" | "tiers" | "ignore";

function sectionKind(section: string): SectionKind {
  if (section === "internal") return "internal";
  if (section === "disabled") return "disabled";
  if (section === "tiers") return "tiers";
  if (section === "achievements") return "achievements";
  return "ignore";
}

function stripMarkdownLink(cell: string): string {
  return cell.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim();
}

export function normalizeCriterion(criterion: string): string {
  return stripMarkdownLink(criterion)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.]+$/u, "")
    .trim()
    .toLowerCase();
}

export function extractSourceAchievements(markdown: string): SourceAchievement[] {
  const tables = extractSectionedTables(markdown);
  const base: Omit<SourceAchievement, "tiers">[] = [];
  const tiers: ParsedTier[] = [];

  for (const { section, table } of tables) {
    const kind = sectionKind(section);

    if (kind === "ignore") {
      continue;
    }

    if (kind === "tiers") {
      for (const row of table.rows) {
        const titleCell = stripMarkdownLink(row[0] ?? "");
        const tierCell = stripMarkdownLink(row[1] ?? "");
        const criterion = stripMarkdownLink(row[3] ?? "");
        const tier = tierCell.toLowerCase().includes("bronze")
          ? "bronze"
          : tierCell.toLowerCase().includes("silver")
            ? "silver"
            : tierCell.toLowerCase().includes("gold")
              ? "gold"
              : null;

        if (tier === null) {
          continue;
        }

        const baseTitle = titleCell.replace(/\s+x\d+$/i, "").trim();
        tiers.push({ baseTitle, tier, criterion });
      }
      continue;
    }

    for (const row of table.rows) {
      const title = stripMarkdownLink(row[0] ?? "");
      if (!title) {
        continue;
      }
      const { earnable, earnability } = classifyEarnability(row[2] ?? "");
      const category: Achievement["category"] =
        kind === "internal" || kind === "disabled" ? kind : earnable ? "earnable" : "obsolete";

      base.push({
        slug: slugify(title),
        title,
        category,
        earnable,
        earnability,
        earnedBy: stripMarkdownLink(row[3] ?? ""),
      });
    }
  }

  return base.map((achievement) => ({
    ...achievement,
    tiers: tiers
      .filter((tier) => slugify(tier.baseTitle) === achievement.slug)
      .map(({ baseTitle: _baseTitle, ...rest }) => rest),
  }));
}

export function diffAchievements(local: Achievement[], source: SourceAchievement[]): SyncReport {
  const localSlugs = new Set(local.map((a) => a.slug));
  const sourceSlugs = new Set(source.map((a) => a.slug));

  const added = source.filter((a) => !localSlugs.has(a.slug)).map((a) => a.title);
  const removed = local.filter((a) => !sourceSlugs.has(a.slug)).map((a) => a.title.en);

  const sourceBySlug = new Map(source.map((a) => [a.slug, a]));
  const updatedTiers: string[] = [];

  for (const achievement of local) {
    const src = sourceBySlug.get(achievement.slug);
    if (!src) {
      continue;
    }
    const localTiers = new Map(
      achievement.tiers.map((tier) => [tier.tier, normalizeCriterion(tier.criterion.en)] as const),
    );
    const sourceTiers = new Map(
      src.tiers.map((tier) => [tier.tier, normalizeCriterion(tier.criterion)] as const),
    );
    const tiersMatch =
      localTiers.size === sourceTiers.size &&
      [...localTiers].every(([tier, criterion]) => sourceTiers.get(tier) === criterion);
    if (!tiersMatch) {
      updatedTiers.push(achievement.title.en);
    }
  }

  const unchanged = local
    .filter((a) => sourceSlugs.has(a.slug) && !updatedTiers.includes(a.title.en))
    .map((a) => a.title.en);

  return { added, removed, updatedTiers, unchanged };
}

export async function fetchSourceReadme(): Promise<string> {
  const response = await fetch(RAW_README_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch README: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

export { RAW_README_URL };
