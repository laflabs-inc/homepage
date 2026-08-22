# LafLabs Homepage

The public homepage for [LafLabs Inc.](https://github.com/laflabs-inc) — a software
company building identity, payments, and cloud infrastructure as one experience.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS 4** for utilities, with the design system expressed as CSS
  custom properties in `app/globals.css`
- **motion** for the routing reveal, section entrances, and technology marquee
- **Geist Sans / Geist Mono**, self-hosted from `public/fonts`
- Deployed on **Vercel**

## Design system

The shipped design is a single dark **Signal Routing Field**: deep navy surfaces,
one structural action blue, a lighter readable signal blue, off-white type, and
square geometry.

| Token | Value | Notes |
| --- | --- | --- |
| `--radius` | `0rem` | Buttons, controls, and endpoints stay square |
| `--background` | `#0b1328` | Page navy and browser theme colour |
| `--foreground` | `#f4f7fb` | Primary text |
| `--brand` | `#165dff` | Filled actions and structural accent |
| `--route-line` | `#8fb6ff` | Routes, small signal text, live status, and focus |
| `--muted-foreground` | `#8ba7d9` | Secondary text |
| Type | Geist Sans / Geist Mono | Large sans headlines and compact mono metadata |

The page intentionally ships one dark theme. `prefers-reduced-motion` renders
all Motion content in its complete static state and disables the marquee.

## Localisation

Korean and English copy live side by side in `lib/content.ts`. Facts that must
not drift between languages — URLs, repo names, the tech stack — are defined
once above the copy tables.

The initial locale is resolved server-side from the `laf_locale` cookie, then
the `Accept-Language` header, defaulting to Korean. The header toggle updates
the cookie and re-renders without a navigation.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build      # production build
npm test           # all three
npm run test:e2e   # 8 browser flows on desktop + mobile; isolated DB required
```

Browser tests require a migrated, disposable `TEST_DATABASE_URL`. The runner
refuses a missing test database, an exact `DATABASE_URL` match, and configured
production hostnames. Never point Playwright at production. See the
[analytics operations runbook](docs/analytics-operations.md) for the safe setup.
CI must set `E2E_PRODUCTION_DATABASE_HOSTNAME` to the production database host;
the value is compared without credentials and is never sent to the application.

## Deployment

Vercel builds the application. Consent analytics and the protected dashboard
require the following server-side environment:

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | Environment-specific Neon PostgreSQL connection | Required |
| `ANALYTICS_HASH_SECRET` | Signs and hashes analytics identity; 32+ bytes | Required |
| `AUTH_SECRET` | Encrypts Auth.js sessions; 32+ bytes | Required |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth application | Required |
| `ADMIN_GITHUB_ORG` | Required active GitHub organization | `laflabs-inc` |
| `CRON_SECRET` | Retention bearer secret; 16+ bytes | Required |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata and JSON-LD | `https://laflabs.co` |

The public contact address is `contact@laflabs.co`. The route renders on demand
because locale detection reads request cookies and headers.

Provision Neon, register the exact GitHub callback, migrate preview before
production, and complete legal review of consent/privacy copy by following
[docs/analytics-operations.md](docs/analytics-operations.md).
