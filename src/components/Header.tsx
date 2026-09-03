import type { Locale } from "../i18n";
import type { Messages } from "../i18n/translations";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  t: Messages;
  locale: Locale;
  title: string;
  homePath: string;
}

export function Header({ t, locale, title, homePath }: HeaderProps) {
  return (
    <header className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <a href={homePath} className="text-lg font-semibold hover:opacity-80">
          {title}
        </a>
        <div className="flex items-center gap-6">
          <LocaleSwitcher label={t.locale.label} locale={locale} />
          <ThemeToggle label={t.theme.label} labels={t.theme} />
        </div>
      </div>
    </header>
  );
}
