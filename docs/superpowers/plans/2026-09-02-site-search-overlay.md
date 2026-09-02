# Site Search Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a LafLabs-styled full-screen search overlay that combines public pages, products, open-source projects, and published document metadata.

**Architecture:** `SiteHeader` owns the open state and renders a client `SiteSearchOverlay`. A single `GET /api/search` endpoint validates input and delegates to a server search service that combines a small static registry with the existing published-document reader. The feature uses existing analytics, localization, Motion, and CSS tokens without a search database or new dependency.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Vitest, Testing Library, Motion, Zod, existing document repository and analytics hook.

**Spec:** `docs/superpowers/specs/2026-09-02-site-search-overlay-design.md`

## Global Constraints

- Accept one trimmed `q` value of 2–100 Unicode characters and one `locale` value of `ko` or `en`.
- Search only public static content and published document title/summary metadata.
- Do not add AI answers, embeddings, vector storage, autocomplete, fuzzy-search packages, a new database table, or a dedicated `/search` page.
- Keep the shared header visible; the fixed overlay starts below its 76px height and locks the covered page.
- Use LafLabs paper, ink, blue rules, square controls, bilingual copy, and reduced-motion behavior.
- Never send raw query text, titles, slugs, or hrefs to analytics.

---

### Task 1: Search contract and server aggregation

**Files:**
- Create: `lib/search/types.ts`
- Create: `lib/search/site-search.ts`
- Test: `tests/search/site-search.test.ts`

**Interfaces:**
- Produces `SiteSearchResult`, `SiteSearchResponse`, and `searchSite(query, locale, repository?)`.
- Consumes `copy`, `products`, `repositories`, `documentKinds`, `listPublishedDocuments`, and `PublishedDocumentReader`.

- [ ] **Step 1: Write failing aggregation tests**

Create Vitest cases that assert exact-title static results rank before description matches, Korean and English return localized copy, products and repositories have their correct groups, each document kind receives `{ locale, search: query, limit: 6 }`, published result hrefs contain `?locale=`, and a throwing repository returns static results with `partial: true`.

```ts
expect(result.results[0]).toMatchObject({ group: "product", title: "Laf ID" })
expect(repository.listPublished).toHaveBeenCalledWith(expect.objectContaining({
  kind: "notice", locale: "ko", search: "인증", limit: 6,
}))
expect(partial.partial).toBe(true)
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm run test:unit -- tests/search/site-search.test.ts`

Expected: FAIL because `@/lib/search/site-search` does not exist.

- [ ] **Step 3: Implement the shared result contract**

```ts
export type SiteSearchGroup =
  | "page" | "product" | "open-source"
  | "notice" | "legal" | "disclosure"

export type SiteSearchResult = {
  id: string
  group: SiteSearchGroup
  title: string
  description: string
  href: string
}

export type SiteSearchResponse = {
  query: string
  results: SiteSearchResult[]
  partial: boolean
}
```

- [ ] **Step 4: Implement the minimal registry and aggregator**

Create localized registry entries for `/`, homepage anchors, `/design`, `/notices`, `/legal`, `/disclosures`, current products, and current repositories. Normalize with `value.normalize("NFKC").toLocaleLowerCase(locale)` and score exact title, title prefix, title contains, keyword contains, then description contains. Query all three document kinds in one `Promise.all`, map published metadata to the shared result type, and catch only the document aggregation boundary to return `partial: true`.

```ts
export async function searchSite(
  query: string,
  locale: Locale,
  repository: PublishedDocumentReader = documentStore,
): Promise<SiteSearchResponse>
```

- [ ] **Step 5: Verify and commit**

Run: `npm run test:unit -- tests/search/site-search.test.ts && npm run typecheck`

```bash
git add lib/search tests/search/site-search.test.ts
git commit -m "feat: aggregate site search results"
```

### Task 2: Strict public search API

**Files:**
- Create: `app/api/search/route.ts`
- Test: `tests/search/search-api.test.ts`

**Interfaces:**
- Produces `handleSiteSearch(request, repository?)` for direct tests and `GET(request)` for Next.js.
- Consumes `searchSite` and returns `SiteSearchResponse`.

- [ ] **Step 1: Write failing API tests**

Cover missing, one-character, 101-character, duplicate, unknown, and unsupported-locale parameters. Assert a valid request trims the query, returns the search payload, and sets `Cache-Control: no-store`. Assert error bodies are only `{ error: "invalid_request" }` or `{ error: "unavailable" }` and never include repository messages.

```ts
const response = await handleSiteSearch(
  new Request("https://laflabs.co/api/search?q=%20Laf%20ID%20&locale=ko"),
  repository,
)
expect(response.status).toBe(200)
expect(response.headers.get("cache-control")).toBe("no-store")
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm run test:unit -- tests/search/search-api.test.ts`

Expected: FAIL because `@/app/api/search/route` does not exist.

- [ ] **Step 3: Implement strict validation and response handling**

