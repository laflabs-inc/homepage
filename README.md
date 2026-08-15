# LafLabs Homepage

The public homepage for [LafLabs Inc.](https://github.com/laflabs-inc) — a software
company building identity, payments, and cloud infrastructure as one experience.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS 4** for utilities, with the design system expressed as CSS
  custom properties in `app/globals.css`
- **motion** (Framer Motion) for entrance, scroll, and interaction animation
- **Geist Sans / Geist Mono**, self-hosted from `public/fonts`
- Deployed on **Vercel**

## Design system

Tokens are inherited from the Laf ID web surface so every LafLabs property reads
as one system:

| Token | Value | Notes |
| --- | --- | --- |
| `--radius` | `0rem` | Everything is square, including buttons and cards |
| `--brand` | `#2563eb` | The single structural colour |
| `--spark` | `#f59e0b` | Accent only — the "Laf" half of the name |
| Type | Geist Sans / Geist Mono | Headings at `-0.05em` tracking, weight 760 |

Light and dark themes are driven by a `.dark` class on `<html>`, set before
first paint by `public/theme-init.js` so the page never flashes.

`--spark` is deliberately rationed: it appears in the logo mark, the terminal
result line, and the name section. Everything structural stays on `--brand`.

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
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata and JSON-LD | `https://laflabs.com` |

The route renders on demand rather than statically, because locale detection
reads request cookies and headers.
