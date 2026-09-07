export const defaultLocale = "en";

export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) {
    return defaultLocale;
  }
  const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase();
  return preferred && isLocale(preferred) ? preferred : defaultLocale;
}
