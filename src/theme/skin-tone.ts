import type { SkinTone } from "../data/types";

export const SKIN_TONE_STORAGE_KEY = "gha-skin-tone";

export function getStoredSkinTone(): SkinTone {
  if (typeof window === "undefined") {
    return "default";
  }
  const stored = window.localStorage.getItem(SKIN_TONE_STORAGE_KEY);
  if (
    stored === "default" ||
    stored === "light" ||
    stored === "light-medium" ||
    stored === "medium" ||
    stored === "medium-dark" ||
    stored === "dark"
  ) {
    return stored;
  }
  return "default";
}

export function setStoredSkinTone(skinTone: SkinTone): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SKIN_TONE_STORAGE_KEY, skinTone);
  applySkinTone(skinTone);
}

export function applySkinTone(skinTone: SkinTone): void {
  document.documentElement.dataset.skinTone = skinTone;
}

export function badgeVariantUrl(slug: string, tone: SkinTone, baseUrl?: string): string {
  if (tone === "default") {
    return baseUrl ?? `/badges/variants/${slug}-default.png`;
  }
  return `/badges/variants/${slug}-default--${tone}.png`;
}

export function resolveVariantUrl(
  hasVariants: boolean,
  slug: string,
  baseUrl: string,
  tone: SkinTone,
): string {
  if (!hasVariants) {
    return baseUrl;
  }
  if (tone === "default") {
    return baseUrl;
  }
  return badgeVariantUrl(slug, tone);
}

export const SKIN_TONE_EMOJI: Record<SkinTone, string> = {
  default: "✌️",
  light: "✌🏻",
  "light-medium": "✌🏼",
  medium: "✌🏽",
  "medium-dark": "✌🏾",
  dark: "✌🏿",
};
