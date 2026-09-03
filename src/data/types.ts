export type AchievementCategory = "earnable" | "obsolete" | "internal" | "disabled";

export type Earnability = "earnable" | "not-earnable" | "internal" | "disabled" | "being-tested";

export type Tier = "default" | "bronze" | "silver" | "gold";

export interface TierDefinition {
  tier: Exclude<Tier, "default">;
  label: string;
  emoji: string;
  hex: string;
  criterion: string;
}

export interface AchievementBadge {
  default: string;
  bronze?: string;
  silver?: string;
  gold?: string;
}

export interface AchievementReference {
  label: string;
  url: string;
}

export interface Achievement {
  slug: string;
  title: string;
  badge: AchievementBadge;
  category: AchievementCategory;
  earnable: boolean;
  earnability: Earnability;
  summary: string;
  howToGet: string[];
  tiers: TierDefinition[];
  references: AchievementReference[];
  previousNames?: string[];
}
