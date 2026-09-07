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

    throw new GitHubApiError(errorMessage, response.status, documentationUrl);
  }

  const data = (await response.json()) as T;
  return { data, rateLimit };
}

export async function fetchUser(
  username: string,
): Promise<{ data: GitHubUser; rateLimit: RateLimitInfo }> {
  const response = await fetch(`${GITHUB_API_BASE}/users/${encodeURIComponent(username)}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  return handleResponse<GitHubUser>(response);
}

export async function fetchUserAchievements(
  username: string,
): Promise<{ data: GitHubAchievement[]; rateLimit: RateLimitInfo }> {
  const response = await fetch(
    `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/achievements`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  return handleResponse<GitHubAchievement[]>(response);
}

export async function fetchRepo(
  owner: string,
  repo: string,
): Promise<{ data: GitHubRepo; rateLimit: RateLimitInfo }> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  return handleResponse<GitHubRepo>(response);
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
