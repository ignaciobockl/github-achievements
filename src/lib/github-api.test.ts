import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchRepo,
  fetchUser,
  fetchUserAchievements,
  type GitHubAchievement,
  GitHubApiError,
  type GitHubRepo,
  type GitHubUser,
  getRateLimitResetTime,
  getSecondsUntilReset,
  isRateLimited,
  type RateLimitInfo,
} from "./github-api";

const originalFetch = global.fetch;
const mockFetch = vi.fn();

beforeEach(() => {
  global.fetch = mockFetch;
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
});

afterEach(() => {
  global.fetch = originalFetch;
  mockFetch.mockReset();
  vi.useRealTimers();
});

describe("GitHubApiError", () => {
  it("creates an error with message, status, and documentationUrl", () => {
    const error = new GitHubApiError("Not Found", 404, "https://docs.github.com/errors");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("GitHubApiError");
    expect(error.message).toBe("Not Found");
    expect(error.status).toBe(404);
    expect(error.documentationUrl).toBe("https://docs.github.com/errors");
  });

  it("creates an error without documentationUrl", () => {
    const error = new GitHubApiError("Server Error", 500);

    expect(error.status).toBe(500);
    expect(error.documentationUrl).toBeUndefined();
  });

  it("is catchable as Error", () => {
    try {
      throw new GitHubApiError("Test error", 400);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(e).toBeInstanceOf(GitHubApiError);
    }
  });
});

describe("fetchUser", () => {
  it("fetches user and returns data with rate limit", async () => {
    const mockUser: GitHubUser = {
      login: "octocat",
      id: 1,
      avatar_url: "https://github.com/images/error/octocat_happy.gif",
      html_url: "https://github.com/octocat",
      name: "The Octocat",
      bio: "GitHub mascot",
      public_repos: 8,
      followers: 1000,
      following: 0,
      created_at: "2011-01-25T18:44:36Z",
      updated_at: "2024-01-15T10:00:00Z",
    };

    const headers = new Headers({
      "X-RateLimit-Limit": "5000",
      "X-RateLimit-Remaining": "4999",
      "X-RateLimit-Reset": "1705320000",
      "X-RateLimit-Used": "1",
    });

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockUser), {
        status: 200,
        headers,
      }),
    );

    const result = await fetchUser("octocat");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.github.com/users/octocat",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        }),
      }),
    );
    expect(result.data).toEqual(mockUser);
    expect(result.rateLimit.remaining).toBe(4999);
  });

  it("encodes username in URL", async () => {
    const mockUser: GitHubUser = {
      login: "user name",
      id: 1,
      avatar_url: "",
      html_url: "",
      name: null,
      bio: null,
      public_repos: 0,
      followers: 0,
      following: 0,
      created_at: "",
      updated_at: "",
    };

    const headers = new Headers({
      "X-RateLimit-Limit": "5000",
      "X-RateLimit-Remaining": "4999",
      "X-RateLimit-Reset": "1705320000",
      "X-RateLimit-Used": "1",
    });

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockUser), {
        status: 200,
        headers,
      }),
    );

    await fetchUser("user name");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.github.com/users/user%20name",
      expect.any(Object),
    );
  });

  it("throws GitHubApiError on user not found", async () => {
    const headers = new Headers({
      "X-RateLimit-Limit": "5000",
      "X-RateLimit-Remaining": "4999",
      "X-RateLimit-Reset": "1705320000",
      "X-RateLimit-Used": "1",
    });

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "Not Found",
          documentation_url: "https://docs.github.com/errors",
        }),
        {
          status: 404,
          headers,
        },
      ),
    );

    await expect(fetchUser("nonexistent")).rejects.toThrow(GitHubApiError);
  });

  it("throws GitHubApiError on rate limit", async () => {
    const resetTime = Math.floor(Date.now() / 1000) + 3600;
    const headers = new Headers({
      "X-RateLimit-Limit": "5000",
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(resetTime),
      "X-RateLimit-Used": "5000",
    });

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "API rate limit exceeded" }), {
        status: 403,
        headers,
      }),
    );

    await expect(fetchUser("octocat")).rejects.toThrow(GitHubApiError);
  });
});

