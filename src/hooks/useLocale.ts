import { useCallback, useEffect, useState } from "react";
import { detectLocale, type Locale } from "../i18n";
import { translations } from "../i18n/translations";

export function useLocale() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(detectLocale(navigator.language));
  }, []);

  const switchLocale = useCallback((next: Locale) => {
    setLocale(next);
  }, []);

  return { locale, switchLocale, t: translations[locale] };
}
