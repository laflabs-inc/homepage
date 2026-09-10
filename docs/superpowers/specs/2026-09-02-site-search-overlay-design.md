# Site Search Overlay Design

## Context

LafLabs now has public product, open-source, design, notice, legal, and disclosure content, but visitors must already know where each item lives. The site needs one search entry point that works from the shared header without turning the website into a dashboard.

The approved interaction reference is a full-screen search state similar in scale to OpenAI's site search. The visual treatment remains LafLabs: light paper, blue rules, square controls, compact mono labels, and the existing header. The reference defines interaction scale, not visual identity.

## Goals

- Open site search from the shared header on the homepage and document pages.
- Keep the header visible while the content below it becomes a focused search surface.
- Search static pages, products, open-source projects, and published documents in the active locale.
- Return clear, grouped results without requiring a new database, search service, or dependency.
- Support keyboard, mobile, reduced-motion, and error states as first-class behavior.
- Reuse the consent-aware analytics system without collecting raw search text.

## Non-goals

- AI answers, summaries, embeddings, semantic search, and vector storage.
- Search-as-you-type, autocomplete, fuzzy-search dependencies, or typo correction.
- Searching draft, scheduled, archived, or admin-only content.
- Searching complete Markdown bodies in the first version. Published documents match title and summary, consistent with the existing public document search.
- A dedicated `/search` results page.

## User experience

### Opening and closing

The shared header gains a square search control alongside the language and GitHub controls. Activating it opens a fixed layer directly below the 76px header. The layer fills the remaining viewport and prevents the page underneath from scrolling.

While open:

- the search icon becomes a close icon;
- the search field receives focus;
- `Escape` closes the layer and returns focus to the search control;
- `Ctrl+K` and `Command+K` open the layer from anywhere outside editable fields;
- closing resets the query and results so each opening starts from a predictable empty state.

The overlay uses a short opacity/vertical transition. `prefers-reduced-motion` removes the transition.

### Search surface

The first viewport contains one oversized search field with a strong bottom rule and a square blue submit control. The empty state is intentionally quiet: a bilingual prompt and the searchable content groups are enough. No promotional cards or suggested queries are added.

Submitting a trimmed query of 2–100 Unicode characters keeps the overlay open and replaces the lower area with grouped results:

1. Pages
2. Products and open source
3. Documents, separated by notice, legal, and disclosure labels

Each result is a full-width text row with a small group label, title, concise description, and directional mark. Results use rules rather than floating cards. Selecting a result navigates normally and closes the overlay through navigation.

On mobile, the same hierarchy is retained. The input and submit control remain one row while result metadata wraps below the title. The result area scrolls inside the overlay; the page behind it does not move.

### States

- **Idle:** prompt only; no request is sent.
- **Invalid:** a concise message appears below the input for a query shorter than two characters.
- **Loading:** submit control exposes `aria-busy`; the previous result list stays visible but is visually muted.
- **Results:** grouped matching items and a total result count.
- **No results:** a direct no-result message and links to Notices, Design guide, and GitHub.
- **Partial results:** static results remain available if document storage is unavailable, with a short document-search warning.
- **Failure:** the query remains editable and a retry action submits it again.

## Search architecture

### Client surface

`SiteHeader` owns the open/closed state because it already renders in the homepage and public document layouts. A focused `SiteSearchOverlay` component owns the query, request, result, focus, scroll-lock, and keyboard behavior. Keeping the overlay separate prevents the existing header component from becoming a search implementation file.

The overlay submits a request only when the visitor submits the form. It aborts a previous in-flight request before starting another one. No debounce or autocomplete state is needed.

### Search endpoint

`GET /api/search?q=<query>&locale=<ko|en>` validates a strict parameter set:

- one `q` value, trimmed, 2–100 Unicode characters;
- one supported `locale` value;
- no duplicate or unknown parameters.

The response contains grouped, presentation-ready results and a `partial` flag. Search responses use `Cache-Control: no-store` because queries may contain user-entered text and the existing document query path is also uncached.

### Static registry

A small server-side registry contains the public routes that cannot be discovered from the document database:

- homepage and its major sections;
- Design guide;
- Notices, Legal, and Disclosures indexes;
- current products from `lib/content.ts`;
- current open-source repositories from `lib/content.ts`.

