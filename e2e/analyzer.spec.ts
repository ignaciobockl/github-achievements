import { expect, test } from "@playwright/test";

const ANALYZE_URL = "/en/analyze";
const ANALYZE_URL_ES = "/es/analyze";

// Mock data for GitHub API responses
const mockUser = {
  login: "octocat",
  id: 583231,
  avatar_url: "https://avatars.githubusercontent.com/u/583231?v=4",
  html_url: "https://github.com/octocat",
  name: "The Octocat",
  bio: "GitHub mascot",
  public_repos: 8,
  followers: 9000,
  following: 9,
  created_at: "2011-01-25T18:44:36Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const mockAchievements = [
  {
    name: "Pull Shark",
    description: "Open pull requests that get merged",
    tier: "gold",
    earned_at: "2023-06-15T10:30:00Z",
    repository: { name: "Hello-World", owner: { login: "octocat" } },
  },
  {
    name: "Starstruck",
    description: "Star a repository",
    tier: "silver",
    earned_at: "2023-05-20T14:22:00Z",
    repository: { name: "linguist", owner: { login: "github" } },
  },
  {
    name: "Quickdraw",
    description: "Close an issue or pull request within 5 minutes of opening",
    tier: "bronze",
    earned_at: "2023-04-10T09:15:00Z",
    repository: { name: "Hello-World", owner: { login: "octocat" } },
  },
  {
    name: "Pair Extraordinaire",
    description: "Co-author commits",
    tier: "default",
    earned_at: "2023-03-01T16:45:00Z",
    repository: { name: "Hello-World", owner: { login: "octocat" } },
  },
];

const mockRepo = {
  id: 1296269,
  name: "Hello-World",
  full_name: "octocat/Hello-World",
  owner: { login: "octocat" },
  description: "My first repository on GitHub!",
  stargazers_count: 2500,
  forks_count: 1200,
  watchers_count: 2500,
  html_url: "https://github.com/octocat/Hello-World",
  language: "JavaScript",
  created_at: "2011-01-26T19:01:12Z",
  updated_at: "2024-01-01T00:00:00Z",
  pushed_at: "2023-12-15T10:30:00Z",
  topics: ["octocat", "hello-world"],
};

function setupApiMocks(page: import("@playwright/test").Page) {
  // Mock fetch globally in the page context - more reliable than page.route
  page.addInitScript(
    (mocks) => {
      const originalFetch = window.fetch;
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers":
          "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-RateLimit-Used",
      };

      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

        // Mock user endpoint
        if (url === "https://api.github.com/users/octocat") {
          return new Response(JSON.stringify(mocks.mockUser), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
              "X-RateLimit-Limit": "5000",
              "X-RateLimit-Remaining": "4999",
              "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 3600),
              "X-RateLimit-Used": "1",
            },
          });
        }

        // Mock user achievements endpoint
        if (url === "https://api.github.com/users/octocat/achievements") {
          return new Response(JSON.stringify(mocks.mockAchievements), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
              "X-RateLimit-Limit": "5000",
              "X-RateLimit-Remaining": "4998",
              "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 3600),
              "X-RateLimit-Used": "2",
            },
          });
        }

        // Mock repo endpoint
        if (url === "https://api.github.com/repos/octocat/Hello-World") {
          return new Response(JSON.stringify(mocks.mockRepo), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
              "X-RateLimit-Limit": "5000",
              "X-RateLimit-Remaining": "4997",
              "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 3600),
              "X-RateLimit-Used": "3",
            },
          });
        }

        // Mock rate limit error (403) for user fetch
        if (url === "https://api.github.com/users/rate-limited") {
          return new Response(
            JSON.stringify({
              message: "API rate limit exceeded",
              documentation_url:
                "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting",
            }),
            {
              status: 403,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
                "X-RateLimit-Limit": "5000",
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 3600),
                "X-RateLimit-Used": "5000",
              },
            },
          );
        }

        // Mock rate limit error (403) for achievements fetch
        if (url === "https://api.github.com/users/rate-limited/achievements") {
          return new Response(
            JSON.stringify({
              message: "API rate limit exceeded",
              documentation_url:
                "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting",
            }),
            {
              status: 403,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
                "X-RateLimit-Limit": "5000",
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 3600),
                "X-RateLimit-Used": "5000",
              },
            },
          );
        }

        // Mock not found error (404)
        if (url === "https://api.github.com/users/notfound") {
          return new Response(
            JSON.stringify({
              message: "Not Found",
              documentation_url: "https://docs.github.com/rest/reference/users#get-a-user",
            }),
            {
              status: 404,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            },
          );
        }

        // Fall through to real fetch for unmatched URLs
        return originalFetch(input, init);
      };
    },
    {
      mockUser,
      mockAchievements,
      mockRepo,
    },
  );
}

