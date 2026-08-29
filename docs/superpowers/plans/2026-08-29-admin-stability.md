# Admin Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Localize the complete Admin interface, make OpenAI credential verification actionable and compatible, and permanently remove database-backed design documents while keeping the static design guide.

**Architecture:** Reuse the existing root locale cookie/context with one typed Admin copy catalog and a server locale resolver. Keep OpenAI errors machine-readable across provider, service, and authenticated API boundaries using a small redacted diagnostic value. Remove `design` at the TypeScript, route, query, and PostgreSQL-enum boundaries in one forward-only migration.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, AI SDK 7, `@ai-sdk/openai` 4, Drizzle ORM/PostgreSQL, Vitest, Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-29-admin-stability-design.md`

## Global Constraints

- Keep the static `/design` page and `DesignGuide` component available in Korean and English.
- Permanently delete any database-backed `design` revisions and series during migration.
- Keep `notice`, `legal`, and `disclosure` behavior and data unchanged.
- Use the existing `laf_locale` cookie and root `LocaleProvider`; do not add an Admin-only locale store.
- Keep Admin API error codes stable and localize only in the UI.
- Never return or log API keys, authorization headers, request bodies, ciphertext, IVs, or auth tags.
- Return provider diagnostics only from authenticated Admin endpoints; never persist them.
- Keep GPT-5.6 Luna, Terra, and Sol with the server-owned prices already in `lib/agent/model-catalog.ts`.
- Do not add Analytics, category CRUD, search, or homepage-motion work to this branch.

---

### Task 1: Retire `design` from the application document model

**Files:**
- Modify: `lib/documents/types.ts`
- Modify: `lib/documents/validation.ts`
- Modify: `lib/documents/store.ts`
- Modify: `lib/content.ts`
- Modify: `lib/latest-signals.ts`
- Modify: `components/sections/latest-signals.tsx`
- Modify: `components/content/document-index.tsx`
- Modify: `components/admin/document-list.tsx`
- Modify: `components/admin/document-editor.tsx`
- Modify: `app/sitemap.ts`
- Delete: `app/(documents)/design/[slug]/page.tsx`
- Test: `tests/documents/validation.test.ts`
- Test: `tests/documents/workflow.test.ts`
- Test: `tests/documents/public-api.test.ts`
- Test: `tests/components/document-admin.test.tsx`
- Test: `tests/components/document-pages.test.tsx`
- Test: `tests/components/latest-signals-data.test.ts`
- Test: `tests/components/latest-signals.test.tsx`
- Test: `tests/components/design-guide.test.tsx`

**Interfaces:**
- Produces: `documentKinds = ["notice", "legal", "disclosure"] as const`.
- Produces: `signalKinds = ["notice", "disclosure"] as const`.
- Preserves: `GET /design` as the static guide.
- Removes: dynamic `/design/[slug]` and all `kind=design` inputs.

- [ ] **Step 1: Write failing model and UI tests**

Update the validation expectation and add explicit rejection:

```ts
expect(documentKinds).toEqual(["notice", "legal", "disclosure"])
expect(documentDraftSchema.safeParse({
  ...validDraft,
  kind: "design",
}).success).toBe(false)
```

Update Admin component tests to assert that neither `Kind filter` nor `Kind` contains an option named `Design`. Update latest-signal tests to expect only notice and disclosure fetches and links. Keep the existing assertion that the footer's static `디자인 가이드` link targets `/design`.

- [ ] **Step 2: Run focused tests and confirm the old model fails**

Run:

```bash
npx vitest run tests/documents/validation.test.ts tests/components/document-admin.test.tsx tests/components/latest-signals-data.test.ts tests/components/latest-signals.test.tsx
```

Expected: failures showing `design` is still accepted and rendered.

- [ ] **Step 3: Remove the application references**

Set the exported kinds and category map to:

```ts
export const documentKinds = ["notice", "legal", "disclosure"] as const

