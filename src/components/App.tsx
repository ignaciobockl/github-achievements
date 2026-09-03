import type { LocalizedAchievement } from "../data/localize";
import type { Locale } from "../i18n";
import type { Messages } from "../i18n/translations";
import { Catalog } from "./Catalog";
import { Header } from "./Header";

interface AppProps {
  locale: Locale;
  achievements: LocalizedAchievement[];
  t: Messages;
  homePath: string;
}

export default function App({ locale, achievements, t, homePath }: AppProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header t={t} locale={locale} title={t.meta.title} homePath={homePath} />
      <Catalog achievements={achievements} t={t} locale={locale} />
    </div>
  );
}
