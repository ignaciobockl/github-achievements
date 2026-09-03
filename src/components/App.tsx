import { useEffect, useState } from "react";
import { detectLocale, type Locale } from "../i18n";
import { translations } from "../i18n/translations";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export default function App() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(detectLocale(navigator.language));
  }, []);

  const t = translations[locale];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
        <span className="text-lg font-semibold">{t.placeholder.title}</span>
        <div className="flex items-center gap-6">
          <LocaleSwitcher label={t.locale.label} />
          <ThemeToggle label={t.theme.label} labels={t.theme} />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
          {t.placeholder.eyebrow}
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
          {t.placeholder.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          {t.placeholder.subtitle}
        </p>
        <p className="mt-12 text-sm text-neutral-500 dark:text-neutral-500">
          {t.placeholder.comingSoon}
        </p>
      </main>
    </div>
  );
}
