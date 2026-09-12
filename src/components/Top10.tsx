import { useEffect, useState } from "react";
import type { Locale } from "../i18n";
import type { Messages } from "../i18n/translations";
import type { Top10Data, Top10User } from "../lib/top10";

interface Top10Props {
  locale: Locale;
  t: Messages;
}

const MEDAL_EMOJIS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

function formatDate(dateString: string, locale: Locale): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function Top10({ locale, t }: Top10Props) {
  const [data, setData] = useState<Top10Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/top10.json", {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          throw new Error(`Failed to load: ${response.status}`);
        }
        const json = (await response.json()) as Top10Data;
        if (mounted) {
          setData(json);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mx-auto" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mx-auto" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mx-auto" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mx-auto" />
        </div>
        <p className="mt-4 text-neutral-500 dark:text-neutral-400">{t.top10.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10 text-center">
        <div className="text-red-500 mb-4" role="alert">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">{t.top10.error}</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{error}</p>
      </div>
    );
  }

  if (!data || data.users.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center">
        <svg
          className="mx-auto h-16 w-16 text-neutral-300 dark:text-neutral-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h2 className="mt-4 text-xl font-semibold">{t.top10.no_data}</h2>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          {t.top10.generated_at}: {formatDate(data?.generated_at ?? "", locale)}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.top10.title}</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t.top10.subtitle}</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
          {t.top10.generated_at}: {formatDate(data.generated_at, locale)}
        </p>
      </div>

      {/* Mobile Card Layout */}
      <div className="block lg:hidden space-y-4">
        {data.users.map((user: Top10User, index: number) => {
          const rank = index + 1;
          const medal = MEDAL_EMOJIS[rank] ?? `#${rank}`;
          const isTop3 = rank <= 3;

          return (
            <article
              key={user.username}
              className={`rounded-xl border border-neutral-200 p-4 transition ${
                isTop3
                  ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="text-2xl font-mono font-bold text-neutral-700 dark:text-neutral-300"
                    role="img"
                    aria-label={`Rank ${rank}`}
                  >
                    {medal}
                  </span>
                  <a
                    href={user.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="h-8 w-8 max-w-full rounded-full bg-neutral-100 dark:bg-neutral-800"
                      loading="lazy"
                      width={32}
                      height={32}
                      style={{ aspectRatio: "1/1", maxWidth: "100%", height: "auto" }}
                    />
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {user.username}
                    </span>
                  </a>
                </div>
                <span className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400">
                  {user.score.toFixed(1)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                    {user.total_achievements}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500">
                    {t.top10.achievements}
                  </p>
                </div>
                <div>
                  <p className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                    {user.tier_breakdown.gold +
                      user.tier_breakdown.silver +
                      user.tier_breakdown.bronze +
                      user.tier_breakdown.default}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500">{t.top10.tiers}</p>
                </div>
                <div className="flex items-center justify-center gap-1">
                  {user.tier_breakdown.gold > 0 && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      title={`${user.tier_breakdown.gold} Gold`}
                    >
                      🥇 {user.tier_breakdown.gold}
                    </span>
                  )}
                  {user.tier_breakdown.silver > 0 && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                      title={`${user.tier_breakdown.silver} Silver`}
                    >
                      🥈 {user.tier_breakdown.silver}
                    </span>
                  )}
                  {user.tier_breakdown.bronze > 0 && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
                      title={`${user.tier_breakdown.bronze} Bronze`}
                    >
                      🥉 {user.tier_breakdown.bronze}
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
              >
                {t.top10.rank}
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
              >
                {t.top10.user}
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
              >
                {t.top10.achievements}
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
              >
                {t.top10.tiers}
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
              >
                {t.top10.score}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {data.users.map((user: Top10User, index: number) => {
              const rank = index + 1;
              const medal = MEDAL_EMOJIS[rank] ?? `#${rank}`;
              const isTop3 = rank <= 3;

              return (
                <tr
                  key={user.username}
                  className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${isTop3 ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}`}
                >
                  <td className="px-4 py-3 font-mono font-semibold text-lg text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                    <span role="img" aria-label={`Rank ${rank}`}>
                      {medal}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <a
                      href={user.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={user.avatar_url}
                        alt=""
                        className="h-8 w-8 max-w-full rounded-full bg-neutral-100 dark:bg-neutral-800"
                        loading="lazy"
                        width={32}
                        height={32}
                        style={{ aspectRatio: "1/1", maxWidth: "100%", height: "auto" }}
                      />
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {user.username}
                      </span>
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                    {user.total_achievements}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {user.tier_breakdown.gold > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          title={`${user.tier_breakdown.gold} Gold`}
                        >
                          🥇 {user.tier_breakdown.gold}
                        </span>
                      )}
                      {user.tier_breakdown.silver > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                          title={`${user.tier_breakdown.silver} Silver`}
                        >
                          🥈 {user.tier_breakdown.silver}
                        </span>
                      )}
                      {user.tier_breakdown.bronze > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
                          title={`${user.tier_breakdown.bronze} Bronze`}
                        >
                          🥉 {user.tier_breakdown.bronze}
                        </span>
                      )}
                      {user.tier_breakdown.default > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                          title={`${user.tier_breakdown.default} Default`}
                        >
                          ⬜ {user.tier_breakdown.default}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-lg text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {user.score.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