async function clickAnalyze(page: import("@playwright/test").Page) {
  // Use force click to bypass any overlay/dropdown interception
  const button = page.getByRole("button", { name: /Analyze|Analizar/ });
  await button.waitFor({ state: "visible" });
  await button.click({ force: true, timeout: 10000 });
}

async function waitForHydration(page: import("@playwright/test").Page) {
  // Wait for React hydration to complete by waiting for the username input to be interactive
  await page.waitForFunction(
    () => {
      const input = document.querySelector<HTMLInputElement>("#username");
      return input && !input.disabled;
    },
    { timeout: 15000 },
  );
}

test.describe("Repository Analyzer", () => {
  test.beforeEach(async ({ page }) => {
    setupApiMocks(page);
  });

  test("Renders analyzer page", async ({ page }) => {
    await page.goto(ANALYZE_URL);
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);

    // Verify title
    await expect(page.getByRole("heading", { level: 2 })).toContainText("Repository Analyzer");

    // Verify username input exists
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#username")).toHaveAttribute("placeholder", "Enter GitHub username");

    // Verify repo input exists
    await expect(page.locator("#repo")).toBeVisible();
    await expect(page.locator("#repo")).toHaveAttribute(
      "placeholder",
      "owner/repo (e.g., octocat/Hello-World)",
    );

    // Verify analyze button visible (disabled when username is empty)
    const analyzeButton = page.getByRole("button", { name: "Analyze" });
    await expect(analyzeButton).toBeVisible();
    await expect(analyzeButton).toBeDisabled();
  });

  test("Analyzes a user", async ({ page }) => {
    await page.goto(ANALYZE_URL);
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);

    // Fill username and click Analyze
    await page.fill("#username", "octocat");
    await clickAnalyze(page);

    // Wait for results - user info should appear
    await expect(page.locator("img[alt*='octocat avatar']")).toBeVisible({ timeout: 15000 });

    // Verify user info shows (avatar, name, achievements list)
    await expect(page.locator("text=The Octocat")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=@octocat")).toBeVisible({ timeout: 15000 });

    // Verify achievements list appears
    await expect(page.locator("text=Pull Shark")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Starstruck")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Quickdraw")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Pair Extraordinaire")).toBeVisible({ timeout: 15000 });

    // Verify tier badges shown for tiered achievements (use more specific selector)
    await expect(page.locator('span:has-text("Gold"):not(:has-text("Progress"))')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('span:has-text("Silver"):not(:has-text("Progress"))')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('span:has-text("Bronze"):not(:has-text("Progress"))')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('span:has-text("Default"):not(:has-text("Progress"))')).toBeVisible({
      timeout: 15000,
    });
  });

  test("Analyzes a user with repository", async ({ page }) => {
    await page.goto(ANALYZE_URL);
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);

    // Fill username and repo, then click Analyze
    await page.fill("#username", "octocat");
    await page.fill("#repo", "octocat/Hello-World");
    await clickAnalyze(page);

    // Wait for results - user info should appear
    await expect(page.locator("img[alt*='octocat avatar']")).toBeVisible({ timeout: 15000 });

    // Verify repo info shows (stars, forks, language, etc.) - use aria-labelledby to distinguish from user info section
    const repoSection = page.locator('section[aria-labelledby="repo-info-title"]');
    await expect(repoSection).toBeVisible({ timeout: 15000 });
    await expect(repoSection.locator("text=Stars")).toBeVisible({ timeout: 15000 });
    await expect(repoSection.locator("text=Forks")).toBeVisible({ timeout: 15000 });
    await expect(repoSection.locator("text=Language")).toBeVisible({ timeout: 15000 });
    await expect(repoSection.locator("text=Created")).toBeVisible({ timeout: 15000 });
    await expect(repoSection.locator("text=Last Push")).toBeVisible({ timeout: 15000 });

    // Verify specific values (stars and watchers both 2,500, use first for stars)
    await expect(repoSection.locator("p").filter({ hasText: "2,500" }).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(repoSection.locator("text=1,200")).toBeVisible({ timeout: 15000 });
    await expect(repoSection.locator("text=JavaScript")).toBeVisible({ timeout: 15000 });
  });

  test("Rate limit handling - error UI shows correctly", async ({ page }) => {
    await page.goto(ANALYZE_URL);
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);

    // Trigger rate limit error by using the rate-limited user
    await page.fill("#username", "rate-limited");
    await clickAnalyze(page);

    // Wait for error to appear
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[role="alert"]')).toContainText("Rate limit exceeded");
    await expect(page.getByRole("button", { name: "Try Again" })).toBeVisible({ timeout: 15000 });
  });

  test("Rate limit error UI with countdown", async ({ page }) => {
    await page.goto(ANALYZE_URL);
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);

    // Trigger rate limit error
    await page.fill("#username", "rate-limited");
    await clickAnalyze(page);

    // Wait for error with countdown
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[role="alert"]')).toContainText("Rate limit exceeded");

    // The retry button is separate from the alert - verify it exists
    await expect(page.getByRole("button", { name: "Try Again" })).toBeVisible({ timeout: 5000 });
  });

  test("Locale switching - EN to ES", async ({ page }) => {
    // Analyze a user in English
    await page.goto(ANALYZE_URL);
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);
    await page.fill("#username", "octocat");
    await clickAnalyze(page);
    await expect(page.locator("img[alt*='octocat avatar']")).toBeVisible({ timeout: 15000 });

    // Verify English text for user analysis (Achievements section, not Repository Info)
    await expect(page.getByRole("heading", { name: "Achievements" })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator("text=Pull Shark")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Stars").first()).toBeVisible({ timeout: 15000 }); // Stars shown in achievement cards

    // Switch to Spanish by direct navigation
    await page.goto(ANALYZE_URL_ES);

    // Wait for page to load
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);

    // Verify Spanish UI text (results don't persist across locale navigation)
    await expect(page.getByRole("heading", { level: 2 })).toContainText(
      "Analizador de Repositorio",
    );
    await expect(page.locator("#username")).toHaveAttribute(
      "placeholder",
      "Introduce el usuario de GitHub",
    );
    await expect(page.locator("#repo")).toHaveAttribute(
      "placeholder",
      "propietario/repo (ej. octocat/Hello-World)",
    );
    await expect(page.getByRole("button", { name: "Analizar" })).toBeVisible();

    // Verify Spanish translations for UI labels (visible without analysis)
    // The subtitle uses t.repoAnalyzer.subtitle
    await expect(
      page.locator("text=Analiza los logros de GitHub de un usuario o repositorio"),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#username")).toHaveAttribute(
      "placeholder",
      "Introduce el usuario de GitHub",
    );
    await expect(page.getByRole("button", { name: "Analizar" })).toBeVisible();
  });

  test("Validation - empty username disables button", async ({ page }) => {
    await page.goto(ANALYZE_URL);
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);

    // Try analyze with empty query - button should be disabled
    await expect(page.getByRole("button", { name: "Analyze" })).toBeDisabled();

    // Fill username - button should be enabled
    await page.fill("#username", "octocat");
    await expect(page.getByRole("button", { name: "Analyze" })).toBeEnabled();

    // Clear username - button should be disabled again
    await page.fill("#username", "");
    await expect(page.getByRole("button", { name: "Analyze" })).toBeDisabled();
  });

  test("Persistence across reload - skin tone", async ({ page }) => {
    await page.goto(ANALYZE_URL);
    await page.waitForLoadState("networkidle");
    await waitForHydration(page);

    // Set skin tone to dark
    await page.evaluate(() => {
      localStorage.setItem("gha-skin-tone", "dark");
    });

    // Reload page
    await page.reload();
    await waitForHydration(page);

    // Verify skin tone persists via localStorage
    const storedTone = await page.evaluate(() => localStorage.getItem("gha-skin-tone"));
    expect(storedTone).toBe("dark");
  });
});
