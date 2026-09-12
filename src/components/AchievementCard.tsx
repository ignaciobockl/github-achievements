import type { LocalizedAchievement } from "../data/localize";
import type { Locale } from "../i18n";
import type { Messages } from "../i18n/translations";

interface AchievementCardProps {
  achievement: LocalizedAchievement;
  t: Messages;
  locale: Locale;
}

export function AchievementCard({ achievement, t, locale }: AchievementCardProps) {
  const earnabilityLabel = t.earnability[achievement.earnability];
  const categoryLabel = t.categories[achievement.category];

  return (
    <a
      href={`/${locale}/achievements/${achievement.slug}`}
      className="block h-full rounded-xl border border-neutral-200 p-5 transition hover:border-blue-400 hover:shadow-md dark:border-neutral-800 dark:hover:border-blue-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={achievement.badge.default}
            alt={`${achievement.title} badge`}
            width={48}
            height={48}
            loading="lazy"
            className="h-12 w-12 max-w-full object-contain"
            style={{ aspectRatio: "1/1", maxWidth: "100%", height: "auto" }}
          />
          <h2 className="font-semibold leading-tight">{achievement.title}</h2>
        </div>
        {achievement.earnable ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {t.catalog.earnable}
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            {t.catalog.notEarnable}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">{achievement.summary}</p>

      <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500">
        <span>{categoryLabel}</span>
        <span aria-hidden="true">·</span>
        <span>{earnabilityLabel}</span>
        {achievement.tiers.length > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              {achievement.tiers.length} {t.catalog.tiers.toLowerCase()}
            </span>
          </>
        )}
      </div>
    </a>
  );
}