Each registry entry provides a localized title, description, keywords, href, and result group. Matching is a normalized case-insensitive substring check over those fields. This is deliberately simple and sufficient for the current content volume.

### Published documents

The endpoint calls the existing `listPublishedDocuments` path for notice, legal, and disclosure in parallel with the active locale, passing the validated query as `search`. Each kind returns at most six results. This preserves the current publication and locale rules and excludes non-public revisions automatically.

The existing database search matches title and summary. Search does not load Markdown bodies or create a second document index.

### Ordering

Static entries use a small deterministic score:

1. exact title or product/repository name;
2. title prefix;
3. title contains query;
4. keyword contains query;
5. description contains query.

Published documents retain the existing pinned/latest order within each kind. The UI groups results instead of calculating a cross-source relevance score.

## Data contract

Each result has only the fields required by the overlay:

```ts
type SiteSearchResult = {
  id: string
  group: "page" | "product" | "open-source" | "notice" | "legal" | "disclosure"
  title: string
  description: string
  href: string
}
```

The endpoint returns:

```ts
type SiteSearchResponse = {
  query: string
  results: SiteSearchResult[]
  partial: boolean
}
```

The client derives visible groups and the total count from this single list.

## Locale behavior

The overlay uses the current `LocaleProvider` value for UI copy and requests. Changing language while the overlay is open clears results and keeps the query so the visitor can explicitly resubmit it in the new locale. Document result URLs include `?locale=<locale>` so their language survives navigation.

Static result titles, descriptions, and keywords are stored for both Korean and English. Product and repository facts remain shared while their descriptions come from the existing localized content tables.

## Analytics and privacy

The existing `useAnalytics()` hook records only:

- `search_open`;
- `search_submit` with query length and result count;
- `search_result_click` with the result group.

Raw queries, result titles, slugs, and destination URLs are not sent to analytics. Tracking remains unavailable until the visitor has granted analytics consent.

## Accessibility

- The layer uses `role="dialog"`, `aria-labelledby`, and a visible heading. It is not declared modal because the shared header and its close control remain available.
- The search form uses the native `role="search"`, labelled search input, and submit button.
- Opening moves focus to the input; closing restores it to the trigger.
- `Escape` closes the layer. The covered `main` and `footer` regions become inert while search is open, leaving only the header and search layer in the keyboard order.
- Loading, result count, partial failure, and no-result messages use an appropriate polite live region.
- All controls have visible focus states and at least 44px touch targets on mobile.
- Body scroll locking and inert regions restore their previous values on close and unmount.

## Error handling and security

- The API rejects malformed or oversized input with `400 invalid_request`.
- Result descriptions are rendered as plain React text; matching never injects highlighted HTML.
- Only published document metadata is returned.
- A document-store error produces static results with `partial: true`; an unexpected complete failure returns `503 unavailable`.
- The client ignores aborted requests and distinguishes invalid, unavailable, and partial-result messages.

## Expected code changes

- `components/layout/site-header.tsx`: add the search trigger and own overlay visibility.
- `components/search/site-search-overlay.tsx`: form, keyboard/focus behavior, fetch state, and result rendering.
- `components/search/site-search-overlay.module.css`: responsive LafLabs search surface.
- `app/api/search/route.ts`: validation and response handling.
- `lib/search/site-search.ts`: static registry matching and published document aggregation.
- `lib/search/types.ts`: shared result contract.
- `lib/content.ts`: bilingual search UI copy and localized static-search descriptions where existing copy is insufficient.
- `tests/search/*` and a focused header/overlay component test: validation, ranking, locale, partial failure, interaction, and overflow behavior.

No new package, database table, migration, vector index, or dedicated search page is required.

## Verification

Automated checks cover:

- strict query validation and duplicate parameter rejection;
- static result scoring and deterministic ordering;
- published-only document aggregation in both locales;
- partial document failure behavior;
- open, submit, close, Escape, focus restoration, and locale-change behavior;
- no raw search query in analytics payloads.

The final browser pass checks desktop and mobile together: overlay geometry, fixed header relationship, inner scrolling, focus visibility, no background scroll, long Korean/English titles, empty/results/error states, and reduced motion.
