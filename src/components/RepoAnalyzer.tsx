import { useCallback, useState } from "react";
import type { Locale } from "../i18n";
import type { Messages } from "../i18n/translations";
import {
  fetchRepo,
  fetchUser,
  fetchUserAchievements,
  type GitHubAchievement,
  GitHubApiError,
  type GitHubRepo,
  type GitHubUser,
} from "../lib/github-api";

interface RepoAnalyzerProps {
  locale: Locale;
  t: Messages;
}

interface AchievementWithTier extends GitHubAchievement {
  tierIndex: number;
  nextTier?: string;
  progress?: number;
}

export function RepoAnalyzer({ locale, t }: RepoAnalyzerProps) {
  const [username, setUsername] = useState("");
  const [repoInput, setRepoInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [achievements, setAchievements] = useState<AchievementWithTier[]>([]);
  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null);

  const parseRepoInput = useCallback((input: string): { owner: string; repo: string } | null => {
    const parts = input.trim().split("/");
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { owner: parts[0], repo: parts[1] };
    }
    return null;
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!username.trim()) {
      setError(t.repoAnalyzer.usernameLabel);
      return;
    }

    setIsLoading(true);
    setError(null);
    setUser(null);
    setAchievements([]);
    setRepo(null);
    setRateLimitRemaining(null);

    try {
      // Fetch user data
      const userResult = await fetchUser(username.trim());
      setUser(userResult.data);
      setRateLimitRemaining(userResult.rateLimit.remaining);

      // Fetch user achievements
      const achievementsResult = await fetchUserAchievements(username.trim());
      setRateLimitRemaining(
        Math.min(rateLimitRemaining ?? Infinity, achievementsResult.rateLimit.remaining),
      );

      // Process achievements with tier info
      const processedAchievements: AchievementWithTier[] = achievementsResult.data.map(
        (achievement, _index) => {
          const tierOrder = ["default", "bronze", "silver", "gold"] as const;
          const currentTierIndex = tierOrder.indexOf(
            achievement.tier as (typeof tierOrder)[number],
          );
          const nextTier =
            currentTierIndex >= 0 && currentTierIndex < tierOrder.length - 1
              ? tierOrder[currentTierIndex + 1]
              : undefined;

          return {
            ...achievement,
            tierIndex: currentTierIndex,
            nextTier,
          };
        },
      );

      setAchievements(processedAchievements);

      // Fetch repo info if provided
      const parsedRepo = parseRepoInput(repoInput);
      if (parsedRepo) {
        try {
          const repoResult = await fetchRepo(parsedRepo.owner, parsedRepo.repo);
          setRepo(repoResult.data);
          setRateLimitRemaining(
            Math.min(rateLimitRemaining ?? Infinity, repoResult.rateLimit.remaining),
          );
        } catch {
          // Repo fetch failed, but don't fail the whole analysis
          console.warn("Failed to fetch repo info");
        }
      }
    } catch (err) {
      if (err instanceof GitHubApiError) {
        switch (err.status) {
          case 403:
            setError(t.repoAnalyzer.rateLimitError);
            break;
          case 404:
            setError(t.repoAnalyzer.notFoundError);
            break;
          default:
            setError(`${t.repoAnalyzer.error}: ${err.message}`);
        }
      } else {
        setError(t.repoAnalyzer.genericError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [username, repoInput, t, rateLimitRemaining, parseRepoInput]);

  const handleRetry = useCallback(() => {
    handleAnalyze();
  }, [handleAnalyze]);

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case "gold":
        return "text-amber-500 dark:text-amber-400";
      case "silver":
        return "text-neutral-400 dark:text-neutral-400";
      case "bronze":
        return "text-amber-700 dark:text-amber-500";
      default:
        return "text-neutral-500 dark:text-neutral-500";
    }
  };

  const getTierBgColor = (tier: string): string => {
    switch (tier) {
      case "gold":
        return "bg-amber-100 dark:bg-amber-900/40";
      case "silver":
        return "bg-neutral-100 dark:bg-neutral-800";
      case "bronze":
        return "bg-amber-50 dark:bg-amber-900/20";
      default:
        return "bg-neutral-100 dark:bg-neutral-800";
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      {/* Input Section */}
      <section
        className="mb-8 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800"
        aria-labelledby="analyzer-title"
      >
        <h2 id="analyzer-title" className="text-2xl font-bold tracking-tight">
          {t.repoAnalyzer.title}
        </h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t.repoAnalyzer.subtitle}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              {t.repoAnalyzer.usernameLabel}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.repoAnalyzer.usernamePlaceholder}
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="repo"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              {t.repoAnalyzer.repoLabel}
            </label>
            <input
              id="repo"
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder={t.repoAnalyzer.repoPlaceholder}
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 outline-none focus:ring-2 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isLoading || !username.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {t.repoAnalyzer.analyzingButton}
              </>
            ) : (
              t.repoAnalyzer.analyzeButton
            )}
          </button>

          {error && (
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 rounded-lg border border-red-500 px-6 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:hover:bg-red-900/20 dark:text-red-400"
            >
              {t.repoAnalyzer.retryButton}
            </button>
          )}
        </div>

        {rateLimitRemaining !== null && rateLimitRemaining <= 5 && (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-400" role="status">
            {t.repoAnalyzer.rateLimitError}
          </p>
        )}
      </section>

      {/* Error Display */}
      {error && (
        <div
          className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 text-red-500 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {t.repoAnalyzer.error}
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Info */}
      {user && (
        <section
          className="mb-8 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800"
          aria-labelledby="user-info-title"
        >
          <h3 id="user-info-title" className="sr-only">
            {t.repoAnalyzer.repoInfo}
          </h3>
          <div className="flex items-center gap-4">
            <img
              src={user.avatar_url}
              alt={`${user.login} avatar`}
              width={64}
              height={64}
              className="h-16 w-16 max-w-full rounded-full"
            />
            <div>
              <h3 className="text-xl font-semibold">{user.name ?? user.login}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">@{user.login}</p>
              {user.bio && (
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{user.bio}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Repo Info */}
      {repo && (
        <section
          className="mb-8 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800"
          aria-labelledby="repo-info-title"
        >
          <h3 id="repo-info-title" className="text-lg font-semibold flex items-center gap-2">
            <svg
              className="h-5 w-5 text-blue-500"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.301 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.52 11.52 0 0112 5.805c1.02.005 2.047.138 3.006.404 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .319.21.69.825.57C20.565 21.797 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            {t.repoAnalyzer.repoInfo}
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {t.repoAnalyzer.stars}
              </p>
              <p className="mt-1 text-2xl font-bold">{repo.stargazers_count.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {t.repoAnalyzer.forks}
              </p>
              <p className="mt-1 text-2xl font-bold">{repo.forks_count.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {t.repoAnalyzer.watchers}
              </p>
              <p className="mt-1 text-2xl font-bold">{repo.watchers_count.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {t.repoAnalyzer.language}
              </p>
              <p className="mt-1 text-lg font-medium">{repo.language ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {t.repoAnalyzer.createdAt}
              </p>
              <p className="mt-1 text-sm">{formatDate(repo.created_at)}</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {t.repoAnalyzer.pushedAt}
              </p>
              <p className="mt-1 text-sm">{formatDate(repo.pushed_at)}</p>
            </div>
          </div>
          <div className="mt-4">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View on GitHub
            </a>
          </div>
        </section>
      )}

      {/* Achievements */}
      <section className="mb-8" aria-labelledby="achievements-title">
        <div className="flex items-center justify-between">
          <h3 id="achievements-title" className="text-lg font-semibold">
            {t.repoAnalyzer.achievements}
          </h3>
          {achievements.length > 0 && (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              {achievements.length} {t.repoAnalyzer.achievements.toLowerCase()}
            </span>
          )}
        </div>

        {isLoading && !user && (
          <div className="mt-6 flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <svg
                className="animate-spin h-6 w-6 text-blue-500"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-neutral-600 dark:text-neutral-400">
                {t.repoAnalyzer.loading}
              </span>
            </div>
          </div>
        )}

        {!isLoading && achievements.length === 0 && user && (
          <div className="mt-6 rounded-xl border border-neutral-200 p-8 text-center dark:border-neutral-800">
            <svg
              className="mx-auto h-12 w-12 text-neutral-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <p className="mt-4 text-neutral-600 dark:text-neutral-400">
              {t.repoAnalyzer.noAchievements}
            </p>
          </div>
        )}

        {achievements.length > 0 && (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {achievements.map((achievement) => (
              <li key={`${achievement.name}-${achievement.tier}`}>
                <article className="rounded-xl border border-neutral-200 p-5 transition hover:border-blue-400 hover:shadow-md dark:border-neutral-800 dark:hover:border-blue-600">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          achievement.repository?.owner
                            ? `https://github.com/${achievement.repository.owner.login}.png`
                            : `https://github.com/${username}.png`
                        }
                        alt={`${achievement.name} badge`}
                        width={48}
                        height={48}
                        loading="lazy"
                        className="h-12 w-12 max-w-full rounded-lg object-cover bg-neutral-100 dark:bg-neutral-800"
                      />
                      <div>
                        <h4 className="font-semibold leading-tight">{achievement.name}</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`${getTierBgColor(achievement.tier)} ${getTierColor(achievement.tier)} rounded-full px-3 py-1 text-xs font-medium capitalize`}
                    >
                      {t.tierNames[achievement.tier as keyof typeof t.tierNames] ??
                        achievement.tier}
                    </span>
                  </div>

                  {achievement.nextTier && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-500">
                        <span>
                          {t.repoAnalyzer.progress} {t.repoAnalyzer.nextTier}:{" "}
                          {t.tierNames[achievement.nextTier as keyof typeof t.tierNames] ??
                            achievement.nextTier}
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: "0%" }}
                          role="progressbar"
                          aria-valuenow={0}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Progress toward ${t.tierNames[achievement.nextTier as keyof typeof t.tierNames] ?? achievement.nextTier} tier`}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-500">
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t.repoAnalyzer.earnedAt} {formatDate(achievement.earned_at)}
                    </span>
                    {achievement.repository && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.301 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.52 11.52 0 0112 5.805c1.02.005 2.047.138 3.006.404 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .319.21.69.825.57C20.565 21.797 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
                        </svg>
                        {achievement.repository.owner.login}/{achievement.repository.name}
                      </span>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
