const GITHUB_API_BASE = "https://api.github.com";

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubAchievement {
  name: string;
  description: string;
  tier: string;
  earned_at: string;
  repository?: {
    name: string;
    owner: { login: string };
  };
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  html_url: string;
  language: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  topics: string[];
}

export class GitHubApiError extends Error {
  public readonly status: number;
  public readonly documentationUrl?: string;

  constructor(message: string, status: number, documentationUrl?: string) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
    this.documentationUrl = documentationUrl;
  }
}

export class GitHubRateLimitError extends GitHubApiError {
  public readonly rateLimit: RateLimitInfo;
  public readonly resetTime: Date | null;
  public readonly secondsUntilReset: number | null;

  constructor(message: string, rateLimit: RateLimitInfo) {
    super(message, 429);
    this.name = "GitHubRateLimitError";
    this.rateLimit = rateLimit;
    this.resetTime = getRateLimitResetTime(rateLimit);
    this.secondsUntilReset = getSecondsUntilReset(rateLimit);
  }
}

function parseRateLimitHeaders(headers: Headers): RateLimitInfo {
  return {
    limit: parseInt(headers.get("X-RateLimit-Limit") ?? "0", 10),
    remaining: parseInt(headers.get("X-RateLimit-Remaining") ?? "0", 10),
    reset: parseInt(headers.get("X-RateLimit-Reset") ?? "0", 10),
    used: parseInt(headers.get("X-RateLimit-Used") ?? "0", 10),
  };
}

async function handleResponse<T>(
  response: Response,
): Promise<{ data: T; rateLimit: RateLimitInfo }> {
  const rateLimit = parseRateLimitHeaders(response.headers);

  if (!response.ok) {
    let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;
    let documentationUrl: string | undefined;

    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
      if (errorData.documentation_url) {
        documentationUrl = errorData.documentation_url;
      }
    } catch {
      // Ignore JSON parse errors, use default message
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const retryMessage = retryAfter
        ? `${errorMessage}. Retry after ${retryAfter} seconds.`
        : `${errorMessage}. Rate limit exceeded.`;
      throw new GitHubRateLimitError(retryMessage, rateLimit);
    }

    throw new GitHubApiError(errorMessage, response.status, documentationUrl);
  }

  const data = (await response.json()) as T;
  return { data, rateLimit };
}

export async function fetchWithRetry<T>(
  fetchFn: () => Promise<{ data: T; rateLimit: RateLimitInfo }>,
  maxRetries: number = 3,
  baseDelay: number = 100,
): Promise<{ data: T; rateLimit: RateLimitInfo }> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error as Error;

      if (error instanceof GitHubRateLimitError) {
        if (attempt < maxRetries) {
          const delay = baseDelay * 2 ** attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }

      if (error instanceof GitHubApiError && error.status >= 500 && error.status < 600) {
        if (attempt < maxRetries) {
          const delay = baseDelay * 2 ** attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }

      throw error;
    }
  }

  // lastError is guaranteed to be set because the loop runs at least once (attempt = 0)
  // and we only reach here if all attempts failed
  throw lastError as Error;
}

async function fetchWithRetryInternal<T>(
  url: string,
  options: RequestInit,
): Promise<{ data: T; rateLimit: RateLimitInfo }> {
  return fetchWithRetry(async () => {
    const response = await fetch(url, options);
    return handleResponse<T>(response);
  });
}

export async function fetchUser(
  username: string,
): Promise<{ data: GitHubUser; rateLimit: RateLimitInfo }> {
  return fetchWithRetryInternal<GitHubUser>(
    `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
}

export async function fetchUserAchievements(
  username: string,
): Promise<{ data: GitHubAchievement[]; rateLimit: RateLimitInfo }> {
  return fetchWithRetryInternal<GitHubAchievement[]>(
    `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/achievements`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
}

export async function fetchRepo(
  owner: string,
  repo: string,
): Promise<{ data: GitHubRepo; rateLimit: RateLimitInfo }> {
  return fetchWithRetryInternal<GitHubRepo>(
    `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
}

export function isRateLimited(rateLimit: RateLimitInfo): boolean {
  return rateLimit.remaining === 0;
}

export function getRateLimitResetTime(rateLimit: RateLimitInfo): Date | null {
  if (rateLimit.reset === 0) {
    return null;
  }
  return new Date(rateLimit.reset * 1000);
}

export function getSecondsUntilReset(rateLimit: RateLimitInfo): number | null {
  const resetTime = getRateLimitResetTime(rateLimit);
  if (!resetTime) {
    return null;
  }
  return Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  rateLimit?: RateLimitInfo;
}

const CACHE_PREFIX = "gha-cache-";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

export function getCached<T>(key: string): CacheEntry<T> | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(getCacheKey(key));
    if (!stored) {
      return null;
    }
    const entry = JSON.parse(stored) as CacheEntry<T>;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      window.localStorage.removeItem(getCacheKey(key));
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

export function setCached<T>(key: string, data: T, rateLimit?: RateLimitInfo): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      rateLimit,
    };
    window.localStorage.setItem(getCacheKey(key), JSON.stringify(entry));
  } catch {
    // Ignore quota exceeded errors
  }
}

export function clearCache(key?: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (key) {
      window.localStorage.removeItem(getCacheKey(key));
    } else {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(CACHE_PREFIX))
        .forEach((k) => {
          window.localStorage.removeItem(k);
        });
    }
  } catch {
    // Ignore errors
  }
}

export function getCacheStats(): { entries: number; totalSize: number; keys: string[] } {
  if (typeof window === "undefined") {
    return { entries: 0, totalSize: 0, keys: [] };
  }
  try {
    const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(CACHE_PREFIX));
    let totalSize = 0;
    keys.forEach((k) => {
      totalSize += window.localStorage.getItem(k)?.length ?? 0;
    });
    return { entries: keys.length, totalSize, keys };
  } catch {
    return { entries: 0, totalSize: 0, keys: [] };
  }
}
