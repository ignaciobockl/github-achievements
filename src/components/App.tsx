import type { Achievement } from "../data/types";
import { useLocale } from "../hooks/useLocale";
import { Catalog } from "./Catalog";
import { Header } from "./Header";

interface AppProps {
  achievements: Achievement[];
}

export default function App({ achievements }: AppProps) {
  const { locale, switchLocale, t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col">
      <Header t={t} locale={locale} onLocaleChange={switchLocale} title={t.meta.title} />
      <Catalog achievements={achievements} t={t} />
    </div>
  );
}
