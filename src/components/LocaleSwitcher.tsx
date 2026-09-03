import { useEffect, useState } from "react";
import { defaultLocale, detectLocale, type Locale, localeLabels } from "../i18n";

interface LocaleSwitcherProps {
  label: string;
}

export function LocaleSwitcher({ label }: LocaleSwitcherProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    setLocale(detectLocale(navigator.language));
  }, []);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="locale-switcher" className="text-sm font-medium opacity-80">
        {label}
      </label>
      <select
        id="locale-switcher"
        value={locale}
        onChange={(event) => {
          window.location.pathname = `/${event.target.value}`;
        }}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      >
        {Object.entries(localeLabels).map(([value, name]) => (
          <option key={value} value={value}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
