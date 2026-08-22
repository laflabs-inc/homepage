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
```

## Deployment

Vercel builds this repository with zero configuration. The one optional
environment variable:

| Variable | Purpose | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata and JSON-LD | `https://laflabs.co` |

The public contact address is `contact@laflabs.co`. The route renders on demand
because locale detection reads request cookies and headers.
