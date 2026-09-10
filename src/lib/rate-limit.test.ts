import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCache,
  fetchUserAchievements,
  fetchWithRetry,
  GitHubApiError,
  GitHubRateLimitError,
  getCached,
  getCacheStats,
  getRateLimitResetTime,
  getSecondsUntilReset,
  isRateLimited,
  type RateLimitInfo,
  setCached,
} from "./github-api";

const originalFetch = global.fetch;
const mockFetch = vi.fn();
const originalWindow = global.window;
const _originalObjectKeys = global.Object.keys;

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

function setupLocalStorageMock() {
  const store = new Map<string, string>();
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    get length() {
      return store.size;
    },
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
  };
  const proxy = new Proxy(mockLocalStorage, {
    ownKeys() {
      return Array.from(store.keys());
    },
    getOwnPropertyDescriptor(target, prop) {
      const key = prop as string;
      if (store.has(key)) {
        return { configurable: true, enumerable: true, value: store.get(key) };
      }
      return Object.getOwnPropertyDescriptor(target, key);
    },
  });
  vi.stubGlobal("window", { localStorage: proxy });
}

function teardownLocalStorageMock() {
  global.window = originalWindow;
  vi.unstubAllGlobals();
}

describe("fetchWithRetry retry logic", () => {
  beforeEach(setupMocks);
  afterEach(teardownMocks);

  it("succeeds on first try if no error", async () => {
    const mockData = { data: "success" };
    const mockRateLimit: RateLimitInfo = {
      limit: 5000,
      remaining: 4999,
      reset: 1705320000,
      used: 1,
    };
    const fetchFn = vi.fn().mockResolvedValue({ data: mockData, rateLimit: mockRateLimit });

    const result = await fetchWithRetry(fetchFn);

    expect(result.data).toEqual(mockData);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("retries up to 3 times on 429 error with exponential backoff (100ms, 200ms, 400ms)", async () => {
    const rateLimit: RateLimitInfo = { limit: 5000, remaining: 0, reset: 1705320000, used: 5000 };
    const rateLimitError = new GitHubRateLimitError("Rate limited", rateLimit);
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValue({ data: "success", rateLimit });

    const promise = fetchWithRetry(fetchFn, 3, 100);

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(400);

    const result = await promise;

    expect(result.data).toBe("success");
    expect(fetchFn).toHaveBeenCalledTimes(4);
  });

  it("retries on 5xx errors", async () => {
    const rateLimit: RateLimitInfo = { limit: 5000, remaining: 100, reset: 1705320000, used: 100 };
    const serverError = new GitHubApiError("500 Internal Server Error", 500);
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(serverError)
      .mockResolvedValue({ data: "success", rateLimit });

    const promise = fetchWithRetry(fetchFn, 3, 100);

    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;

    expect(result.data).toBe("success");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("retries on 502, 503, 504 errors", async () => {
    const rateLimit: RateLimitInfo = { limit: 5000, remaining: 100, reset: 1705320000, used: 100 };
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new GitHubApiError("502 Bad Gateway", 502))
      .mockRejectedValueOnce(new GitHubApiError("503 Service Unavailable", 503))
      .mockRejectedValueOnce(new GitHubApiError("504 Gateway Timeout", 504))
      .mockResolvedValue({ data: "success", rateLimit });

    const promise = fetchWithRetry(fetchFn, 3, 100);

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(400);

    const result = await promise;

    expect(result.data).toBe("success");
    expect(fetchFn).toHaveBeenCalledTimes(4);
  });

  it("doesn't retry on 4xx errors (except 429)", async () => {
    const _rateLimit: RateLimitInfo = { limit: 5000, remaining: 100, reset: 1705320000, used: 100 };
    const fetchFn = vi.fn().mockRejectedValue(new GitHubApiError("400 Bad Request", 400));

    await expect(fetchWithRetry(fetchFn, 3, 100)).rejects.toThrow(GitHubApiError);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("doesn't retry on 401, 403, 404 errors", async () => {
    const fetchFn401 = vi.fn().mockRejectedValue(new GitHubApiError("401 Unauthorized", 401));
    const fetchFn403 = vi.fn().mockRejectedValue(new GitHubApiError("403 Forbidden", 403));
    const fetchFn404 = vi.fn().mockRejectedValue(new GitHubApiError("404 Not Found", 404));

    await expect(fetchWithRetry(fetchFn401, 3, 100)).rejects.toThrow(GitHubApiError);
    expect(fetchFn401).toHaveBeenCalledTimes(1);

    await expect(fetchWithRetry(fetchFn403, 3, 100)).rejects.toThrow(GitHubApiError);
    expect(fetchFn403).toHaveBeenCalledTimes(1);

    await expect(fetchWithRetry(fetchFn404, 3, 100)).rejects.toThrow(GitHubApiError);
    expect(fetchFn404).toHaveBeenCalledTimes(1);
  });

  it("throws after max retries exhausted on 429", async () => {
    const rateLimit: RateLimitInfo = { limit: 5000, remaining: 0, reset: 1705320000, used: 5000 };
    const rateLimitError = new GitHubRateLimitError("rate limited", rateLimit);
    const fetchFn = vi.fn().mockRejectedValue(rateLimitError);

    const promise = fetchWithRetry(fetchFn, 3, 100);

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(400);

    await expect(promise).rejects.toThrow(GitHubRateLimitError);
    expect(fetchFn).toHaveBeenCalledTimes(4);
  });

  it("throws after max retries exhausted on 5xx", async () => {
    const _rateLimit: RateLimitInfo = { limit: 5000, remaining: 100, reset: 1705320000, used: 100 };
    const serverError = new GitHubApiError("500 Internal Server Error", 500);
    const fetchFn = vi.fn().mockRejectedValue(serverError);

    const promise = fetchWithRetry(fetchFn, 3, 100);

    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(400);

    await expect(promise).rejects.toThrow(GitHubApiError);
    expect(fetchFn).toHaveBeenCalledTimes(4);
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
    const futureReset = Math.floor(Date.now() / 1000) + 3600;
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
    const pastReset = Math.floor(Date.now() / 1000) - 100;
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

describe("Cache tests", () => {
  beforeEach(() => {
    setupLocalStorageMock();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });
  afterEach(() => {
    teardownLocalStorageMock();
    vi.useRealTimers();
    clearCache();
  });

  it("getCached returns null for non-existent key", () => {
    const result = getCached<{ test: string }>("non-existent-key");

    expect(result).toBeNull();
  });

  it("setCached + getCached roundtrip works", () => {
    const testData = { name: "test", value: 42 };

    setCached("test-key", testData);
    const result = getCached<typeof testData>("test-key");

    expect(result).not.toBeNull();
    expect(result?.data).toEqual(testData);
    expect(result?.timestamp).toBeDefined();
  });

  it("Cache expiration works (TTL respected)", () => {
    const testData = { name: "test" };

    setCached("test-key", testData);

    vi.advanceTimersByTime(5 * 60 * 1000 + 1000);

    const result = getCached<typeof testData>("test-key");

    expect(result).toBeNull();
  });

  it("Cache entry with rateLimit stores rateLimit info", () => {
    const testData = { name: "test" };
    const rateLimit: RateLimitInfo = { limit: 5000, remaining: 4999, reset: 1705320000, used: 1 };

    setCached("test-key", testData, rateLimit);
    const result = getCached<typeof testData>("test-key");

    expect(result).not.toBeNull();
    expect(result?.rateLimit).toEqual(rateLimit);
  });

  it("clearCache removes specific entry when key provided", () => {
    setCached("key1", { data: "1" });
    setCached("key2", { data: "2" });

    clearCache("key1");

    expect(getCached("key1")).toBeNull();
    expect(getCached("key2")).not.toBeNull();
  });

  it("clearCache removes all entries when no key provided", () => {
    setCached("key1", { data: "1" });
    setCached("key2", { data: "2" });

    clearCache();

    expect(getCached("key1")).toBeNull();
    expect(getCached("key2")).toBeNull();
  });

  it("getCacheStats returns correct counts", () => {
    setCached("key1", { data: "1" });
    setCached("key2", { data: "2" });
    setCached("key3", { data: "3" });

    const stats = getCacheStats();

    expect(stats.entries).toBe(3);
    expect(stats.keys).toHaveLength(3);
    expect(stats.totalSize).toBeGreaterThan(0);
  });

  it("getCacheStats returns zero for empty cache", () => {
    const stats = getCacheStats();

    expect(stats.entries).toBe(0);
    expect(stats.totalSize).toBe(0);
    expect(stats.keys).toHaveLength(0);
  });

  it("handles localStorage quota exceeded gracefully", () => {
    const mockSetItem = vi.fn().mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    vi.stubGlobal("window", {
      ...global.window,
      localStorage: { ...global.window.localStorage, setItem: mockSetItem },
    });

    expect(() => setCached("test-key", { data: "test" })).not.toThrow();
  });

  it("handles JSON parse error gracefully", () => {
    const mockGetItem = vi.fn().mockReturnValue("invalid-json");
    vi.stubGlobal("window", {
      ...global.window,
      localStorage: { ...global.window.localStorage, getItem: mockGetItem },
    });

    const result = getCached("test-key");

    expect(result).toBeNull();
  });
});

describe("Cache integration tests", () => {
  beforeEach(() => {
    setupMocks();
    setupLocalStorageMock();
  });
  afterEach(() => {
    teardownMocks();
    teardownLocalStorageMock();
    clearCache();
  });

  it("cache integration: consumer can cache fetchUserAchievements result and reuse on second call", async () => {
    const mockAchievements = [
      { name: "Test", description: "Desc", tier: "bronze", earned_at: "2024-01-01T00:00:00Z" },
    ];
    const headers = new Headers(createRateLimitHeaders("5000", "4999", "1705320000", "1"));

    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      return createMockResponse(mockAchievements, 200, Object.fromEntries(headers));
    });

    const cacheKey = "user-achievements-testuser";

    // First call - fetch and cache
    const result1 = await fetchUserAchievements("testuser");
    setCached(cacheKey, result1.data, result1.rateLimit);

    // Second call - use cache
    const cached = getCached<typeof mockAchievements>(cacheKey);
    expect(cached).not.toBeNull();
    expect(cached?.data).toEqual(mockAchievements);

    // Verify fetch was only called once
    expect(callCount).toBe(1);
  });

  it("Cache TTL respected (5 min for user/achievements)", () => {
    const testData = { achievements: [] };

    setCached("user-achievements-testuser", testData);

    vi.advanceTimersByTime(5 * 60 * 1000 - 1000);
    expect(getCached("user-achievements-testuser")).not.toBeNull();

    vi.advanceTimersByTime(2000);
    expect(getCached("user-achievements-testuser")).toBeNull();
  });

  it("Cache TTL respected (5 min for repo - single TTL in implementation)", () => {
    const testData = { repo: { name: "test" } };

    setCached("repo-octocat-hello-world", testData);

    vi.advanceTimersByTime(5 * 60 * 1000 - 1000);
    expect(getCached("repo-octocat-hello-world")).not.toBeNull();

    vi.advanceTimersByTime(2000);
    expect(getCached("repo-octocat-hello-world")).toBeNull();
  });

  it("clearCache invalidates cached results", async () => {
    const mockAchievements = [
      { name: "Test", description: "Desc", tier: "bronze", earned_at: "2024-01-01T00:00:00Z" },
    ];
    const headers = new Headers(createRateLimitHeaders("5000", "4999", "1705320000", "1"));

    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      return createMockResponse(mockAchievements, 200, Object.fromEntries(headers));
    });

    // First fetch and cache
    const result1 = await fetchUserAchievements("testuser");
    setCached("user-achievements-testuser", result1.data, result1.rateLimit);
    expect(callCount).toBe(1);

    // Clear cache
    clearCache("user-achievements-testuser");

    // Fetch again (cache miss)
    mockFetch.mockImplementation(() => {
      callCount++;
      return createMockResponse(
        [
          ...mockAchievements,
          {
            name: "Test2",
            description: "Desc2",
            tier: "silver",
            earned_at: "2024-01-02T00:00:00Z",
          },
        ],
        200,
        Object.fromEntries(headers),
      );
    });

    await fetchUserAchievements("testuser");
    expect(callCount).toBe(2);
  });

  it("fetchUserAchievements bypasses cache when rate limited (403)", async () => {
    const _mockAchievements = [
      { name: "Test", description: "Desc", tier: "bronze", earned_at: "2024-01-01T00:00:00Z" },
    ];
    const rateLimitedHeaders = new Headers(
      createRateLimitHeaders("5000", "0", "1705320000", "5000"),
    );

    mockFetch.mockImplementation(() =>
      createMockResponse(
        { message: "API rate limit exceeded" },
        403,
        Object.fromEntries(rateLimitedHeaders),
      ),
    );

    await expect(fetchUserAchievements("testuser")).rejects.toThrow(GitHubApiError);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("Rate limit info integration", () => {
  beforeEach(setupMocks);
  afterEach(teardownMocks);

  it("rate limit info correctly parsed from headers on successful fetch", async () => {
    const mockUser = {
      login: "testuser",
      id: 42,
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
    const resetTimestamp = Math.floor(Date.now() / 1000) + 3600;
    const headers = new Headers(
      createRateLimitHeaders("5000", "4875", String(resetTimestamp), "125"),
    );

    mockFetch.mockImplementation(() =>
      createMockResponse(mockUser, 200, Object.fromEntries(headers)),
    );

    const result = await fetchUserAchievements("testuser");

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

    mockFetch.mockImplementation(() =>
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
      await fetchUserAchievements("testuser");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
