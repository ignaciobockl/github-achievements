# AGENTS.md

Guidelines for AI coding agents working on this project.

## Project Overview

**GitHub Achievements** is a website that lists every GitHub profile achievement (earnable,
retired, internal, and disabled), explains how to unlock each one and its tiers
(default, bronze, silver, gold), documents badge skin tones, analyzes GitHub repositories to
provide unlock context, and maintains a global top-10 leaderboard of users with the most
achievements.

## Tech Stack

- **Runtime / package manager**: [Bun](https://bun.sh) only. Never use npm, pnpm, or yarn.
- **Framework**: [Astro](https://astro.build) + React (TypeScript only, `strict` mode).
- **Styling**: [Tailwind CSS](https://tailwindcss.com) v4.
- **Lint & format**: [Biome](https://biomejs.dev) (single tool; replaces ESLint + Prettier).
- **Unit tests**: [Vitest](https://vitest.dev).
- **E2E tests**: [Playwright](https://playwright.dev).
- **Deploy**: Cloudflare Pages.

## Setup Commands

```bash
bun install --frozen-lockfile   # install dependencies
bun run dev                     # start dev server
bun run build                   # production build
bun run preview                 # preview production build
```

## Code Quality

```bash
bun run lint                    # biome check (lint + format)
bun run lint:fix                # auto-fix lint and format issues
bun run format                  # format all files
bun run check                   # astro check
bun run typecheck               # tsc --noEmit
bun run test                    # vitest run (unit tests)
bun run test:coverage           # vitest with coverage
bun run test:e2e                # playwright (requires bun run build first)
bun run sync                    # compare local dataset with the upstream achievements README
```

Always run `bun run lint`, `bun run typecheck`, and `bun run test` before committing.

## Code Style

- TypeScript strict mode; explicit types (avoid `any`).
- Biome formatting: 2-space indent, double quotes, semicolons, trailing commas.
- Functional patterns; prefer named exports over default exports.
- React components are `.tsx`; Astro pages/components are `.astro`.
- No comments unless they clarify non-obvious intent.

## Git Workflow

- **`master`**: production branch (protected). Never push directly.
- **`develop`**: integration branch (protected). Never push directly.
- **Every task** creates a feature branch from `develop` and a **PR to `develop`**.
- PR title and description in **English**, describing the changes.
- **Every PR must be assigned to `ignaciobockl`.**
- **CI (Quality + E2E checks) must pass** before a PR can be merged (enforced by branch protection).
- Branches are released to `master` by merging `develop` when a version is complete.

## Commits

- Language: **English**.
- Convention: [Conventional Commits](https://www.conventionalcommits.org) (enforced by commitlint).
- One commit per task/change.
- Always bump the version in `package.json` following [SemVer](https://semver.org) (`x.y.z`).

## Internationalization

The site supports multiple languages automatically via [Astro i18n routing](https://docs.astro.build/en/guides/internationalization/).

- Configured in `astro.config.mjs` (`i18n.locales`, `defaultLocale`) with `prefixDefaultLocale: true`.
- Routes are prefixed by locale: `/en/...` and `/es/...`.
- Pages live under `src/pages/[locale]/...` (catalog and `achievements/[slug]` detail).
- The root `src/pages/index.astro` detects the browser language client-side and redirects.
- Achievements are stored as localized fields (`LocalizedText` / `LocalizedStringArray`) in
  `src/data/achievements.ts` and resolved per locale via `localizeAchievement()` in `src/data/localize.ts`.
- UI strings live in `src/i18n/translations.ts` keyed by locale.

## Theme

Three-state theme system (`light`, `dark`, `auto`) implemented with `localStorage` persistence
and `prefers-color-scheme` detection. No flash-of-wrong-theme (FOUC) — implementation lives in
`src/theme/`. UI must remain accessible in both themes.

## Accessibility & SEO

- Mobile-first, responsive layout.
- Semantic HTML, correct heading hierarchy, ARIA labels on interactive elements.
- SEO meta tags per page (title, description, Open Graph, canonical).

## Data sync

- `bun run sync` fetches the upstream achievements README and compares it with
  `src/data/achievements.ts`, reporting added/removed achievements and tier changes.
- The script never rewrites the dataset: local data is curated (translations, guides),
  so apply reported changes manually.
- Parsing and diff logic lives in `src/lib/markdown.ts` and `src/lib/achievement-sync.ts`;
  the CLI entrypoint is `scripts/sync.ts`.

## Top 10 Global Leaderboard

- **Feature**: A global leaderboard showing the top 10 users with the most and highest-tier GitHub achievements.
- **Data source**: GitHub REST API — fetches public achievement data for known high-achievement users.
- **Cron job**: Runs daily at 02:00 UTC via GitHub Actions (`.github/workflows/top10-sync.yml`) to keep the leaderboard fresh.
- **Sync command**: `bun run top10:sync` (entrypoint: `scripts/top10-sync.ts`) — manually triggers a leaderboard refresh.
- **Storage**: Results are committed to `public/data/top10.json` and served statically (no runtime API calls).
- **Display**: Rendered on the homepage via the `Top10Leaderboard` React component (`src/components/Top10Leaderboard.tsx`).