describe("fetchUserAchievements", () => {
  it("fetches user achievements", async () => {
    const mockAchievements: GitHubAchievement[] = [
      {
        name: "Pull Shark",
        description: "Merged 16 pull requests",
        tier: "bronze",
        earned_at: "2024-01-10T00:00:00Z",
        repository: { name: "repo", owner: { login: "owner" } },
      },
    ];

    const headers = new Headers({
      "X-RateLimit-Limit": "5000",
      "X-RateLimit-Remaining": "4999",
      "X-RateLimit-Reset": "1705320000",
      "X-RateLimit-Used": "1",
    });

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockAchievements), {
        status: 200,
        headers,
      }),
    );

    const result = await fetchUserAchievements("octocat");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.github.com/users/octocat/achievements",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        }),
      }),
    );
    expect(result.data).toEqual(mockAchievements);
  });

  it("throws on error", async () => {
    const headers = new Headers({
      "X-RateLimit-Limit": "5000",
      "X-RateLimit-Remaining": "4999",
      "X-RateLimit-Reset": "1705320000",
      "X-RateLimit-Used": "1",
    });

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Not Found" }), {
        status: 404,
        headers,
      }),
    );

    await expect(fetchUserAchievements("nonexistent")).rejects.toThrow(GitHubApiError);
  });
});

describe("fetchRepo", () => {
  it("fetches repository", async () => {
    const mockRepo: GitHubRepo = {
      id: 123,
      name: "hello-world",
      full_name: "octocat/hello-world",
      owner: { login: "octocat" },
      description: "My first repository",
      stargazers_count: 100,
      forks_count: 50,
      watchers_count: 100,
      html_url: "https://github.com/octocat/hello-world",
      language: "JavaScript",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
      pushed_at: "2024-01-15T00:00:00Z",
      topics: ["test", "demo"],
    };

    const headers = new Headers({
      "X-RateLimit-Limit": "5000",
      "X-RateLimit-Remaining": "4999",
      "X-RateLimit-Reset": "1705320000",
      "X-RateLimit-Used": "1",
    });

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockRepo), {
        status: 200,
        headers,
      }),
    );

    const result = await fetchRepo("octocat", "hello-world");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/octocat/hello-world",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        }),
      }),
    );
    expect(result.data).toEqual(mockRepo);
  });

  it("encodes owner and repo names", async () => {
    const mockRepo: GitHubRepo = {
      id: 123,
      name: "repo",
      full_name: "owner/repo",
      owner: { login: "owner" },
      description: null,
      stargazers_count: 0,
      forks_count: 0,
      watchers_count: 0,
      html_url: "",
      language: null,
      created_at: "",
      updated_at: "",
      pushed_at: "",
      topics: [],
    };

    const headers = new Headers({
      "X-RateLimit-Limit": "5000",
      "X-RateLimit-Remaining": "4999",
      "X-RateLimit-Reset": "1705320000",
      "X-RateLimit-Used": "1",
    });

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockRepo), {
        status: 200,
        headers,
      }),
    );

    await fetchRepo("owner name", "repo name");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner%20name/repo%20name",
      expect.any(Object),
    );
  });
});

describe("isRateLimited", () => {
  it("returns true when remaining is 0", () => {
    const rateLimit: RateLimitInfo = {
      limit: 5000,
      remaining: 0,
      reset: 1705320000,
      used: 5000,
    };

    expect(isRateLimited(rateLimit)).toBe(true);
  });

  it("returns false when remaining is greater than 0", () => {
    const rateLimit: RateLimitInfo = {
      limit: 5000,
      remaining: 1,
      reset: 1705320000,
      used: 4999,
    };

    expect(isRateLimited(rateLimit)).toBe(false);
  });

  it("returns false when remaining is high", () => {
    const rateLimit: RateLimitInfo = {
      limit: 5000,
      remaining: 4999,
      reset: 1705320000,
      used: 1,
    };

    expect(isRateLimited(rateLimit)).toBe(false);
  });
});

describe("getRateLimitResetTime", () => {
  it("returns Date when reset is non-zero", () => {
    const rateLimit: RateLimitInfo = {
      limit: 5000,
      remaining: 0,
      reset: 1705320000,
      used: 5000,
    };

    const result = getRateLimitResetTime(rateLimit);

    expect(result).toBeInstanceOf(Date);
    expect(result?.getTime()).toBe(1705320000 * 1000);
  });

  it("returns null when reset is 0", () => {
    const rateLimit: RateLimitInfo = {
      limit: 5000,
      remaining: 100,
      reset: 0,
      used: 100,
    };

    const result = getRateLimitResetTime(rateLimit);

    expect(result).toBeNull();
  });
});

