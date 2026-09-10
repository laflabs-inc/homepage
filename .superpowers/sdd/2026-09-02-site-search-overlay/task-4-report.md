# Task 4 report: integrated verification and regression hardening

## Regression fixes

- Added KO/EN coverage for the full 2–100 character query range and changed the localized validation copy accordingly.
- Reproduced a full-suite Vitest failure introduced when `SiteHeader` began importing the search CSS module. Vite could not consume the array/string PostCSS plugin format. Updated `postcss.config.mjs` to the object-based Tailwind PostCSS format documented by Next.js 16, which works with both Next.js and Vite.

## Automated verification

- Focused search tests: 47 passed across four files.
- Full unit suite: 80 files, 866 tests passed.
- `npm test`: passed (typecheck, ESLint, unit tests, production build).
- Non-blocking warnings remain: the pre-existing `_keywords` unused-variable ESLint warning in `lib/search/site-search.ts`, and Vitest's future native config-loader warning for `__dirname`.

## Browser verification

The installed `agent-browser` skill could not run directly because the executable was not on `PATH`. An `npx` fallback downloaded the CLI, but its bundled Chrome exited because `libatk-1.0.so.0` was unavailable to that runtime. Verification therefore used the repository's Playwright 1.62.1 and installed Chromium 151 with already-present user-space browser libraries. No system packages were installed.

The real `GET /api/search?q=Laf&locale=ko` endpoint returned HTTP 200 with a results array. UI states used deterministic Playwright route fixtures so loading, result, no-result, partial-result, error, and retry behavior could all be exercised without relying on the local document database.

Verified at 1440×900, 390×844, and 568×320:

- overlay starts exactly beneath the fixed 76px header;
- input receives focus;
- background scroll locks and `main`/`footer` become inert;
- loading, result, no-result, partial-result, error, and retry states render;
- result/overlay surfaces scroll and do not overflow horizontally;
- KO/EN copy wraps, the active locale changes, the query remains, and stale results clear;
- Escape restores background state and trigger focus;
- Ctrl+K opens the overlay and focuses the input;
- reduced-motion media behavior is active and search transitions are effectively zero-duration;
- no Playwright `pageerror` events or Next.js error overlays appeared;
- the emitted analytics beacon omitted the raw query and contained only `search_submit` with `q17:r1`.

The 568×320 results screenshot was intentionally captured after the scroll surface moved to `scrollTop: 160`; its cropped heading is therefore a verification state, not an initial-layout defect. A separate initial-open capture measured `scrollTop: 0`, overlay top `76`, and heading top `107`, confirming the heading is visible before scrolling.

## Screenshots

- `/tmp/site-search-verification/search-1440x900.png`
- `/tmp/site-search-verification/search-390x844.png`
- `/tmp/site-search-verification/search-568x320.png` (after intentional scroll)
- `/tmp/site-search-verification/search-568x320-initial.png` (before scroll)
- `/tmp/site-search-verification/search-1440x900-reduced.png`

## Remaining concerns

- The local home page's latest-content requests return 503 without the document-store environment. This is environment-specific and does not break the search overlay; the real search API still returns its static results with partial-result semantics.
