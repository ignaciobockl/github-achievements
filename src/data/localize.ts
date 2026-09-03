import type { Locale } from "../i18n";
import type { Achievement, TierDefinition } from "./types";

export interface LocalizedTier {
  tier: TierDefinition["tier"];
  label: string;
  emoji: string;
  hex: string;
  criterion: string;
}

export interface LocalizedAchievement {
  slug: string;
  title: string;
  badge: Achievement["badge"];
  category: Achievement["category"];
  earnable: boolean;
  earnability: Achievement["earnability"];
  summary: string;
  howToGet: string[];
  tiers: LocalizedTier[];
  references: { label: string; url: string }[];
  previousNames?: string[];
}

export function localizeAchievement(
  achievement: Achievement,
  locale: Locale,
): LocalizedAchievement {
  return {
    slug: achievement.slug,
    title: achievement.title[locale],
    badge: achievement.badge,
    category: achievement.category,
    earnable: achievement.earnable,
    earnability: achievement.earnability,
    summary: achievement.summary[locale],
    howToGet: achievement.howToGet[locale],
    tiers: achievement.tiers.map((tier) => ({
      tier: tier.tier,
      label: tier.label,
      emoji: tier.emoji,
      hex: tier.hex,
      criterion: tier.criterion[locale],
    })),
    references: achievement.references.map((ref) => ({
      label: ref.label[locale],
      url: ref.url,
    })),
    previousNames: achievement.previousNames?.map((name) => name[locale]),
  };
}