describe("getSecondsUntilReset", () => {
  it("returns seconds until reset when reset time is in future", () => {
    const futureReset = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const rateLimit: RateLimitInfo = {
      limit: 5000,
      remaining: 0,
      reset: futureReset,
      used: 5000,
    };

    const result = getSecondsUntilReset(rateLimit);

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(3600);
  });

  it("returns 0 when reset time is now or past", () => {
    const pastReset = Math.floor(Date.now() / 1000) - 100; // 100 seconds ago
    const rateLimit: RateLimitInfo = {
      limit: 5000,
      remaining: 0,
      reset: pastReset,
      used: 5000,
    };

    const result = getSecondsUntilReset(rateLimit);

    expect(result).toBe(0);
  });

  it("returns null when reset is 0", () => {
    const rateLimit: RateLimitInfo = {
      limit: 5000,
      remaining: 100,
      reset: 0,
      used: 100,
    };

    const result = getSecondsUntilReset(rateLimit);

    expect(result).toBeNull();
  });

  it("handles edge case at exact reset time", () => {
    const exactReset = Math.floor(Date.now() / 1000);
    const rateLimit: RateLimitInfo = {
      limit: 5000,
      remaining: 0,
      reset: exactReset,
      used: 5000,
    };

    const result = getSecondsUntilReset(rateLimit);

    expect(result).toBe(0);
  });
});

describe("integration tests with mocked fetch", () => {
  it("handles successful user fetch with full rate limit info", async () => {
    const mockUser: GitHubUser = {
      login: "testuser",
      id: 42,
      avatar_url: "https://avatar.com/img.png",
      html_url: "https://github.com/testuser",
      name: "Test User",
      bio: "Developer",
      public_repos: 25,
      followers: 150,
      following: 75,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const resetTimestamp = Math.floor(Date.now() / 1000) + 3600;
    const headers = new Headers({
      "X-RateLimit-Limit": "5000",
      "X-RateLimit-Remaining": "4875",
      "X-RateLimit-Reset": String(resetTimestamp),
      "X-RateLimit-Used": "125",
    });

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockUser), {
        status: 200,
        headers,
      }),
    );

    const result = await fetchUser("testuser");

    expect(result.data.login).toBe("testuser");
    expect(result.rateLimit.limit).toBe(5000);
    expect(result.rateLimit.remaining).toBe(4875);
    expect(result.rateLimit.used).toBe(125);
    expect(isRateLimited(result.rateLimit)).toBe(false);
    expect(getRateLimitResetTime(result.rateLimit)).toBeInstanceOf(Date);
    expect(getSecondsUntilReset(result.rateLimit)).toBeGreaterThan(0);
  });

  it("handles rate limited scenario end-to-end", async () => {
    const resetTimestamp = Math.floor(Date.now() / 1000) + 1800; // 30 min
    const headers = new Headers({
      "X-RateLimit-Limit": "5000",
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(resetTimestamp),
      "X-RateLimit-Used": "5000",
    });

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "API rate limit exceeded for user",
          documentation_url:
            "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting",
        }),
        {
          status: 403,
          headers,
        },
      ),
    );

    let caughtError: GitHubApiError | null = null;
    try {
      await fetchUser("testuser");
    } catch (error) {
      caughtError = error as GitHubApiError;
    }

    expect(caughtError).toBeInstanceOf(GitHubApiError);
    expect(caughtError?.status).toBe(403);
    expect(caughtError?.message).toBe("API rate limit exceeded for user");
    expect(caughtError?.documentationUrl).toContain("rate-limiting");
  });

  it("handles network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchUser("testuser")).rejects.toThrow("Network error");
  });
});

describe("RateLimitInfo type", () => {
  it("matches expected structure", () => {
    const rateLimit: RateLimitInfo = {
      limit: 5000,
      remaining: 4999,
      reset: 1705320000,
      used: 1,
    };

    expect(typeof rateLimit.limit).toBe("number");
    expect(typeof rateLimit.remaining).toBe("number");
    expect(typeof rateLimit.reset).toBe("number");
    expect(typeof rateLimit.used).toBe("number");
  });
});
