# GitHub Achievements

A comprehensive, always-up-to-date guide to every [GitHub profile achievement](https://github.com/Schweinepriester/github-profile-achievements), built with Astro, React, TypeScript, and Tailwind CSS.

> Discover every badge — earnable, retired, internal, and disabled — learn exactly how to unlock it and its tiers (default, bronze, silver, gold), understand badge skin tones, and analyze your repositories to track your progress.

## Features

- **Full catalog** — every GitHub achievement with badge images, category, and earnability status.
- **Unlock guides** — step-by-step instructions and exact tier thresholds (bronze, silver, gold).
- **Repository analysis** — paste a username/repo and see which achievements you already have and how close you are to the next tier, via the public GitHub REST API.
- **Global top 10** — a leaderboard of the users with the most and highest-tier achievements.
- **Badge skin tones** — all emoji skin-tone variants of the badges.
- **Multilingual** — automatic locale detection (browser `Accept-Language`) with a clean fallback.
- **Dark / light / auto theme** — follows your system by default, with manual override.
- **PWA** — installable, works offline.

## Tech stack

| Area | Tool |
| --- | --- |
| Runtime & package manager | [Bun](https://bun.sh) |
| Framework | [Astro](https://astro.build) + [React](https://react.dev) |
| Language | TypeScript (strict) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4 |
| Lint & format | [Biome](https://biomejs.dev) |
| Unit tests | [Vitest](https://vitest.dev) |
| E2E tests | [Playwright](https://playwright.dev) |
| Deploy | Cloudflare Pages |

## Getting started

Prerequisites: [Bun](https://bun.sh) >= 1.2.0 and Node >= 22.12.0.

```bash
bun install --frozen-lockfile
bun run dev
```

Open http://localhost:4321.

### Useful commands

| Command | Description |
| --- | --- |
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run preview` | Preview the production build |
| `bun run lint` | Biome check (lint + format) |
| `bun run lint:fix` | Auto-fix lint/format issues |
| `bun run typecheck` | TypeScript check |
| `bun run test` | Vitest unit tests |
| `bun run test:coverage` | Unit tests with coverage |
| `bun run test:e2e` | Playwright end-to-end tests |
| `bun run sync` | Compare the local dataset with the upstream achievements README |
| `bun run top10:sync` | Manually refresh the global Top 10 leaderboard |

## Project structure

```
src/
  components/   # React components
  data/         # achievement data (single source of truth)
  i18n/         # locales and translation dictionaries
  layouts/      # Astro layouts
  pages/        # Astro pages (routes)
  styles/       # global styles
  theme/        # light/dark/auto theme logic
  lib/          # helpers and API clients
e2e/            # Playwright tests
```

## Git workflow

- `master` — production (protected).
- `develop` — integration (protected).
- Each task: feature branch -> PR to `develop` (English title & description).
- [Conventional Commits](https://www.conventionalcommits.org) + [SemVer](https://semver.org).

## Data sources

- [Schweinepriester/github-profile-achievements](https://github.com/Schweinepriester/github-profile-achievements) — mirror of all achievements, badges, and tiers.
- [GitHub Docs](https://docs.github.com) — official criteria and visibility settings.
- [GitHub Blog / Changelog](https://github.blog/changelog/) — announcements and historical versions.
- [GitHub REST API](https://docs.github.com/rest) — live user achievement and repository data.

## License

MIT.