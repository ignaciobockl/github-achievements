import type { Locale } from "../i18n";

export type AchievementCategory = "earnable" | "obsolete" | "internal" | "disabled";

export type Earnability = "earnable" | "not-earnable" | "internal" | "disabled" | "being-tested";

export type Tier = "default" | "bronze" | "silver" | "gold";

export type LocalizedText = Record<Locale, string>;
export type LocalizedStringArray = Record<Locale, string[]>;

export interface TierDefinition {
  tier: Exclude<Tier, "default">;
  label: string;
  emoji: string;
  hex: string;
  criterion: LocalizedText;
}

export interface AchievementBadge {
  default: string;
  bronze?: string;
  silver?: string;
  gold?: string;
}

export interface AchievementReference {
  label: LocalizedText;
  url: string;
}

export interface Achievement {
  slug: string;
  title: LocalizedText;
  badge: AchievementBadge;
  category: AchievementCategory;
  earnable: boolean;
  earnability: Earnability;
  summary: LocalizedText;
  howToGet: LocalizedStringArray;
  tiers: TierDefinition[];
  references: AchievementReference[];
  previousNames?: LocalizedText[];
}
