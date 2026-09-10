import { useCallback, useEffect, useRef, useState } from "react";
import type { SkinTone } from "@/data/types";
import type { Locale } from "@/i18n";
import type { Messages } from "@/i18n/translations";
import {
  fetchRepo,
  fetchUser,
  fetchUserAchievements,
  type GitHubAchievement,
  GitHubApiError,
  GitHubRateLimitError,
  type GitHubRepo,
  type GitHubUser,
  getCached,
  getSecondsUntilReset,
  type RateLimitInfo,
  setCached,
} from "@/lib/github-api";
import { getStoredSkinTone } from "../theme/skin-tone";

const RECENT_QUERIES_KEY = "gha-recent-queries";
const MAX_RECENT_QUERIES = 5;
const COOLDOWN_MS = 3000;

interface AchievementWithTier extends GitHubAchievement {
  tierIndex: number;
  nextTier?: string;
  progress?: number;
}

interface AnalyzerResult {
  user?: GitHubUser;
  achievements?: AchievementWithTier[];
  repo?: GitHubRepo;
  rateLimit?: RateLimitInfo;
}

interface RecentQuery {
  query: string;
  mode: "user" | "repo";
  timestamp: number;
}

const spinnerStyle: React.CSSProperties = {
  width: "18px",
  height: "18px",
  border: "2px solid rgba(255,255,255,0.3)",
  borderTopColor: "white",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

export function RepoAnalyzer({ locale, t }: { locale: Locale; t: Messages }) {
  const [mode, setMode] = useState<"user" | "repo">("user");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorRateLimit, setErrorRateLimit] = useState<RateLimitInfo | null>(null);
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [secondsUntilReset, setSecondsUntilReset] = useState<number | null>(null);
  const [_skinTone, setSkinTone] = useState<SkinTone>("default");

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = getStoredSkinTone();
    setSkinTone(stored);
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECENT_QUERIES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentQuery[];
        setRecentQueries(parsed.slice(0, MAX_RECENT_QUERIES));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (query.trim()) {
      setError(null);
      setErrorRateLimit(null);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setSecondsUntilReset(null);
    }
  }, [query]);

  useEffect(() => {
    if (errorRateLimit) {
      const seconds = getSecondsUntilReset(errorRateLimit);
      if (seconds !== null && seconds > 0) {
        setSecondsUntilReset(seconds);
        countdownRef.current = setInterval(() => {
          const remaining = getSecondsUntilReset(errorRateLimit);
          if (remaining !== null && remaining > 0) {
            setSecondsUntilReset(remaining);
          } else {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            setSecondsUntilReset(null);
            setErrorRateLimit(null);
          }
        }, 1000);
      }
    }
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [errorRateLimit]);

  const saveRecentQuery = useCallback((q: string, m: "user" | "repo") => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const newEntry: RecentQuery = { query: trimmed, mode: m, timestamp: Date.now() };
    setRecentQueries((prev) => {
      const filtered = prev.filter((r) => r.query !== trimmed || r.mode !== m);
      const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_QUERIES);
      try {
        window.localStorage.setItem(RECENT_QUERIES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const clearRecentQueries = useCallback(() => {
    setRecentQueries([]);
    try {
      window.localStorage.removeItem(RECENT_QUERIES_KEY);
    } catch {
      // ignore
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || loading || cooldown) return;

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < COOLDOWN_MS) {
      return;
    }

    setLoading(true);
    setError(null);
    setErrorRateLimit(null);
    setResult(null);
    setLastRequestTime(now);

    const cacheKey = `${mode}:${trimmed}`;

    try {
      const cached = getCached<AnalyzerResult>(cacheKey);
      if (cached) {
        setResult(cached.data);
        if (cached.rateLimit) {
          setErrorRateLimit(cached.rateLimit);
        }
        setLoading(false);
        saveRecentQuery(trimmed, mode);
        setCooldown(true);
        cooldownRef.current = setTimeout(() => setCooldown(false), COOLDOWN_MS);
        return;
      }

      let userData: GitHubUser | undefined;
      let achievementsData: AchievementWithTier[] = [];
      let repoData: GitHubRepo | undefined;
      let combinedRateLimit: RateLimitInfo | undefined;

      if (mode === "user") {
        const userResult = await fetchUser(trimmed);
        userData = userResult.data;
        combinedRateLimit = userResult.rateLimit;

        const achievementsResult = await fetchUserAchievements(trimmed);
        combinedRateLimit = {
          ...combinedRateLimit,
          remaining: Math.min(combinedRateLimit.remaining, achievementsResult.rateLimit.remaining),
          limit: Math.max(combinedRateLimit.limit, achievementsResult.rateLimit.limit),
          reset: Math.max(combinedRateLimit.reset, achievementsResult.rateLimit.reset),
          used: combinedRateLimit.used + achievementsResult.rateLimit.used,
        };

        const tierOrder = ["default", "bronze", "silver", "gold"] as const;
        achievementsData = achievementsResult.data.map((achievement) => {
          const currentTierIndex = tierOrder.indexOf(
            achievement.tier as (typeof tierOrder)[number],
          );
          const nextTier =
            currentTierIndex >= 0 && currentTierIndex < tierOrder.length - 1
              ? tierOrder[currentTierIndex + 1]
              : undefined;
          return { ...achievement, tierIndex: currentTierIndex, nextTier };
        });
      } else {
        const parsed = trimmed.split("/");
        if (parsed.length === 2 && parsed[0] && parsed[1]) {
          const repoResult = await fetchRepo(parsed[0], parsed[1]);
          repoData = repoResult.data;
          combinedRateLimit = repoResult.rateLimit;

          const userResult = await fetchUser(parsed[0]);
          userData = userResult.data;
          combinedRateLimit = {
            ...combinedRateLimit,
            remaining: Math.min(combinedRateLimit.remaining, userResult.rateLimit.remaining),
            limit: Math.max(combinedRateLimit.limit, userResult.rateLimit.limit),
            reset: Math.max(combinedRateLimit.reset, userResult.rateLimit.reset),
            used: combinedRateLimit.used + userResult.rateLimit.used,
          };

          const achievementsResult = await fetchUserAchievements(parsed[0]);
          combinedRateLimit = {
            ...combinedRateLimit,
            remaining: Math.min(
              combinedRateLimit.remaining,
              achievementsResult.rateLimit.remaining,
            ),
            limit: Math.max(combinedRateLimit.limit, achievementsResult.rateLimit.limit),
            reset: Math.max(combinedRateLimit.reset, achievementsResult.rateLimit.reset),
            used: combinedRateLimit.used + achievementsResult.rateLimit.used,
          };

          const tierOrder = ["default", "bronze", "silver", "gold"] as const;
          achievementsData = achievementsResult.data.map((achievement) => {
            const currentTierIndex = tierOrder.indexOf(
              achievement.tier as (typeof tierOrder)[number],
            );
            const nextTier =
              currentTierIndex >= 0 && currentTierIndex < tierOrder.length - 1
                ? tierOrder[currentTierIndex + 1]
                : undefined;
            return { ...achievement, tierIndex: currentTierIndex, nextTier };
          });
        }
      }

      const newResult: AnalyzerResult = {
        user: userData,
        achievements: achievementsData.length > 0 ? achievementsData : undefined,
        repo: repoData,
        rateLimit: combinedRateLimit,
      };

      setResult(newResult);
      if (combinedRateLimit) {
        setCached(cacheKey, newResult, combinedRateLimit);
      }
      saveRecentQuery(trimmed, mode);
    } catch (err) {
      if (err instanceof GitHubRateLimitError) {
        setError(err.message);
        setErrorRateLimit(err.rateLimit);
      } else if (err instanceof GitHubApiError) {
        switch (err.status) {
          case 404:
            setError(t.repoAnalyzer.notFoundError);
            break;
          case 403:
            setError(t.repoAnalyzer.rateLimitError);
            break;
          default:
            setError(`${t.repoAnalyzer.error}: ${err.message}`);
        }
      } else {
        setError(t.repoAnalyzer.genericError);
      }
    } finally {
      setLoading(false);
      setCooldown(true);
      cooldownRef.current = setTimeout(() => setCooldown(false), COOLDOWN_MS);
    }
  }, [query, mode, loading, cooldown, lastRequestTime, t, saveRecentQuery]);

  const handleRetry = useCallback(() => {
    handleAnalyze();
  }, [handleAnalyze]);

  const handleModeChange = useCallback((newMode: "user" | "repo") => {
    setMode(newMode);
    setQuery("");
    setResult(null);
    setError(null);
    setErrorRateLimit(null);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setSecondsUntilReset(null);
  }, []);

  const handleQuerySelect = useCallback((rq: RecentQuery) => {
    setMode(rq.mode);
    setQuery(rq.query);
    setShowRecent(false);
  }, []);

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
        return "var(--accent)";
      case "silver":
        return "var(--muted)";
      case "bronze":
        return "#cd7f32";
      default:
        return "var(--muted)";
    }
  };

  const getTierBgColor = (tier: string): string => {
    switch (tier) {
      case "gold":
        return "rgba(245, 158, 11, 0.15)";
      case "silver":
        return "rgba(148, 163, 184, 0.15)";
      case "bronze":
        return "rgba(205, 127, 50, 0.15)";
      default:
        return "var(--surface)";
    }
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "24px 16px",
    fontFamily: "var(--font-display)",
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "24px",
    marginBottom: "24px",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--fg)",
    marginBottom: "8px",
    opacity: 0.9,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
    fontFamily: "var(--font-display)",
    color: "var(--fg)",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "calc(var(--radius) - 4px)",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  };

  const radioGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "16px",
    marginBottom: "20px",
  };

  const radioLabelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--fg)",
  };

  const radioInputStyle: React.CSSProperties = {
    width: "18px",
    height: "18px",
    accentColor: "var(--accent)",
  };

  const buttonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: 600,
    fontFamily: "var(--font-display)",
    color: "white",
    backgroundColor: "var(--accent)",
    border: "none",
    borderRadius: "calc(var(--radius) - 4px)",
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.1s",
    opacity: loading || cooldown || !query.trim() ? 0.5 : 1,
    pointerEvents: loading || cooldown || !query.trim() ? "none" : "auto",
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "transparent",
    color: "var(--accent)",
    border: "1px solid var(--accent)",
    opacity: 1,
    pointerEvents: "auto",
  };

  const errorStyle: React.CSSProperties = {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "var(--radius)",
    padding: "16px",
    marginBottom: "24px",
    color: "#ef4444",
  };

  const resultSectionStyle: React.CSSProperties = {
    ...sectionStyle,
    animation: "fadeIn 0.3s ease-out",
  };

  const avatarStyle: React.CSSProperties = {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  };

  const badgeImageStyle: React.CSSProperties = {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    objectFit: "cover",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    flexShrink: 0,
  };

  const tierBadgeStyle = (tier: string): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 12px",
    fontSize: "12px",
    fontWeight: 600,
    fontFamily: "var(--font-display)",
    borderRadius: "999px",
    backgroundColor: getTierBgColor(tier),
    color: getTierColor(tier),
    textTransform: "capitalize",
  });

  const progressBarStyle: React.CSSProperties = {
    height: "6px",
    width: "100%",
    backgroundColor: "var(--border)",
    borderRadius: "999px",
    overflow: "hidden",
  };

  const progressFillStyle = (tier: string): React.CSSProperties => ({
    height: "100%",
    width: "0%",
    backgroundColor: getTierColor(tier),
    borderRadius: "999px",
    transition: "width 0.5s ease-out",
  });

  const linkStyle: React.CSSProperties = {
    color: "var(--accent)",
    textDecoration: "none",
    fontWeight: 500,
    transition: "opacity 0.2s",
  };

  const statCardStyle: React.CSSProperties = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "calc(var(--radius) - 4px)",
    padding: "16px",
    textAlign: "center",
  };

  const recentQueriesStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: "8px",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 50,
    maxHeight: "280px",
    overflowY: "auto",
  };

  const recentItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    cursor: "pointer",
    transition: "background-color 0.15s",
    borderBottom: "1px solid var(--border)",
  };

  const inputWrapperStyle: React.CSSProperties = {
    position: "relative",
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: "28px",
    fontWeight: 700,
    fontFamily: "var(--font-mono)",
    color: "var(--fg)",
    lineHeight: 1.2,
    marginTop: "4px",
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 500,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <div style={containerStyle}>
      <section style={sectionStyle} aria-labelledby="analyzer-title">
        <h2
          id="analyzer-title"
          style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px", color: "var(--fg)" }}
        >
          {t.repoAnalyzer.title}
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "15px", lineHeight: 1.5 }}>
          {t.repoAnalyzer.subtitle}
        </p>

        <div
          style={radioGroupStyle}
          role="radiogroup"
          aria-label={t.repoAnalyzer.modeLabel ?? "Analysis mode"}
        >
          <label style={radioLabelStyle}>
            <input
              type="radio"
              name="analyzer-mode"
              value="user"
              checked={mode === "user"}
              onChange={() => handleModeChange("user")}
              style={radioInputStyle}
              disabled={loading}
            />
            <span>{t.repoAnalyzer.userMode ?? "User"}</span>
          </label>
          <label style={radioLabelStyle}>
            <input
              type="radio"
              name="analyzer-mode"
              value="repo"
              checked={mode === "repo"}
              onChange={() => handleModeChange("repo")}
              style={radioInputStyle}
              disabled={loading}
            />
            <span>{t.repoAnalyzer.repoMode ?? "Repository"}</span>
          </label>
        </div>

        <div style={inputWrapperStyle}>
          <label htmlFor="analyzer-query" style={labelStyle}>
            {mode === "user" ? t.repoAnalyzer.usernameLabel : t.repoAnalyzer.repoLabel}
          </label>
          <input
            id="analyzer-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            onFocus={() => setShowRecent(recentQueries.length > 0)}
            onBlur={() => setTimeout(() => setShowRecent(false), 150)}
            placeholder={
              mode === "user" ? t.repoAnalyzer.usernamePlaceholder : t.repoAnalyzer.repoPlaceholder
            }
            style={inputStyle}
            disabled={loading}
            aria-autocomplete="list"
            aria-controls="recent-queries-list"
          />
          {showRecent && recentQueries.length > 0 && (
            <div id="recent-queries-list" style={recentQueriesStyle} role="listbox">
              {recentQueries.map((rq) => (
                <div
                  key={`${rq.query}-${rq.mode}`}
                  role="option"
                  tabIndex={-1}
                  onClick={() => handleQuerySelect(rq)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleQuerySelect(rq);
                    }
                  }}
                  style={{
                    ...recentItemStyle,
                    backgroundColor:
                      query === rq.query && mode === rq.mode ? "var(--accent)" : "transparent",
                    color: query === rq.query && mode === rq.mode ? "white" : "var(--fg)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: mode === "user" ? "var(--accent)" : "var(--muted)",
                      color: "white",
                      fontSize: "11px",
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      flexShrink: 0,
                    }}
                  >
                    {mode === "user" ? "👤" : "📦"}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {rq.query}
                    </div>
                    <div style={{ fontSize: "11px", opacity: 0.6, fontFamily: "var(--font-mono)" }}>
                      {rq.mode === "user"
                        ? (t.repoAnalyzer.userMode ?? "User")
                        : (t.repoAnalyzer.repoMode ?? "Repository")}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={clearRecentQueries}
                  style={{
                    ...secondaryButtonStyle,
                    padding: "8px 16px",
                    fontSize: "12px",
                    width: "100%",
                    color: "#ef4444",
                    borderColor: "#ef4444",
                  }}
                >
                  {t.repoAnalyzer.clearRecent ?? "Clear recent"}
                </button>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || cooldown || !query.trim()}
            style={buttonStyle}
            aria-busy={loading}
          >
            {loading && <span style={spinnerStyle} aria-hidden="true" />}
            {loading ? t.repoAnalyzer.analyzingButton : t.repoAnalyzer.analyzeButton}
            {cooldown && !loading && (
              <span style={{ fontSize: "12px", opacity: 0.8, fontFamily: "var(--font-mono)" }}>
                {" "}
                ({Math.ceil(COOLDOWN_MS / 1000)}s)
              </span>
            )}
          </button>

          {(error || errorRateLimit) && (
            <button type="button" onClick={handleRetry} style={secondaryButtonStyle}>
              {t.repoAnalyzer.retryButton}
            </button>
          )}
        </div>
      </section>

      {(error || errorRateLimit) && (
        <div style={errorStyle} role="alert" aria-live="assertive">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{ flexShrink: 0, marginTop: "2px", color: "#ef4444" }}
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, marginBottom: "4px" }}>{t.repoAnalyzer.error}</p>
              <p style={{ fontSize: "14px", lineHeight: 1.5 }}>
                {errorRateLimit && secondsUntilReset !== null
                  ? `${t.repoAnalyzer.rateLimitError} ${t.repoAnalyzer.resetIn ?? "Resets in"} ${secondsUntilReset}s`
                  : error}
              </p>
              {errorRateLimit && secondsUntilReset !== null && (
                <div
                  style={{
                    marginTop: "12px",
                    height: "6px",
                    backgroundColor: "rgba(239,68,68,0.2)",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                  role="progressbar"
                  aria-valuenow={Math.max(0, 100 - (secondsUntilReset / 3600) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t.repoAnalyzer.rateLimitProgress ?? "Rate limit reset progress"}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.max(0, 100 - (secondsUntilReset / 3600) * 100)}%`,
                      backgroundColor: "#ef4444",
                      borderRadius: "999px",
                      transition: "width 1s linear",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {result?.user && (
        <section style={resultSectionStyle} aria-labelledby="user-info-title">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <img
              src={result.user.avatar_url}
              alt={`${result.user.login} avatar`}
              style={avatarStyle}
              width={64}
              height={64}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}
              >
                <h3
                  id="user-info-title"
                  style={{ fontSize: "20px", fontWeight: 700, color: "var(--fg)" }}
                >
                  {result.user.name ?? result.user.login}
                </h3>
                <a
                  href={result.user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...linkStyle, fontSize: "14px", opacity: 0.8 }}
                >
                  @{result.user.login}
                </a>
              </div>
              {result.user.bio && (
                <p
                  style={{
                    marginTop: "12px",
                    color: "var(--muted)",
                    lineHeight: 1.6,
                    fontSize: "15px",
                  }}
                >
                  {result.user.bio}
                </p>
              )}
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                  fontSize: "13px",
                  color: "var(--muted)",
                }}
              >
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  📁 {result.user.public_repos.toLocaleString()} {t.repoAnalyzer.repos ?? "repos"}
                </span>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  👥 {result.user.followers.toLocaleString()}{" "}
                  {t.repoAnalyzer.followers ?? "followers"}
                </span>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  📅 {formatDate(result.user.created_at)}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {result?.repo && (
        <section style={resultSectionStyle} aria-labelledby="repo-info-title">
          <h3
            id="repo-info-title"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
              fontSize: "18px",
              fontWeight: 600,
              color: "var(--fg)",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ color: "var(--accent)" }}
              aria-hidden="true"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.301 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.52 11.52 0 0112 5.805c1.02.005 2.047.138 3.006.404 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .319.21.69.825.57C20.565 21.797 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            {t.repoAnalyzer.repoInfo}
          </h3>
          {result.repo.description && (
            <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: "20px" }}>
              {result.repo.description}
            </p>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div style={statCardStyle}>
              <div style={statLabelStyle}>{t.repoAnalyzer.stars}</div>
              <div style={statValueStyle}>{result.repo.stargazers_count.toLocaleString()}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>{t.repoAnalyzer.forks}</div>
              <div style={statValueStyle}>{result.repo.forks_count.toLocaleString()}</div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>{t.repoAnalyzer.watchers}</div>
              <div style={statValueStyle}>{result.repo.watchers_count.toLocaleString()}</div>
            </div>
            {result.repo.language && (
              <div style={statCardStyle}>
                <div style={statLabelStyle}>{t.repoAnalyzer.language}</div>
                <div
                  style={{ ...statValueStyle, fontSize: "18px", fontFamily: "var(--font-display)" }}
                >
                  {result.repo.language}
                </div>
              </div>
            )}
            <div style={statCardStyle}>
              <div style={statLabelStyle}>{t.repoAnalyzer.createdAt}</div>
              <div style={{ ...statValueStyle, fontSize: "14px" }}>
                {formatDate(result.repo.created_at)}
              </div>
            </div>
            <div style={statCardStyle}>
              <div style={statLabelStyle}>{t.repoAnalyzer.pushedAt}</div>
              <div style={{ ...statValueStyle, fontSize: "14px" }}>
                {formatDate(result.repo.pushed_at)}
              </div>
            </div>
          </div>
          <div>
            <a
              href={result.repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...linkStyle,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "14px",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              {t.repoAnalyzer.viewOnGitHub ?? "View on GitHub"}
            </a>
          </div>
        </section>
      )}

      <section style={{ marginTop: "24px" }} aria-labelledby="achievements-title">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <h3
            id="achievements-title"
            style={{ fontSize: "18px", fontWeight: 600, color: "var(--fg)" }}
          >
            {t.repoAnalyzer.achievements}
          </h3>
          {result?.achievements && result.achievements.length > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 12px",
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "var(--font-display)",
                borderRadius: "999px",
                backgroundColor: "var(--accent)",
                color: "white",
              }}
            >
              {result.achievements.length} {t.repoAnalyzer.achievements.toLowerCase()}
            </span>
          )}
        </div>

        {loading && !result?.user && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
              gap: "16px",
            }}
          >
            <span style={spinnerStyle} aria-hidden="true" />
            <p style={{ color: "var(--muted)", fontSize: "15px" }}>{t.repoAnalyzer.loading}</p>
          </div>
        )}

        {!loading && result?.user && (!result.achievements || result.achievements.length === 0) && (
          <div style={{ ...sectionStyle, textAlign: "center", padding: "48px 24px" }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ margin: "0 auto 16px", color: "var(--muted)", opacity: 0.5 }}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <p style={{ color: "var(--muted)", fontSize: "15px" }}>
              {t.repoAnalyzer.noAchievements}
            </p>
          </div>
        )}

        {result?.achievements && result.achievements.length > 0 && (
          <ul
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "16px",
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {result.achievements.map((achievement) => (
              <li
                key={`${achievement.name}-${achievement.tier}`}
                style={{
                  ...sectionStyle,
                  display: "flex",
                  flexDirection: "column",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <img
                      src={
                        achievement.repository?.owner
                          ? `https://github.com/${achievement.repository.owner.login}.png`
                          : `https://github.com/${result.user?.login ?? query}.png`
                      }
                      alt={`${achievement.name} ${t.repoAnalyzer.badge}`}
                      style={badgeImageStyle}
                      width={48}
                      height={48}
                      loading="lazy"
                    />
                    <div style={{ minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "var(--fg)",
                          marginBottom: "4px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {achievement.name}
                      </h4>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "var(--muted)",
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                  <span style={tierBadgeStyle(achievement.tier)}>
                    {t.tierNames[achievement.tier as keyof typeof t.tierNames] ?? achievement.tier}
                  </span>
                </div>

                {achievement.nextTier && (
                  <div style={{ marginTop: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "11px",
                        color: "var(--muted)",
                        marginBottom: "6px",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      <span>
                        {t.repoAnalyzer.progress} {t.repoAnalyzer.nextTier}:{" "}
                        {t.tierNames[achievement.nextTier as keyof typeof t.tierNames] ??
                          achievement.nextTier}
                      </span>
                    </div>
                    <div
                      style={progressBarStyle}
                      role="progressbar"
                      aria-valuenow={0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${t.repoAnalyzer.progress} ${t.tierNames[achievement.nextTier as keyof typeof t.tierNames] ?? achievement.nextTier}`}
                    >
                      <div style={progressFillStyle(achievement.nextTier)} />
                    </div>
                  </div>
                )}

                <div
                  style={{
                    marginTop: "16px",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                    fontSize: "12px",
                    color: "var(--muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <svg
                      width="14"
                      height="14"
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
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.301 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.52 11.52 0 0112 5.805c1.02.005 2.047.138 3.006.404 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .319.21.69.825.57C20.565 21.797 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
                      </svg>
                      {achievement.repository.owner.login}/{achievement.repository.name}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
