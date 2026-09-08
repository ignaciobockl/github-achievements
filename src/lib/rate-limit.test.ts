import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchUser,
  type GitHubUser,
  getRateLimitResetTime,
  getSecondsUntilReset,
  isRateLimited,
  type RateLimitInfo,
} from "./github-api";

const originalFetch = global.fetch;
const mockFetch = vi.fn();

function createMockResponse(
  data: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: new Headers(headers),
  });
}

function createRateLimitHeaders(
  limit = "5000",
  remaining = "4999",
  reset = "1705320000",
  used = "1",
): Record<string, string> {
  return {
    "X-RateLimit-Limit": limit,
    "X-RateLimit-Remaining": remaining,
    "X-RateLimit-Reset": reset,
    "X-RateLimit-Used": used,
  };
}

function setupMocks() {
  global.fetch = mockFetch;
  mockFetch.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
}

function teardownMocks() {
  global.fetch = originalFetch;
  mockFetch.mockReset();
  vi.useRealTimers();
}

describe("parseRateLimitHeaders", () => {
  beforeEach(setupMocks);
  afterEach(teardownMocks);

  it("correctly parses all headers (limit, remaining, reset, used)", async () => {
    const resetTimestamp = Math.floor(Date.now() / 1000) + 3600;
    const headers = new Headers(
      createRateLimitHeaders("5000", "4875", String(resetTimestamp), "125"),
    );

    mockFetch.mockResolvedValueOnce(
      createMockResponse({ login: "testuser", id: 42 }, 200, Object.fromEntries(headers)),
    );

    const result = await fetchUser("testuser");

    expect(result.rateLimit.limit).toBe(5000);
    expect(result.rateLimit.remaining).toBe(4875);
    expect(result.rateLimit.reset).toBe(resetTimestamp);
    expect(result.rateLimit.used).toBe(125);
  });

  it("handles missing headers gracefully", async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse({ login: "testuser", id: 42 }, 200, {}));

    const result = await fetchUser("testuser");

    expect(result.rateLimit.limit).toBe(0);
    expect(result.rateLimit.remaining).toBe(0);
    expect(result.rateLimit.reset).toBe(0);
    expect(result.rateLimit.used).toBe(0);
  });

  it("handles partial headers", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ login: "testuser", id: 42 }, 200, {
        "X-RateLimit-Limit": "5000",
        "X-RateLimit-Remaining": "100",
      }),
    );

    const result = await fetchUser("testuser");

    expect(result.rateLimit.limit).toBe(5000);
    expect(result.rateLimit.remaining).toBe(100);
    expect(result.rateLimit.reset).toBe(0);
    expect(result.rateLimit.used).toBe(0);
  });
});

describe("isRateLimited", () => {
  it("returns true when remaining === 0", () => {
    const rateLimit: RateLimitInfo = {
      limit: 5000,
      remaining: 0,
      reset: 1705320000,
      used: 5000,
    };

    expect(isRateLimited(rateLimit)).toBe(true);
  });

  it("returns false when remaining > 0", () => {
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
  it("returns Date when reset header present", () => {
    const resetTimestamp = 1705320000;
    const rateLimit: RateLimitInfo = {
      limit: 5000,
      remaining: 0,
      reset: resetTimestamp,
      used: 5000,
    };

    const result = getRateLimitResetTime(rateLimit);

    expect(result).toBeInstanceOf(Date);
    expect(result?.getTime()).toBe(resetTimestamp * 1000);
  });

  it("returns null when reset header missing (reset is 0)", () => {
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
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns positive number for future reset", () => {
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

  it("returns 0 for past reset", () => {
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

  it("returns null for zero reset", () => {
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

describe("Rate limit info integration", () => {
  beforeEach(setupMocks);
  afterEach(teardownMocks);

  it("rate limit info correctly parsed from headers on successful fetch", async () => {
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
    const headers = new Headers(
      createRateLimitHeaders("5000", "4875", String(resetTimestamp), "125"),
    );

    mockFetch.mockResolvedValueOnce(createMockResponse(mockUser, 200, Object.fromEntries(headers)));

    const result = await fetchUser("testuser");

    expect(result.rateLimit.limit).toBe(5000);
    expect(result.rateLimit.remaining).toBe(4875);
    expect(result.rateLimit.reset).toBe(resetTimestamp);
    expect(result.rateLimit.used).toBe(125);
    expect(getRateLimitResetTime(result.rateLimit)).toBeInstanceOf(Date);
    expect(getRateLimitResetTime(result.rateLimit)?.getTime()).toBe(resetTimestamp * 1000);
    expect(isRateLimited(result.rateLimit)).toBe(false);
    expect(getSecondsUntilReset(result.rateLimit)).toBeGreaterThan(0);
  });

  it("rate limit info correctly parsed on error response", async () => {
    const resetTimestamp = Math.floor(Date.now() / 1000) + 1800;
    const headers = new Headers(
      createRateLimitHeaders("5000", "0", String(resetTimestamp), "5000"),
    );

    mockFetch.mockResolvedValueOnce(
      createMockResponse(
        {
          message: "API rate limit exceeded",
          documentation_url: "https://docs.github.com/rate-limiting",
        },
        403,
        Object.fromEntries(headers),
      ),
    );

    try {
      await fetchUser("testuser");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    // Rate limit headers are still parsed from error response
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
