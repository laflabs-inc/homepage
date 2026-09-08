# Final fix round 1 report

## Status

Complete. The twelve final-review findings are addressed and verified in the search service, public API, overlay, header, consent UI, responsive styles, and focused regressions.

## Findings addressed

1. Partial responses with zero results now use an indeterminate localized state instead of claiming there are no results.
2. Each result row exposes its specific localized subtype: page, product, repository, notice, legal, or disclosure.
3. The homepage registry now indexes the displayed COMPANY, BUILD LOOP, and SIGNAL content, backed by matching section IDs.
4. Persistent no-result fallback links close the overlay before navigation.
5. Result counts, empty states, partial states, loading, validation, and errors share one polite live-status region; visual duplicates are hidden from assistive technology.
6. Mobile fallback links have a 44px minimum target height.
7. The consent disclosure now names aggregate-only search analytics fields and the consent policy version is incremented from 1 to 2.
8. Mandatory consent and site search are mutually exclusive: the search trigger and shortcut stay inactive while the consent panel is open, with inert state restored correctly.
9. Header search-open analytics run only in event handlers and emit once per closed-to-open transition, including React Strict Mode.
10. Static search results are mapped explicitly, removing the `_keywords` lint warning.
11. Responsive polish aligns at the 720px breakpoint, removes layout-shifting hover padding, and compacts the 600px-or-shorter layout without clipping.
12. The API accepts 100 astral Unicode code points, matching the overlay's code-point validation.

## Automated verification

Focused command:

```text
npx vitest run tests/search/site-search.test.ts tests/search/search-api.test.ts tests/components/site-search-overlay.test.tsx tests/components/landing-refresh.test.tsx tests/components/consent-panel.test.tsx tests/analytics/consent.test.ts
```

Passed: 6 files, 77 tests.

Full command:

```text
npm test
```

Passed: TypeScript, ESLint with no project warnings, 80 Vitest files / 882 tests, and the Next.js 16.3.2 production build.

Vitest continues to print its non-blocking future native-config-loader warning for `__dirname` in `vitest.config.ts`.

## Browser verification

The installed `agent-browser` executable is not on `PATH`. The required `npx agent-browser` smoke attempt also could not launch its bundled Chrome because `libatk-1.0.so.0` was unavailable to that runtime. The full check therefore used the repository's Playwright Chromium with the existing user-space library bundle; no packages or system libraries were installed.

Verified successfully at 1440x900, 390x844, and 568x320, plus 1440x900 with reduced motion:

- the page and real `/api/search` load without error overlays or page errors;
- the overlay aligns below the 76px header, focuses the input, locks background scroll, and makes the covered page inert;
- loading, result, no-result, partial-result, unavailable, and retry states render;
- result surfaces scroll and neither language produces horizontal overflow;
- switching locale preserves the query while clearing stale results;
- Escape restores background state and trigger focus, and Ctrl+K reopens search;
- reduced-motion transitions are effectively disabled;
- analytics emit only aggregate `q17:r1` data and never the raw query.

Screenshots:

- `/tmp/site-search-verification-fix1/search-1440x900.png`
- `/tmp/site-search-verification-fix1/search-390x844.png`
- `/tmp/site-search-verification-fix1/search-568x320.png`
- `/tmp/site-search-verification-fix1/search-1440x900-reduced.png`