export const categoriesByKind = {
  notice: ["general", "service", "maintenance", "security"],
  legal: ["privacy", "terms", "cookies", "policy"],
  disclosure: ["corporate", "financial", "governance", "material"],
} as const
```

Delete the two `locked_revision.kind = 'design'` SQL branches in `lib/documents/store.ts`. Remove `design` from Admin options and latest-signal destinations/copy. Change grouped document indexes to `kind === "legal"`. Remove `documentSections.design` while preserving footer copy for the static guide.

Delete `app/(documents)/design/[slug]/page.tsx`. Add `/design` as an explicit static sitemap entry so retiring dynamic design documents does not remove the guide from discovery.

- [ ] **Step 4: Run every affected document and signal test**

Run:

```bash
npx vitest run tests/documents tests/components/document-admin.test.tsx tests/components/document-pages.test.tsx tests/components/latest-signals-data.test.ts tests/components/latest-signals.test.tsx tests/components/design-guide.test.tsx
```

Expected: all selected files pass and no test fixture constructs a `DocumentRevision` with `kind: "design"`.

- [ ] **Step 5: Commit the application retirement**

```bash
git add app components lib tests
git commit -m "refactor: retire design document kind"
```

---

### Task 2: Add the forward-only PostgreSQL enum migration

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `drizzle/0009_retire_design_documents.sql`
- Modify: `drizzle/meta/0009_snapshot.json`
- Modify: `drizzle/meta/_journal.json`
- Create: `tests/documents/design-retirement-migration.test.ts`

**Interfaces:**
- Produces: PostgreSQL enum `document_kind` with exactly `notice`, `legal`, and `disclosure`.
- Consumes: Task 1's matching TypeScript `DocumentKind`.
- Deletes: revisions and series whose series kind is `design`.

- [ ] **Step 1: Add a failing schema/migration contract test**

The test reads the current Drizzle schema and newest SQL migration and asserts the destructive statements precede enum replacement:

```ts
expect(documentKindEnum.enumValues).toEqual(["notice", "legal", "disclosure"])
expect(sql.indexOf("DELETE FROM \"document_revisions\"")).toBeLessThan(
  sql.indexOf("DROP TYPE \"public\".\"document_kind\""),
)
expect(sql).toContain("CREATE TYPE \"public\".\"document_kind\" AS ENUM('notice', 'legal', 'disclosure')")
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run:

```bash
npx vitest run tests/documents/design-retirement-migration.test.ts
```

Expected: failure because the schema and migration still contain `design`.

- [ ] **Step 3: Update schema and generate migration metadata**

Change the schema declaration to:

```ts
export const documentKindEnum = pgEnum("document_kind", ["notice", "legal", "disclosure"])
```

Run:

```bash
npm run db:generate -- --name=retire_design_documents
```

Keep the generated snapshot and journal entry. Review and replace the generated SQL body with the ordered transaction-safe statements below if Drizzle does not generate the deletion and cast sequence:

```sql
DELETE FROM "document_revisions"
WHERE "series_id" IN (
  SELECT "id" FROM "document_series" WHERE "kind" = 'design'
);
--> statement-breakpoint
DELETE FROM "document_series" WHERE "kind" = 'design';
--> statement-breakpoint
ALTER TABLE "document_series" ALTER COLUMN "kind" TYPE text USING "kind"::text;
--> statement-breakpoint
DROP TYPE "public"."document_kind";
--> statement-breakpoint
CREATE TYPE "public"."document_kind" AS ENUM('notice', 'legal', 'disclosure');
--> statement-breakpoint
ALTER TABLE "document_series" ALTER COLUMN "kind" TYPE "public"."document_kind"
USING "kind"::"public"."document_kind";
```

- [ ] **Step 4: Verify migration metadata and SQL**

Run:

```bash
npx vitest run tests/documents/design-retirement-migration.test.ts tests/documents/schema.test.ts
npm run typecheck
```

When an isolated sentinel-protected `TEST_DATABASE_URL` is available, seed one series/revision for each old kind, run `DATABASE_URL="$TEST_DATABASE_URL" npm run db:migrate`, and query counts. Expected: design count is zero; notice/legal/disclosure counts are unchanged.

- [ ] **Step 5: Commit the migration**

```bash
git add lib/db/schema.ts drizzle tests/documents/design-retirement-migration.test.ts
git commit -m "db: remove design document enum value"
```

---

### Task 3: Build the shared Admin locale foundation

**Files:**
- Create: `lib/admin/i18n.ts`
- Create: `lib/admin/locale.ts`
- Create: `components/admin/admin-language-toggle.tsx`
- Modify: `app/admin/layout.tsx`
- Modify: `app/admin/admin.module.css`
- Test: `tests/admin/i18n.test.ts`
- Test: `tests/components/admin-language-toggle.test.tsx`

**Interfaces:**
- Produces: `adminCopy: Record<Locale, AdminCopy>`.
- Produces: `getAdminLocale(): Promise<Locale>` for server components.
- Produces: `<AdminLanguageToggle />` using the existing locale contexts.

