import { useMemo, useState } from "react";
import type { LocalizedAchievement } from "../data/localize";
import type { Locale } from "../i18n";
import type { Messages } from "../i18n/translations";
import { AchievementCard } from "./AchievementCard";

interface CatalogProps {
  achievements: LocalizedAchievement[];
  t: Messages;
  locale: Locale;
}

type Filter = "all" | "earnable" | "obsolete" | "internal" | "disabled";

export function Catalog({ achievements, t, locale }: CatalogProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: t.catalog.filterAll },
    { value: "earnable", label: t.catalog.filterEarnable },
    { value: "obsolete", label: t.catalog.filterObsolete },
    { value: "internal", label: t.catalog.filterInternal },
    { value: "disabled", label: t.catalog.filterDisabled },
  ];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return achievements.filter((a) => {
      const matchesFilter = filter === "all" || a.category === filter;
      const matchesSearch =
        query === "" ||
        a.title.toLowerCase().includes(query) ||
        a.summary.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [achievements, filter, search]);

  const earnableCount = achievements.filter((a) => a.earnable).length;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.catalog.title}</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t.catalog.subtitle}</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
          {achievements.length} {t.catalog.total} · {earnableCount} {t.catalog.earnable}
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">{t.catalog.filterLabel}</legend>
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </fieldset>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t.catalog.search}
          aria-label={t.catalog.search}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">{t.catalog.noResults}</p>
      ) : (
        <section aria-labelledby="achievements-heading">
          <h2 id="achievements-heading" className="sr-only">
            {t.catalog.achievementsList}
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((achievement) => (
              <li key={achievement.slug}>
                <AchievementCard achievement={achievement} t={t} locale={locale} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