Reject duplicate or unknown query parameters before parsing. Use Zod to validate `q` and `locale`, call `searchSite`, and return `Response.json(payload, { headers: { "Cache-Control": "no-store" } })`. Do not log user input.

```ts
export async function handleSiteSearch(
  request: Request,
  repository: PublishedDocumentReader = documentStore,
): Promise<Response>

export async function GET(request: Request) {
  return handleSiteSearch(request)
}
```

- [ ] **Step 4: Verify and commit**

Run: `npm run test:unit -- tests/search/search-api.test.ts && npm run typecheck`

```bash
git add app/api/search/route.ts tests/search/search-api.test.ts
git commit -m "feat: expose public site search api"
```

### Task 3: Full-screen overlay and header integration

**Files:**
- Create: `components/search/site-search-overlay.tsx`
- Create: `components/search/site-search-overlay.module.css`
- Modify: `components/layout/site-header.tsx`
- Modify: `lib/content.ts`
- Test: `tests/components/site-search-overlay.test.tsx`

**Interfaces:**
- Produces `SiteSearchOverlay({ open, onClose, triggerRef })`.
- Consumes `/api/search`, `SiteSearchResponse`, `LocaleProvider`, and the existing consent-aware `useAnalytics()` hook.

- [ ] **Step 1: Write failing interaction tests**

Mock CSS modules, `motion/react`, `fetch`, and `useAnalytics`. Assert the header search control opens the overlay, focuses the input, submits the active locale, groups results under localized `페이지`, `제품·오픈소스`, and `공지·공시·약관` headings, rejects short queries without fetching, closes on Escape, restores trigger focus, and restores body overflow plus `main`/`footer` inert state on close.

```tsx
await user.click(screen.getByRole("button", { name: "검색" }))
expect(screen.getByRole("dialog", { name: "사이트 검색" })).toBeInTheDocument()
expect(screen.getByRole("searchbox")).toHaveFocus()
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm run test:unit -- tests/components/site-search-overlay.test.tsx`

Expected: FAIL because the overlay and header search control do not exist.

- [ ] **Step 3: Add bilingual search copy**

Extend `copy[locale]` with labels for open, close, heading, prompt, input, submit, invalid, loading, result count, group headings, no result, partial result, unavailable, retry, and fallback links. Keep Korean and English shapes identical so `Copy` enforces completeness.

- [ ] **Step 4: Implement overlay behavior**

Keep query, result, pending, and error state inside the overlay; reset on close. Submit only through the form, abort an older request, and treat abort as silent. On open, focus the input, save/lock body overflow, set covered `main` and `footer` inert, and restore all values on close/unmount. Register Escape and `Ctrl/Command+K`, ignoring input, textarea, select, and contenteditable targets. The layer uses `role="dialog"` with `aria-labelledby`, not `aria-modal`.

- [ ] **Step 5: Integrate the header trigger and privacy-safe analytics**

Add a 34px square search/close button with `aria-expanded` and `aria-controls`. Record `search_open`, `search_submit` with query length/result count, and `search_result_click` with group only. If the current analytics event type does not accept these events, widen the existing generic event name type rather than creating a new client.

- [ ] **Step 6: Implement the LafLabs visual treatment**

Use a fixed overlay at `top: 76px`, existing paper/ink/blue tokens, blue top rule, oversized underlined input, square blue submit control, rule-separated rows, internal result scrolling, 44px mobile targets, and reduced-motion overrides. Do not add floating result cards or copy the reference's black palette.

- [ ] **Step 7: Verify and commit**

Run: `npm run test:unit -- tests/components/site-search-overlay.test.tsx && npm run lint && npm run typecheck`

```bash
git add components/search components/layout/site-header.tsx lib/content.ts tests/components/site-search-overlay.test.tsx
git commit -m "feat: add full-screen site search overlay"
```

### Task 4: Integrated verification and regression hardening

**Files:**
- Modify only files required by failures found in this task.
- Test: existing search tests and full repository suite.

**Interfaces:**
- Consumes the completed search service, API, overlay, header, localization, and analytics behavior.
- Produces a release-ready branch with no new public contract.

- [ ] **Step 1: Run all automated checks**

Run: `npm test`

Expected: typecheck, ESLint, all Vitest tests, and production build pass.

- [ ] **Step 2: Fix only search-related regressions with a reproducing test**

For every failure caused by this branch, first add or tighten the smallest search test that reproduces it, then change the owning search/API/header file. Re-run the focused test before returning to `npm test`.

- [ ] **Step 3: Run one desktop/mobile browser pass**

Verify at 1440px and 390px widths: fixed header relationship, background scroll lock, internal result scrolling, Korean/English wrapping, empty/loading/result/no-result/partial/error states, Escape/focus restoration, `Command/Ctrl+K`, and reduced motion. Check that network analytics payloads contain no query text.

- [ ] **Step 4: Commit any verification fixes**

```bash
git add app components lib tests
git commit -m "fix: harden site search interactions"
```

Skip this commit when verification produces no changes.