- [ ] **Step 1: Write failing catalog and toggle tests**

Test recursive key parity and live selection:

```ts
expect(copyKeys(adminCopy.ko)).toEqual(copyKeys(adminCopy.en))

await user.click(screen.getByRole("button", { name: "English" }))
expect(document.cookie).toContain("laf_locale=en")
expect(routerRefresh).toHaveBeenCalledOnce()
expect(document.documentElement.lang).toBe("en")
```

Also assert both buttons expose `aria-pressed`, and the active thumb is positioned by a local Admin class rather than the homepage `.lang-thumb` selector.

- [ ] **Step 2: Run the new tests and verify missing modules fail**

Run:

```bash
npx vitest run tests/admin/i18n.test.ts tests/components/admin-language-toggle.test.tsx
```

Expected: module-not-found failures for the new Admin i18n modules.

- [ ] **Step 3: Implement the typed copy and server resolver**

Use one English source shape and enforce the Korean shape recursively:

```ts
type CopyShape<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : T[K] extends object
      ? CopyShape<T[K]>
      : string
}

const en = {
  shell: {
    homeLabel: "LafLabs homepage",
    privateLabel: "Admin / Private",
    languageLabel: "Language",
  },
  nav: {
    analytics: "Analytics",
    documents: "Documents",
    agent: "Agent",
  },
} as const
const ko = {
  shell: {
    homeLabel: "LafLabs 홈페이지",
    privateLabel: "관리자 / 비공개",
    languageLabel: "언어",
  },
  nav: {
    analytics: "분석",
    documents: "문서",
    agent: "에이전트",
  },
} satisfies CopyShape<typeof en>

export type AdminCopy = CopyShape<typeof en>
export const adminCopy: Record<Locale, AdminCopy> = { en, ko }
```

`getAdminLocale()` reads `laf_locale` and `Accept-Language`, then delegates to `resolveRequestLocale()`.

- [ ] **Step 4: Implement the Admin toggle and shell placement**

The click handler is:

```ts
if (value !== locale) {
  setLocale(value)
  router.refresh()
}
```

Render the toggle beside `Admin / Private` in `app/admin/layout.tsx`. Add square Admin-specific button/thumb styles, a 44-pixel minimum touch target, mobile wrapping, focus-visible outlines, and a zero-duration reduced-motion rule.

- [ ] **Step 5: Run foundation tests and commit**

```bash
npx vitest run tests/admin/i18n.test.ts tests/components/admin-language-toggle.test.tsx tests/components/root-layout.test.tsx
git add lib/admin components/admin/admin-language-toggle.tsx app/admin/layout.tsx app/admin/admin.module.css tests/admin tests/components/admin-language-toggle.test.tsx
git commit -m "feat: add admin locale foundation"
```

---

### Task 4: Localize Admin shell, sign-in, navigation, dashboard, and document list

**Files:**
- Modify: `components/admin/admin-nav.tsx`
- Modify: `components/admin/analytics-dashboard.tsx`
- Modify: `components/admin/document-list.tsx`
- Modify: `app/admin/sign-in/page.tsx`
- Modify: `app/admin/(protected)/documents/page.tsx`
- Modify: `app/admin/(protected)/documents/new/page.tsx`
- Modify: `app/admin/(protected)/documents/markdown-guide/page.tsx`
- Modify: `app/admin/(protected)/analytics/error.tsx`
- Test: `tests/components/analytics-dashboard.test.tsx`
- Test: `tests/components/document-admin-pages.test.tsx`
- Create: `tests/components/admin-shell-i18n.test.tsx`

**Interfaces:**
- Consumes: `adminCopy`, `getAdminLocale()`, and `useLocale()` from Task 3.
- Preserves: query strings, filters, pagination, and all existing API contracts.

- [ ] **Step 1: Add failing bilingual rendering tests**

Render each client component inside `LocaleProvider` once with `ko` and once with `en`. Assert representative complete strings rather than slash-combined copy:

```ts
expect(screen.getByRole("link", { name: "문서" })).toBeInTheDocument()
expect(screen.getByRole("heading", { name: "분석" })).toBeInTheDocument()
expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument()
expect(screen.queryByText(/Analytics \/ 분석/)).not.toBeInTheDocument()
```

For server pages, mock `getAdminLocale()` as `ko` and `en` and verify headings, links, and sign-in actions.

- [ ] **Step 2: Run the affected component tests and verify hard-coded English fails**

Run:

```bash
npx vitest run tests/components/admin-shell-i18n.test.tsx tests/components/analytics-dashboard.test.tsx tests/components/document-admin-pages.test.tsx
```

- [ ] **Step 3: Replace hard-coded shell and dashboard strings**

Client components derive `const t = adminCopy[useLocale()]`. Server pages await `getAdminLocale()` and derive the same catalog. Replace every visible heading, label, date-range name, table header, empty state, status badge label, filter label, button, and aria-label in the listed files.

Keep URL values and enums stable. For example, the Korean option visible text is `공지사항`, while its value remains `notice`; `7일` still links to `?range=7`.

- [ ] **Step 4: Replace Apply filters with localized behavior-preserving copy**

This task does not redesign filtering. Keep the link-driven server query behavior and label it `필터 적용` or `Apply filters` through the catalog. The later category/Notices project owns instant filters and toolbar redesign.

- [ ] **Step 5: Run tests and commit**

```bash
npx vitest run tests/components/admin-shell-i18n.test.tsx tests/components/analytics-dashboard.test.tsx tests/components/document-admin-pages.test.tsx tests/components/document-admin.test.tsx
git add app/admin components/admin lib/admin tests/components
git commit -m "feat: localize admin navigation and lists"
```

---

### Task 5: Localize the document editor and preview workflow

**Files:**
- Modify: `components/admin/document-editor.tsx`
- Modify: `components/admin/document-preview.tsx`
- Modify: `components/admin/markdown-authoring-guide.tsx`
- Modify: `components/admin/use-dirty-navigation-guard.ts`
- Test: `tests/components/document-admin.test.tsx`
- Test: `tests/components/markdown-authoring-guide.test.tsx`

**Interfaces:**
- Consumes: `adminCopy[useLocale()].documents`.
- Preserves: document payloads, lifecycle transitions, confirmation matching, and dirty-navigation behavior.
- Keeps: the authored Markdown guide body in Korean; localizes only its Admin shell, intro, and navigation labels.

- [ ] **Step 1: Write failing locale-specific editor tests**

Add Korean assertions for field labels, tabs, lifecycle buttons, status messages, confirmations, delete confirmation, preview metadata, and dirty-navigation confirmation. Include an English rerender assertion to ensure the catalog switches without changing form values:

```ts
expect(screen.getByLabelText("제목")).toHaveValue("기존 제목")
await user.click(screen.getByRole("button", { name: "미리보기" }))
expect(screen.getByText("게시 전 미리보기")).toBeInTheDocument()
```

- [ ] **Step 2: Run editor tests and confirm the Korean labels fail**

Run:

```bash
npx vitest run tests/components/document-admin.test.tsx tests/components/markdown-authoring-guide.test.tsx
```

- [ ] **Step 3: Move messages and confirmations into the catalog**

Change helper signatures so copy is explicit and testable:

```ts
function mutationErrorMessage(
  t: AdminCopy["documents"]["errors"],
  path: string,
  payload: unknown,
): string
```

Pass localized confirmation text into the dirty-navigation guard rather than keeping English inside the hook. Localize dates through `Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US")`; keep stored ISO values unchanged.

- [ ] **Step 4: Localize Markdown guide chrome without forking its source**

Use localized title, intro, table-of-contents label, back link, and AI-source link. Continue rendering `markdownAuthoringGuideSource` and `markdownGuideSections` unchanged so `/markdown-guide.md` remains the single Korean authoring contract.

- [ ] **Step 5: Run editor tests and commit**

```bash
npx vitest run tests/components/document-admin.test.tsx tests/components/markdown-authoring-guide.test.tsx tests/components/document-admin-pages.test.tsx
git add components/admin app/admin/'(protected)'/documents lib/admin tests/components
git commit -m "feat: localize admin document workflow"
```

---

### Task 6: Localize the Agent control plane UI

**Files:**
- Modify: `components/admin/agent-settings.tsx`
- Modify: `app/admin/(protected)/agent/page.tsx`
- Test: `tests/components/agent-settings.test.tsx`

**Interfaces:**
- Consumes: `adminCopy[useLocale()].agent`.
- Preserves: current credential, settings, price, version, and confirmation request bodies.

- [ ] **Step 1: Add failing Korean Agent tests**

Assert localized section names, configuration labels, model descriptions, credential status, success/error notices, advanced-limit summary, confirmation dialogs, and destructive actions. Keep model IDs and USD prices unchanged.

