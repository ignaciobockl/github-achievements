import type { Locale } from "../i18n";

export type AchievementCategory = "earnable" | "obsolete" | "internal" | "disabled";

export type Earnability = "earnable" | "not-earnable" | "internal" | "disabled" | "being-tested";

export type Tier = "default" | "bronze" | "silver" | "gold";

export type SkinTone = "default" | "light" | "light-medium" | "medium" | "medium-dark" | "dark";

export interface SkinToneOption {
  tone: SkinTone;
  labelKey: string;
  emoji: string;
}

export const SKIN_TONE_OPTIONS: SkinToneOption[] = [
  { tone: "default", labelKey: "skinTone.default", emoji: "✌️" },
  { tone: "light", labelKey: "skinTone.light", emoji: "✌🏻" },
  { tone: "light-medium", labelKey: "skinTone.lightMedium", emoji: "✌🏼" },
  { tone: "medium", labelKey: "skinTone.medium", emoji: "✌🏽" },
  { tone: "medium-dark", labelKey: "skinTone.mediumDark", emoji: "✌🏾" },
  { tone: "dark", labelKey: "skinTone.dark", emoji: "✌🏿" },
];

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
  variants?: SkinTone[];
}