```ts
expect(screen.getByRole("heading", { name: "OpenAI 연결" })).toBeInTheDocument()
expect(screen.getByRole("button", { name: "검증 후 저장" })).toBeInTheDocument()
expect(screen.getByText("입력 100만 토큰당 $0.20 / 출력 100만 토큰당 $1.20")).toBeInTheDocument()
```

- [ ] **Step 2: Run the Agent component test and verify it fails**

```bash
npx vitest run tests/components/agent-settings.test.tsx
```

- [ ] **Step 3: Replace all Agent presentation strings**

Select copy through `useLocale()`. Convert `agentErrorMessage(code)` to `agentErrorMessage(t, code, diagnostic?)`. Localize `Intl.NumberFormat` and `Intl.DateTimeFormat` locales while retaining USD currency and canonical model identifiers.

- [ ] **Step 4: Run tests and commit**

```bash
npx vitest run tests/components/agent-settings.test.tsx tests/agent/admin-api.test.ts tests/agent/service.test.ts
git add components/admin/agent-settings.tsx app/admin/'(protected)'/agent/page.tsx lib/admin tests/components/agent-settings.test.tsx
git commit -m "feat: localize admin agent settings"
```

---

### Task 7: Correct the OpenAI verification request and capture safe diagnostics

**Files:**
- Modify: `lib/agent/provider.ts`
- Modify: `lib/agent/types.ts`
- Test: `tests/agent/provider.test.ts`

**Interfaces:**
- Produces: `CredentialVerificationDiagnostic` with nullable status, provider code/type/parameter, request ID, and sanitized message.
- Produces: `CredentialVerificationError(code, diagnostic)`.
- Changes: verifier request to 16 output tokens, no temperature, `providerOptions.openai.reasoningEffort = "none"`, zero retries, 10-second timeout.

- [ ] **Step 1: Rewrite the request-shape test to fail against the old request**

```ts
expect(generate).toHaveBeenCalledWith(expect.objectContaining({
  model,
  prompt: "Reply with exactly OK.",
  maxOutputTokens: 16,
  maxRetries: 0,
  providerOptions: { openai: { reasoningEffort: "none" } },
  abortSignal: expect.any(AbortSignal),
}))
expect(generate.mock.calls[0][0]).not.toHaveProperty("temperature")
expect(timeout).toHaveBeenCalledWith(10_000)
```

- [ ] **Step 2: Add failing diagnostic and redaction tests**

Construct `APICallError` with status 400, response header `x-request-id: req_test_123`, and body:

```json
{"error":{"message":"Unsupported parameter: temperature for sk-proj-secretvalue","type":"invalid_request_error","param":"temperature","code":"unsupported_parameter"}}
```

Assert the diagnostic contains status/code/type/param/request ID, replaces the key with `[REDACTED]`, contains no newline, and stays at or below 300 Unicode code points. Add malformed JSON and non-API-error cases that produce null diagnostic fields.

- [ ] **Step 3: Run provider tests and verify red state**

```bash
npx vitest run tests/agent/provider.test.ts
```

- [ ] **Step 4: Implement request options, parser, and sanitizer**

Use an allowlisted parser for `error.message`, `error.type`, `error.param`, and `error.code`. Read request ID case-insensitively from `APICallError.responseHeaders`. Redact with a bounded key-pattern replacement before truncation:

```ts
const OPENAI_KEY = /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{8,}\b/g
const oneLine = value.replace(/[\r\n\t]+/g, " ").replace(OPENAI_KEY, "[REDACTED]").trim()
return Array.from(oneLine).slice(0, 300).join("") || null
```

- [ ] **Step 5: Run tests and commit**

```bash
npx vitest run tests/agent/provider.test.ts tests/agent/model-catalog.test.ts
git add lib/agent/provider.ts lib/agent/types.ts tests/agent/provider.test.ts
git commit -m "fix: make OpenAI verification diagnostic"
```

---

### Task 8: Propagate verification diagnostics through the protected service and API

**Files:**
- Modify: `lib/agent/service.ts`
- Modify: `app/api/admin/agent/route.ts`
- Modify: `components/admin/agent-settings.tsx`
- Test: `tests/agent/service.test.ts`
- Test: `tests/agent/admin-api.test.ts`
- Test: `tests/components/agent-settings.test.tsx`

**Interfaces:**
- Consumes: `CredentialVerificationDiagnostic` from Task 7.
- Produces: authenticated error JSON `{ error: AgentServiceErrorCode, diagnostic?: CredentialVerificationDiagnostic }`.
- Does not persist diagnostics or include them in audit metadata.

- [ ] **Step 1: Add failing service and API propagation tests**

Create a verifier failure with `providerParam: "temperature"` and assert:

```ts
await expect(agent.configureCredential(input, actor)).rejects.toMatchObject({
  code: "verification_request_invalid",
  diagnostic: { statusCode: 400, providerParam: "temperature" },
})

expect(await response.json()).toEqual({
  error: "verification_request_invalid",
  diagnostic: expect.objectContaining({ statusCode: 400, providerParam: "temperature" }),
})
```

Also assert generic `Error` responses contain only `{ error: "unavailable" }`, and serialized bodies never contain the candidate API key.

- [ ] **Step 2: Run service/API tests and verify diagnostics are currently dropped**

```bash
npx vitest run tests/agent/service.test.ts tests/agent/admin-api.test.ts
```

- [ ] **Step 3: Add the service diagnostic field and protected response**

Extend `AgentServiceError` with `readonly diagnostic?: CredentialVerificationDiagnostic`. Copy diagnostics only when the cause is `CredentialVerificationError`. In `agentErrorResponse`, include `diagnostic` only for known verification errors and only after the existing Admin authorization path has succeeded.

- [ ] **Step 4: Render localized diagnostic details**

Parse the error response in `AgentSettings` as:

```ts
type AgentErrorPayload = {
  error?: string
  diagnostic?: CredentialVerificationDiagnostic
}
```

Show known fields in a `<details>` block labeled `OpenAI 오류 세부 정보` / `OpenAI error details`. Render only text nodes, never HTML. Include the request ID so support can correlate the call.

- [ ] **Step 5: Run the complete Agent suite and commit**

```bash
npx vitest run tests/agent tests/components/agent-settings.test.tsx
git add lib/agent app/api/admin/agent components/admin/agent-settings.tsx tests/agent tests/components/agent-settings.test.tsx
git commit -m "fix: expose safe OpenAI verification details"
```

---

### Task 9: Add browser regression coverage and run the release gate

**Files:**
- Create: `e2e/admin-stability.spec.ts`
- Create: `playwright.admin-stability.config.ts`
- Modify: `docs/agent-operations.md`

**Interfaces:**
- Verifies: Admin locale persistence, mobile layout, retired routes, and safe OpenAI error presentation.
- Documents: request-ID troubleshooting and the forward-only design-document migration.

- [ ] **Step 1: Add authenticated browser tests**

Use the signed local NextAuth cookie pattern from `e2e/markdown-guide-layout.spec.ts`. Keep this focused config database-free by testing the protected Markdown-guide route rather than `/admin/documents` or `/admin/agent`. At 390, 768, and 1440 pixels:

1. open `/admin/documents/markdown-guide` in Korean;
2. switch to English and assert the Admin navigation and guide-shell links update;
3. reload and assert English persists through `laf_locale=en`;
4. assert the guide does not overflow horizontally;
5. open `/design` and assert the static guide renders;
6. open `/design/retired-example` and assert a not-found response.

Keep Design-option and OpenAI diagnostic assertions in the component/API suites, where dependencies are injectable and no production database or provider call can occur.

- [ ] **Step 2: Run the browser tests and fix only discovered regressions**

Run:

```bash
LD_LIBRARY_PATH=/tmp/laflabs-pw-deps-20260829/root/usr/lib/x86_64-linux-gnu npx playwright test --config=playwright.admin-stability.config.ts
```

Expected: all three viewport projects pass with no horizontal document overflow.

- [ ] **Step 3: Update operations documentation**

Document:

- the exact Admin diagnostic fields and how to use an OpenAI request ID;
- that diagnostics are not stored;
- the credential test's 10-second timeout and no-retry behavior;
- the removal of database-backed design documents;
- the roll-forward-only deployment rule after enum migration.

- [ ] **Step 4: Run the full release gate**

Run:

```bash
npm test
```

Expected: typecheck, lint, all unit tests, and production build pass. Confirm the build route list contains `/design` and does not contain `/design/[slug]`.

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and only intended plan implementation changes before the final commit.

- [ ] **Step 5: Commit browser coverage and operations notes**

```bash
git add e2e/admin-stability.spec.ts playwright.admin-stability.config.ts docs/agent-operations.md
git commit -m "test: cover admin stability workflows"
```

- [ ] **Step 6: Request review before integration**

Use `superpowers:verification-before-completion`, then `superpowers:requesting-code-review`, address validated findings, rerun `npm test` and the focused Playwright config, and use `superpowers:finishing-a-development-branch` to offer PR creation.
