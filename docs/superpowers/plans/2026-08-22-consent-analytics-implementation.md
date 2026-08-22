# Consent and First-Party Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit cookie consent, consent-gated first-party analytics, withdrawal deletion, retention, GitHub organization-protected aggregate reporting, and no CMS changes to the existing LafLabs homepage.

**Architecture:** Keep the existing Next.js 16 App Router application as one deployment. Server Components read Neon PostgreSQL directly; Route Handlers accept consent, analytics batches, Auth.js callbacks, and Vercel Cron requests. A small client provider owns consent state and an allowlisted event queue, while a GitHub OAuth-protected server-rendered dashboard reads aggregate queries.

**Tech Stack:** Next.js 16.2.6, React 19.2.6, TypeScript 5.9, Auth.js (`next-auth`), GitHub OAuth, Neon PostgreSQL, Drizzle ORM/Kit with Neon HTTP, Zod, Vitest, Testing Library, Playwright, Vercel Cron.

**Spec:** `docs/superpowers/specs/2026-08-22-consent-analytics-design.md`

## Global Constraints

- Do not convert Laf ID, Laf Pay, LafDock, repositories, or any homepage content to database-managed records.
- Do not redesign or reorder existing homepage sections.
- Send and store no analytics event before explicit analytics consent.
- Store no source IP, full User-Agent, URL query, fragment, form value, precise location, pointer coordinate, or third-party identifier.
- Use only these event names: `page_view`, `product_click`, `github_click`, `contact_click`, `locale_change`, `consent_update`.
- Use `laf_consent` for the versioned preference and a signed `laf_visitor` token only after opt-in.
- Honor `DNT: 1` by resolving an analytics request to essential-only behavior.
- Delete the current visitor's raw events before completing withdrawal.
- Delete raw events after 90 days; retain no indefinite aggregate table in this release.
- Permit `/admin` only to active members of the GitHub organization in `ADMIN_GITHUB_ORG`, initially `laflabs-inc`.
- Analytics failures must never block navigation or break public homepage interactions.
- Public cookie copy requires legal review before production; do not label the implementation universally compliant.

---

## File Structure

### Foundation and database

- `drizzle.config.ts` — Drizzle migration configuration.
- `drizzle/` — generated, committed SQL migration and journal files.
- `lib/env.ts` — pure environment schemas plus lazy database, analytics, auth, and cron getters.
- `lib/db/schema.ts` — analytics and rate-window tables.
- `lib/db/index.ts` — lazily initialized Neon HTTP Drizzle client.

### Consent and analytics domain

- `lib/analytics/types.ts` — shared event and consent types.
- `lib/analytics/consent.ts` — versioned consent parsing and cookie definitions.
- `lib/analytics/identity.ts` — visitor token signing, verification, and HMAC hashing.
- `lib/analytics/normalize.ts` — pathname, referrer, locale, and device normalization.
- `lib/analytics/store.ts` — database operations and aggregate query interface.
- `lib/analytics/service.ts` — collection, withdrawal, and retention use cases.
- `lib/analytics/client.ts` — bounded browser event queue and transport.

### Consent UI and instrumentation

- `components/analytics/consent-provider.tsx` — client consent state and event delegation.
- `components/analytics/consent-panel.tsx` — bilingual first-visit/settings UI.
- `components/analytics/consent-panel.module.css` — square LafLabs consent styling.
- `app/layout.tsx` — server-derived initial consent and DNT state.
- `components/layout/site-footer.tsx` — cookie settings trigger and trackable links.
- `components/layout/site-header.tsx` — trackable locale, GitHub, and contact actions.
- `components/landing.tsx` — data attributes on product, GitHub, and contact CTAs.

### HTTP and scheduled boundaries

- `app/api/consent/route.ts` — set preference, create visitor, and withdraw.
- `app/api/analytics/events/route.ts` — consent-gated batch collection.
- `app/api/cron/analytics-retention/route.ts` — authenticated 90-day cleanup.
- `vercel.json` — once-daily retention schedule.

### Authentication and dashboard

- `lib/auth/github.ts` — isolated GitHub organization membership check.
- `auth.ts` — Auth.js GitHub provider and session policy.
- `types/next-auth.d.ts` — typed organization membership session fields.
- `app/api/auth/[...nextauth]/route.ts` — Auth.js handlers.
- `app/admin/layout.tsx` — shared no-index admin metadata and visual shell.
- `app/admin/sign-in/page.tsx` — LafLabs-styled public GitHub sign-in.
- `app/admin/(protected)/layout.tsx` — server-side authorization gate for protected admin routes.
- `app/admin/(protected)/page.tsx` — redirect to analytics.
- `app/admin/(protected)/analytics/page.tsx` — read-only reporting page at `/admin/analytics`.
- `app/admin/(protected)/analytics/error.tsx` — redacted retryable dashboard failure state.
- `app/admin/admin.module.css` — dashboard styling.
- `components/admin/analytics-dashboard.tsx` — metric, funnel, and breakdown rendering.

### Tests and operator documentation

- `vitest.config.ts` — unit/integration test configuration.
- `tests/setup.ts` — DOM cleanup and shared test setup.
- `tests/analytics/*.test.ts` — domain and service tests.
- `tests/components/consent-panel.test.tsx` — consent UI tests.
- `playwright.config.ts` — production-like browser test server.
- `e2e/consent-analytics.spec.ts` — consent and analytics browser flows.
- `.env.example` — non-secret environment contract.
- `docs/analytics-operations.md` — provisioning, migration, OAuth, retention, and verification runbook.

---

### Task 1: Test Harness and Analytics Database Foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/server-only.ts`
- Create: `lib/env.ts`
- Create: `lib/db/schema.ts`
- Create: `lib/db/index.ts`
- Create: `drizzle.config.ts`
- Create: `tests/analytics/env.test.ts`
- Create by `drizzle-kit generate --name analytics_foundation`: the generated migration and journal files under `drizzle/`

**Interfaces:**
- Produces: `parseServerEnv()`, `getDatabaseEnv()`, `getAnalyticsEnv()`, `getAuthEnv()`, and `getCronEnv()`.
- Produces: `analyticsEvents` and `analyticsRateWindows` Drizzle tables.
- Produces: `getDb()`, the lazily initialized Neon HTTP Drizzle client used by `lib/analytics/store.ts`.

- [ ] **Step 1: Install runtime and test dependencies**

Run:

```bash
npm install drizzle-orm @neondatabase/serverless next-auth zod
npm install --save-dev drizzle-kit vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "test": "npm run typecheck && npm run lint && npm run test:unit && npm run build"
  }
}
```

- [ ] **Step 2: Add the failing environment contract test**

Create `tests/analytics/env.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { parseServerEnv } from "@/lib/env"

describe("parseServerEnv", () => {
  it("requires analytics secrets and database URL", () => {
    expect(() => parseServerEnv({})).toThrow(/DATABASE_URL/)
  })

  it("returns an exact typed environment", () => {
    expect(parseServerEnv({
      DATABASE_URL: "postgresql://example.invalid/laflabs",
      ANALYTICS_HASH_SECRET: "a".repeat(32),
      AUTH_SECRET: "b".repeat(32),
      AUTH_GITHUB_ID: "client",
      AUTH_GITHUB_SECRET: "secret",
      ADMIN_GITHUB_ORG: "laflabs-inc",
      CRON_SECRET: "c".repeat(16),
    }).ADMIN_GITHUB_ORG).toBe("laflabs-inc")
  })
})
```

- [ ] **Step 3: Run the test and verify the missing module failure**

Run: `npm run test:unit -- tests/analytics/env.test.ts`

Expected: FAIL because `@/lib/env` does not exist.

- [ ] **Step 4: Implement environment validation and the schema**

Implement pure Zod parsing plus lazy per-domain getters:

```ts
import { z } from "zod"

const databaseSchema = z.object({ DATABASE_URL: z.string().url() })
const analyticsSchema = z.object({ ANALYTICS_HASH_SECRET: z.string().min(32) })
const authSchema = z.object({
  AUTH_SECRET: z.string().min(32),
  AUTH_GITHUB_ID: z.string().min(1),
  AUTH_GITHUB_SECRET: z.string().min(1),
  ADMIN_GITHUB_ORG: z.string().min(1).default("laflabs-inc"),
})
const cronSchema = z.object({ CRON_SECRET: z.string().min(16) })
const schema = databaseSchema.merge(analyticsSchema).merge(authSchema).merge(cronSchema)

export type ServerEnv = z.infer<typeof schema>
export const parseServerEnv = (input: Record<string, string | undefined>) => schema.parse(input)
export const getDatabaseEnv = () => databaseSchema.parse(process.env)
export const getAnalyticsEnv = () => analyticsSchema.parse(process.env)
export const getAuthEnv = () => authSchema.parse(process.env)
export const getCronEnv = () => cronSchema.parse(process.env)
```

Do not call any getter at module scope. `lib/db/index.ts` is server-only and calls only `getDatabaseEnv()` inside `createDb()`:

```ts
import "server-only"
import { drizzle } from "drizzle-orm/neon-http"
import { getDatabaseEnv } from "@/lib/env"
import * as schema from "@/lib/db/schema"

function createDb() {
  return drizzle(getDatabaseEnv().DATABASE_URL, { schema })
}
```

Define the database source of truth in `lib/db/schema.ts`:

```ts
import { index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"

export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull(),
  visitorHash: text("visitor_hash").notNull(),
  sessionHash: text("session_hash").notNull(),
  eventType: text("event_type").notNull(),
  pathname: text("pathname").notNull(),
  targetId: text("target_id"),
  locale: text("locale").notNull(),
  deviceCategory: text("device_category").notNull(),
  referrerHost: text("referrer_host"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("analytics_event_id_unique").on(table.eventId),
  index("analytics_received_at_idx").on(table.receivedAt),
  index("analytics_type_received_idx").on(table.eventType, table.receivedAt),
  index("analytics_visitor_idx").on(table.visitorHash),
])

export const analyticsRateWindows = pgTable("analytics_rate_windows", {
  visitorHash: text("visitor_hash").notNull(),
  minuteBucket: timestamp("minute_bucket", { withTimezone: true }).notNull(),
  eventCount: integer("event_count").default(0).notNull(),
}, (table) => [primaryKey({ columns: [table.visitorHash, table.minuteBucket] })])
```

Initialize Neon over HTTP only on the first runtime database operation so `next build` does not require production secrets:

```ts
import "server-only"
import { drizzle } from "drizzle-orm/neon-http"
import { getDatabaseEnv } from "@/lib/env"
import * as schema from "@/lib/db/schema"

function createDb() {
  return drizzle(getDatabaseEnv().DATABASE_URL, { schema })
}

let client: ReturnType<typeof createDb> | undefined

export function getDb() {
  client ??= createDb()
  return client
}
```

Configure Drizzle with `dialect: "postgresql"`, `schema: "./lib/db/schema.ts"`, and `out: "./drizzle"`.

Configure Vitest with the project alias and DOM setup:

```ts
import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "tests/server-only.ts"),
    },
  },
  test: { environment: "jsdom", setupFiles: ["./tests/setup.ts"] },
})
```

`tests/setup.ts` imports `@testing-library/jest-dom/vitest` and calls Testing Library `cleanup()` in `afterEach`. `tests/server-only.ts` is an empty test-only module so Vitest can exercise server utilities without weakening the production `server-only` boundary.

- [ ] **Step 5: Generate and inspect the migration**

Run:

```bash
npm run db:generate -- --name analytics_foundation
rg -n "CREATE TABLE|CREATE INDEX|UNIQUE" drizzle
```

Expected: two tables, the event ID unique constraint, and the documented indexes are present. Do not apply the migration to production in this task.

- [ ] **Step 6: Run focused and repository checks**

Run:

```bash
npm run test:unit -- tests/analytics/env.test.ts
npm run typecheck
npm run lint
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/setup.ts tests/server-only.ts lib/env.ts lib/db drizzle.config.ts drizzle tests/analytics/env.test.ts
git commit -m "feat: add analytics database foundation"
```

---

### Task 2: Consent Domain and Signed Visitor Identity

**Files:**
- Create: `lib/analytics/types.ts`
- Create: `lib/analytics/consent.ts`
- Create: `lib/analytics/identity.ts`
- Create: `tests/analytics/consent.test.ts`
- Create: `tests/analytics/identity.test.ts`

**Interfaces:**
- Produces: `ConsentChoice = "essential" | "analytics"`.
- Produces: `ConsentState = "unknown" | ConsentChoice`.
- Produces: `CONSENT_COOKIE`, `VISITOR_COOKIE`, `CONSENT_POLICY_VERSION`, `parseConsentCookie()`, and `consentCookieValue()`.
- Produces: `createVisitorToken()`, `verifyVisitorToken()`, and `hashAnalyticsId()`.

- [ ] **Step 1: Write failing consent and identity tests**

Test exact behavior:

```ts
expect(parseConsentCookie("1:analytics")).toEqual({ version: "1", choice: "analytics" })
expect(parseConsentCookie("0:analytics")).toBeNull()
expect(parseConsentCookie("garbage")).toBeNull()

const token = createVisitorToken("visitor-id", secret)
expect(verifyVisitorToken(token, secret)).toBe("visitor-id")
expect(verifyVisitorToken(`${token}x`, secret)).toBeNull()
expect(hashAnalyticsId("visitor-id", secret)).not.toContain("visitor-id")
expect(hashAnalyticsId("visitor-id", secret)).toBe(hashAnalyticsId("visitor-id", secret))
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:unit -- tests/analytics/consent.test.ts tests/analytics/identity.test.ts`

Expected: FAIL because analytics modules do not exist.

- [ ] **Step 3: Implement minimal consent primitives**

Use exact constants:

```ts
export const CONSENT_POLICY_VERSION = "1"
export const CONSENT_COOKIE = "laf_consent"
export const VISITOR_COOKIE = "laf_visitor"
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 180
```

Return `null` for malformed, unknown-choice, or wrong-version cookie values. Export one cookie-options factory returning `httpOnly: true`, `sameSite: "lax"`, `secure: process.env.NODE_ENV === "production"`, `path: "/"`, and the exact max age.

- [ ] **Step 4: Implement visitor signing and hashing**

Use Node `createHmac("sha256", secret)` and `timingSafeEqual`. The visitor token format is `<base64url UUID>.<base64url signature>`. Reject missing segments, invalid base64, invalid signature length, non-UUID payloads, and signatures that fail constant-time comparison.

Use a separate domain separator for database identifiers:

```ts
createHmac("sha256", secret).update(`analytics-id:${value}`).digest("hex")
```

- [ ] **Step 5: Run focused tests**

Run: `npm run test:unit -- tests/analytics/consent.test.ts tests/analytics/identity.test.ts`

Expected: PASS.

- [ ] **Step 6: Run checks and commit**

```bash
npm run typecheck
npm run lint
git diff --check
git add lib/analytics/types.ts lib/analytics/consent.ts lib/analytics/identity.ts tests/analytics/consent.test.ts tests/analytics/identity.test.ts
git commit -m "feat: define consent and visitor identity"
```

---

### Task 3: Consent API, Provider, Panel, and Footer Settings

**Files:**
- Create: `app/api/consent/route.ts`
- Create: `components/analytics/consent-provider.tsx`
- Create: `components/analytics/consent-panel.tsx`
- Create: `components/analytics/consent-panel.module.css`
- Create: `tests/components/consent-panel.test.tsx`
- Create: `tests/analytics/consent-service.test.ts`
- Create: `lib/analytics/store.ts`
- Create: `lib/analytics/service.ts`
- Modify: `app/layout.tsx`
- Modify: `components/layout/site-footer.tsx`
- Modify: `lib/content.ts`

**Interfaces:**
- Consumes: consent constants and signed visitor identity from Task 2.
- Produces: `useConsent(): { state; openSettings; choose; pending; error }`.
- Produces: `ConsentProvider` wrapping public content.
- Produces: `POST /api/consent` accepting `{ choice: ConsentChoice }`.
- Produces: `deleteVisitorEventsByToken()` backed by the analytics database.

- [ ] **Step 1: Write the failing consent service and panel tests**

Cover Korean and English labels, equal choice controls, settings mode, keyboard buttons, pending state, and error state:

```tsx
render(<ConsentPanel locale="ko" open pending={false} error={null} onChoose={choose} onClose={close} />)
await user.click(screen.getByRole("button", { name: "필수만 사용" }))
expect(choose).toHaveBeenCalledWith("essential")
expect(screen.getByRole("button", { name: "분석 허용" })).toBeEnabled()
```

In `tests/analytics/consent-service.test.ts`, use a fake store and verify deletion ordering plus DNT resolution:

```ts
await expect(applyConsentChoice({ requested: "analytics", dnt: true, visitorToken: null }, fakeStore))
  .resolves.toMatchObject({ choice: "essential", dntHonored: true, createVisitor: false })

await applyConsentChoice({ requested: "essential", dnt: false, visitorToken }, fakeStore)
expect(fakeStore.deletedVisitorHashes).toHaveLength(1)
```

Make the fake throw on deletion and expect `applyConsentChoice()` to reject with `WithdrawalFailedError`, proving the caller cannot clear cookies after a failed deletion.

- [ ] **Step 2: Run the panel test and verify failure**

Run: `npm run test:unit -- tests/analytics/consent-service.test.ts tests/components/consent-panel.test.tsx`

Expected: FAIL because the consent service and `ConsentPanel` do not exist.

- [ ] **Step 3: Implement the consent endpoint**

Parse the body with Zod. Read `DNT` from request headers. Add the minimal store operation `deleteVisitorEvents(visitorHash)`, implement `deleteVisitorEventsByToken()` using `getDb()`, token verification, and HMAC hashing, and implement the tested `applyConsentChoice()` orchestration. For `essential`, delete stored analytics before clearing the visitor cookie:

```ts
if (choice === "essential" && visitorToken) {
  const deleted = await deleteVisitorEventsByToken(visitorToken)
  if (!deleted) return Response.json({ error: "withdrawal_failed" }, { status: 503 })
}
```

For `DNT: 1`, resolve `analytics` to `essential`. Set cookies only after deletion succeeds. Return `{ choice, dntHonored }`. Reject cross-origin POST requests by comparing `Origin` to the request URL origin when the header is present.

- [ ] **Step 4: Implement provider and visual panel**

`app/layout.tsx` already reads cookies and headers. Extend it to parse `laf_consent`, detect `DNT: 1`, and pass `initialState`/`dnt` into `ConsentProvider` inside `LocaleProvider`.

The panel copy is exact and bilingual:

```ts
const consentCopy = {
  ko: {
    title: "분석 쿠키를 선택해 주세요",
    body: "사이트를 개선하기 위해 익명 사용 통계를 수집합니다. 허용 전에는 분석 정보를 보내지 않습니다.",
    essential: "필수만 사용",
    analytics: "분석 허용",
    settings: "쿠키 설정",
    details: "수집 항목 보기",
  },
  en: {
    title: "Choose your analytics preference",
    body: "We use anonymous usage statistics to improve the site. No analytics data is sent before you allow it.",
    essential: "Essential only",
    analytics: "Allow analytics",
    settings: "Cookie settings",
    details: "See what is collected",
  },
} as const
```

Details list the six event names in plain language and explicitly state the 90-day retention. The initial panel cannot be closed without a choice; the footer-opened settings panel can close without changing the current choice.

- [ ] **Step 5: Add the footer settings trigger**

Add a semantic `<button type="button">` beside the existing footer legal/location row. It calls `openSettings()` and follows the footer typography without pretending to be an external link.

- [ ] **Step 6: Run component and static checks**

```bash
npm run test:unit -- tests/components/consent-panel.test.tsx
npm run test:unit -- tests/analytics/consent-service.test.ts
npm run typecheck
npm run lint
git diff --check
```

Expected: all commands exit 0. Withdrawal deletion has a real database-backed boundary and no temporary implementation.

- [ ] **Step 7: Commit**

```bash
git add app/api/consent app/layout.tsx components/analytics components/layout/site-footer.tsx lib/content.ts lib/analytics/store.ts lib/analytics/service.ts tests/analytics/consent-service.test.ts tests/components/consent-panel.test.tsx
git commit -m "feat: add explicit analytics consent UI"
```

---

### Task 4: Event Validation, Storage, Collection, and Withdrawal

**Files:**
- Create: `lib/analytics/normalize.ts`
- Modify: `lib/analytics/store.ts`
- Modify: `lib/analytics/service.ts`
- Create: `app/api/analytics/events/route.ts`
- Create: `tests/analytics/normalize.test.ts`
- Create: `tests/analytics/service.test.ts`
- Modify: `app/api/consent/route.ts`

**Interfaces:**
- Consumes: `db`, analytics schema, consent parser, and identity functions.
- Produces: `AnalyticsEventInputSchema`, `AnalyticsBatchSchema`, and `AnalyticsEventType`.
- Produces: `AnalyticsStore` interface and production `analyticsStore`.
- Produces: `collectAnalyticsBatch()`, `deleteVisitorEventsByToken()`, and `deleteExpiredAnalytics()`.
- Produces: `POST /api/analytics/events`.

- [ ] **Step 1: Write failing normalization and service tests**

Use an in-memory fake implementing `AnalyticsStore`. Test exact privacy behavior:

```ts
expect(normalizePath("/?email=a@example.com#x")).toBe("/")
expect(normalizeReferrer("https://github.com/laflabs-inc/lafetch?q=x")).toBe("github.com")
expect(normalizeLocale("fr")).toBe("en")

const result = await collectAnalyticsBatch(validBatch, requestContext, fakeStore)
expect(result.accepted).toBe(1)
expect(fakeStore.events[0]).not.toHaveProperty("ip")
expect(fakeStore.events[0]).not.toHaveProperty("userAgent")
```

Also test an unknown event, invalid target, more than 20 events, stale timestamp, duplicate ID, exhausted rate window, no consent, invalid visitor signature, and store failure.

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `npm run test:unit -- tests/analytics/normalize.test.ts tests/analytics/service.test.ts`

Expected: FAIL because normalization and service modules do not exist.

- [ ] **Step 3: Implement strict schemas and normalization**

Define:

```ts
export const eventTypes = [
  "page_view", "product_click", "github_click",
  "contact_click", "locale_change", "consent_update",
] as const

export const AnalyticsEventInputSchema = z.object({
  eventId: z.string().uuid(),
  sessionId: z.string().uuid(),
  type: z.enum(eventTypes),
  pathname: z.string().max(256),
  targetId: z.string().max(80).nullable(),
  locale: z.enum(["ko", "en"]),
  occurredAt: z.string().datetime(),
}).strict()
```

Use a discriminated refinement so only valid targets are accepted: project IDs from `products`, repository names plus `laflabs-inc` for GitHub, `email` for contact, `ko|en` for locale, `analytics` for consent, and `null` for page views.

- [ ] **Step 4: Implement store and collection service**

`AnalyticsStore` exposes exact methods:

```ts
export interface AnalyticsStore {
  consumeRateWindow(visitorHash: string, minute: Date, amount: number): Promise<boolean>
  insertEvents(events: StoredAnalyticsEvent[]): Promise<number>
  deleteVisitorEvents(visitorHash: string): Promise<void>
  deleteBefore(cutoff: Date): Promise<{ events: number; windows: number }>
}
```

Use an atomic PostgreSQL upsert for a maximum of 60 accepted events per visitor per minute. Insert with `onConflictDoNothing` on `event_id`. Derive device category from request headers without persisting the raw header. Clamp accepted event time to server time if it differs by more than five minutes.

`deleteVisitorEventsByToken()` verifies the signature, computes the visitor hash, deletes matching events, and returns `false` on invalid token or database failure without logging the token.
Operational errors may log an error code and request timestamp only; never log cookie values, visitor/session identifiers, OAuth tokens, request bodies, or raw database errors returned to the client.

- [ ] **Step 5: Implement the event Route Handler**

Set a 16 KiB body limit using `content-length` as an early check, then read text, check `Buffer.byteLength(raw, "utf8") <= 16 * 1024`, and only then parse JSON. Read and validate both HttpOnly cookies with `await cookies()`. Return `204` without a write when consent or visitor identity is absent/invalid. Return `400` for malformed consented payloads, `429` for exhausted rate windows, `204` for accepted or duplicate events, and `503` for store unavailability.

Reuse Task 3's real withdrawal operation and extend its store with collection, rate-window, and retention methods. Reject cross-origin POST requests before parsing the body.

- [ ] **Step 6: Run focused and repository checks**

```bash
npm run test:unit -- tests/analytics/normalize.test.ts tests/analytics/service.test.ts
npm run typecheck
npm run lint
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add lib/analytics app/api/analytics tests/analytics app/api/consent/route.ts
git commit -m "feat: collect consented first-party analytics"
```

---

### Task 5: Browser Event Queue and Existing CTA Instrumentation

**Files:**
- Create: `lib/analytics/client.ts`
- Create: `tests/analytics/client.test.ts`
- Modify: `components/analytics/consent-provider.tsx`
- Modify: `components/layout/site-header.tsx`
- Modify: `components/layout/site-footer.tsx`
- Modify: `components/landing.tsx`

**Interfaces:**
- Consumes: event contract and `ConsentProvider` state.
- Produces: `createAnalyticsClient({ locale, pathname }): AnalyticsClient`.
- Produces: `AnalyticsClient.track(type, targetId)`, `.setLocale(locale)`, `.flush()`, and `.stop()`.
- Consumes DOM attributes `data-analytics-event` and `data-analytics-target`.

- [ ] **Step 1: Write failing queue tests**

Use fake timers and mocked `navigator.sendBeacon`/`fetch`. Verify:

```ts
client.track("github_click", "lafetch")
expect(client.size()).toBe(1)
await client.flush()
expect(sendBeacon).toHaveBeenCalledOnce()
expect(JSON.parse(blobText).events).toHaveLength(1)
```

Also verify a 20-event maximum batch, one bounded retry, duplicate page-view suppression, `setLocale()` affecting later events without creating a second page view, `stop()` clearing queued events, no query strings in path, session UUID persistence in `sessionStorage`, and `fetch(..., { keepalive: true })` fallback.

- [ ] **Step 2: Run the client test and verify failure**

Run: `npm run test:unit -- tests/analytics/client.test.ts`

Expected: FAIL because the client module does not exist.

- [ ] **Step 3: Implement the bounded analytics client**

The client keeps no global history. It queues at most 20 events, flushes after five events or five seconds, and flushes on `visibilitychange` when the document becomes hidden. Generate a session UUID once per tab in `sessionStorage`. Build payloads only from allowlisted method arguments.

On a failed request, retry once after one second while the page remains active. Drop the batch afterward. Do not throw into the caller.

- [ ] **Step 4: Connect the provider to the queue**

When consent becomes `analytics`, create the client, enqueue one `consent_update` only on the transition from unknown/essential to analytics, enqueue one `page_view`, and install delegated click handling:

```ts
const target = (event.target as Element).closest<HTMLElement>("[data-analytics-event]")
if (!target) return
client.track(
  target.dataset.analyticsEvent as AnalyticsEventType,
  target.dataset.analyticsTarget ?? null,
)
```

When state leaves analytics, call `stop()` before updating visible state. Never mount or call the client while `dnt` is true.
When the existing locale provider changes language, call `client.setLocale(locale)` on the same instance rather than recreating the client or emitting another page view.

- [ ] **Step 5: Mark existing interactions without changing layout**

Add exact attributes:

```tsx
data-analytics-event="github_click"
data-analytics-target="lafetch"
```

Apply them to organization/repository GitHub links, contact email links, locale buttons, and any product link that has an `href`. Locale buttons use target `ko` or `en`; email uses `email`; organization GitHub uses `laflabs-inc`.

- [ ] **Step 6: Run focused and full checks**

```bash
npm run test:unit -- tests/analytics/client.test.ts
npm run test:unit
npm run typecheck
npm run lint
git diff --check
```

Expected: all commands exit 0 and rendered markup is unchanged apart from data attributes and cookie settings control.

- [ ] **Step 7: Commit**

```bash
git add lib/analytics/client.ts tests/analytics/client.test.ts components/analytics/consent-provider.tsx components/layout components/landing.tsx
git commit -m "feat: instrument consented homepage events"
```

---

### Task 6: Idempotent 90-Day Retention Job

**Files:**
- Create: `app/api/cron/analytics-retention/route.ts`
- Create: `tests/analytics/retention.test.ts`
- Create: `vercel.json`
- Modify: `lib/analytics/service.ts`

**Interfaces:**
- Consumes: `deleteExpiredAnalytics(now, store)`.
- Produces: authenticated `GET /api/cron/analytics-retention`.

- [ ] **Step 1: Write failing retention tests**

Test the cutoff and authentication boundary:

```ts
await deleteExpiredAnalytics(new Date("2026-08-22T00:00:00Z"), fakeStore)
expect(fakeStore.cutoff.toISOString()).toBe("2026-05-24T00:00:00.000Z")
```

Route tests must expect `401` for no/mismatched bearer secret and `200` with `{ events, windows }` for a valid secret.

- [ ] **Step 2: Run the test and verify failure**

Run: `npm run test:unit -- tests/analytics/retention.test.ts`

Expected: FAIL because the retention route/service does not exist.

- [ ] **Step 3: Implement idempotent deletion and protected route**

Compute the cutoff from exactly `90 * 24 * 60 * 60 * 1000`. Delete events and old minute windows with `< cutoff`; repeated calls return zero after the first run. Compare `Authorization` to `Bearer ${CRON_SECRET}` and never accept a query-string secret.

- [ ] **Step 4: Add the daily UTC schedule**

Create `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [{ "path": "/api/cron/analytics-retention", "schedule": "17 3 * * *" }]
}
```

- [ ] **Step 5: Verify and commit**

```bash
npm run test:unit -- tests/analytics/retention.test.ts
npm run typecheck
npm run lint
git diff --check
git add app/api/cron lib/analytics/service.ts tests/analytics/retention.test.ts vercel.json
git commit -m "feat: expire analytics after ninety days"
```

---

### Task 7: GitHub Organization-Protected Admin Authentication

**Files:**
- Create: `auth.ts`
- Create: `lib/auth/github.ts`
- Create: `types/next-auth.d.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/sign-in/page.tsx`
- Create: `app/admin/(protected)/layout.tsx`
- Create: `app/admin/(protected)/page.tsx`
- Create: `app/admin/admin.module.css`
- Create: `tests/auth/github-membership.test.ts`

**Interfaces:**
- Consumes: Auth.js environment from `getAuthEnv()` at request/callback time.
- Produces: `auth`, `handlers`, `signIn`, and `signOut` from root `auth.ts`.
- Produces from `lib/auth/github.ts`: `checkGitHubOrgMembership(accessToken, org): Promise<boolean>`.
- Produces: session field `user.orgMember: boolean`.

- [ ] **Step 1: Write the failing membership tests**

Mock `fetch` and test active, pending, unauthorized, and unavailable responses:

```ts
fetchMock.mockResolvedValue(jsonResponse({ state: "active" }, 200))
await expect(checkGitHubOrgMembership("token", "laflabs-inc")).resolves.toBe(true)

fetchMock.mockResolvedValue(jsonResponse({ state: "pending" }, 200))
await expect(checkGitHubOrgMembership("token", "laflabs-inc")).resolves.toBe(false)
```

Expect `false` for 401, 403, 404, timeout, and network failure. Verify the token is sent only in the Authorization header and never included in thrown/logged text.

- [ ] **Step 2: Run the auth test and verify failure**

Run: `npm run test:unit -- tests/auth/github-membership.test.ts`

Expected: FAIL because `lib/auth/github.ts` does not exist.

- [ ] **Step 3: Implement Auth.js configuration**

Use the official GitHub provider with `read:user read:org`, JWT sessions, eight-hour max age, and a 30-minute organization revalidation interval:

```ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub({ authorization: { params: { scope: "read:user read:org" } } })],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/sign-in" },
  callbacks: {
    async signIn({ account }) {
      return Boolean(account?.access_token) && checkGitHubOrgMembership(
        account.access_token,
        process.env.ADMIN_GITHUB_ORG ?? "laflabs-inc",
      )
    },
    async jwt({ token, account }) {
      return refreshMembershipToken(token, account?.access_token)
    },
    session({ session, token }) {
      session.user.orgMember = token.orgMember === true
      return session
    },
  },
})
```

Implement the isolated fetch and response parsing in `lib/auth/github.ts`. Implement `refreshMembershipToken(token, newAccessToken?)` in `auth.ts`. On initial sign-in it records the token, verifies membership, and stores `membershipCheckedAt`. On later calls it reuses the previous result for at most 30 minutes, then rechecks. At sign-in, deny access unless the membership endpoint returns `state: "active"`. Store the OAuth token only inside the encrypted server session token, never in the exposed session object. On a periodic verification failure set `orgMember=false`; do not retain access on error.

- [ ] **Step 4: Add handlers and admin authorization gate**

Export `{ GET, POST } = handlers`. Put `robots: { index: false, follow: false }` metadata and the shared visual shell in `app/admin/layout.tsx`, but do not require authentication there because it also wraps the sign-in page. In `app/admin/(protected)/layout.tsx`, call `await auth()` and redirect unauthenticated/non-member users to `/admin/sign-in`.

`app/admin/(protected)/page.tsx` redirects verified users to `/admin/analytics`. Route-group names do not appear in the URL. The sign-in page calls the server `signIn("github", { redirectTo: "/admin/analytics" })` action and contains no client OAuth code.

- [ ] **Step 5: Run focused and full checks**

```bash
npm run test:unit -- tests/auth/github-membership.test.ts
npm run typecheck
npm run lint
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add auth.ts types app/api/auth app/admin tests/auth
git commit -m "feat: protect analytics with GitHub organization auth"
```

---

### Task 8: Read-Only Analytics Dashboard

**Files:**
- Modify: `lib/analytics/store.ts`
- Create: `components/admin/analytics-dashboard.tsx`
- Create: `app/admin/(protected)/analytics/page.tsx`
- Create: `app/admin/(protected)/analytics/error.tsx`
- Modify: `app/admin/admin.module.css`
- Create: `tests/analytics/dashboard.test.ts`
- Create: `tests/components/analytics-dashboard.test.tsx`

**Interfaces:**
- Produces: `AnalyticsRange = 7 | 30 | 90`.
- Produces: `AnalyticsSummary` with totals, funnel, locale, device, referrer, product, and GitHub rows.
- Produces: `getAnalyticsSummary(range, now): Promise<AnalyticsSummary>`.
- Consumes: verified admin layout session from Task 7.

- [ ] **Step 1: Write failing aggregate and rendering tests**

Define the exact result shape in the test:

```ts
const summary: AnalyticsSummary = {
  rangeDays: 30,
  consentedVisitors: 12,
  pageViews: 30,
  productClicks: 7,
  githubClicks: 4,
  contactClicks: 2,
  funnel: { pageToProduct: 0.5833, productToContact: 0.2857 },
  locales: [{ key: "ko", count: 20 }, { key: "en", count: 10 }],
  devices: [{ key: "mobile", count: 18 }, { key: "desktop", count: 12 }],
  referrers: [{ key: "github.com", count: 5 }],
  products: [{ key: "laf-id", count: 7 }],
  githubTargets: [{ key: "lafetch", count: 4 }],
}
```

Test zero-denominator funnel results as `0`, unknown query range falling back to 30, and empty arrays rendering an explanatory empty state.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test:unit -- tests/analytics/dashboard.test.ts tests/components/analytics-dashboard.test.tsx`

Expected: FAIL because aggregate query and dashboard components do not exist.

- [ ] **Step 3: Implement aggregate queries**

Query only the selected retained window. Count unique `visitor_hash` for consented visitors. Calculate funnel stages with distinct visitors who emitted the relevant events, not raw click counts. Return only the top 10 referrers and all known project/GitHub targets. Do not expose visitor hashes or event rows to the page component.

Validate `searchParams.range` against `7|30|90`; default to 30. Capture one `now` at the page boundary so all queries share an identical cutoff. Export `dynamic = "force-dynamic"` from the page and do not cache authenticated aggregate results.

- [ ] **Step 4: Implement the server-rendered dashboard**

Render:

- four metric cells for consented visitors, page views, product clicks, and contact clicks;
- a three-stage page → product → contact funnel;
- locale and device bars;
- referrer, product, and GitHub target tables;
- 7/30/90-day navigation using ordinary links; and
- a clear `consented traffic only` note.

Use CSS grids, square borders, the current blue/ink/paper variables, and no charting dependency. The dashboard must work without client JavaScript.

Add `error.tsx` as the only client component in this route. It displays a redacted `통계를 불러오지 못했습니다 / Unable to load analytics` message and calls the provided `reset()` retry callback; it never renders an exception message or database detail.

- [ ] **Step 5: Run focused and repository checks**

```bash
npm run test:unit -- tests/analytics/dashboard.test.ts tests/components/analytics-dashboard.test.tsx
npm run test:unit
npm run typecheck
npm run lint
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add lib/analytics/store.ts components/admin 'app/admin/(protected)/analytics' app/admin/admin.module.css tests/analytics/dashboard.test.ts tests/components/analytics-dashboard.test.tsx
git commit -m "feat: add consented analytics dashboard"
```

---

### Task 9: Browser Regression Coverage and Production Runbook

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/consent-analytics.spec.ts`
- Create: `.env.example`
- Create: `docs/analytics-operations.md`
- Modify: `README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: all previous public, API, authentication, and dashboard behavior.
- Produces: reproducible local/CI browser verification and production provisioning instructions.

- [ ] **Step 1: Configure a production-like Playwright server**

Use `webServer` with `npm run dev -- --port 3200` for fast local iteration and `baseURL: "http://127.0.0.1:3200"`. Run Chromium at desktop `1440×1000` and mobile `390×844`. Keep retries at zero locally and one in CI.

Use an isolated test database URL supplied as `TEST_DATABASE_URL`; the Playwright setup must refuse to run if it equals `DATABASE_URL` or contains the configured production hostname. Pass it to the web server explicitly with `env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }`.

- [ ] **Step 2: Write the end-to-end tests before final verification**

Start with a complete pre-consent assertion:

```ts
test("first visit sends no analytics before a choice", async ({ page }) => {
  const analyticsRequests: string[] = []
  page.on("request", (request) => {
    if (request.url().includes("/api/analytics/events")) analyticsRequests.push(request.url())
  })
  await page.goto("/")
  await expect(page.getByRole("button", { name: /필수만 사용|Essential only/ })).toBeVisible()
  await page.waitForTimeout(1_000)
  expect(analyticsRequests).toEqual([])
})
```

Add seven more named tests with concrete assertions: essential-only keeps both the request list empty and `laf_visitor` absent; allow-analytics creates both cookies and one event request; `DNT: 1` resolves an analytics choice to essential and creates no visitor cookie; footer withdrawal clears `laf_visitor` and removes the seeded visitor rows; locale change translates the panel while `laf_consent` remains; a forced 503 from the analytics endpoint still allows product/GitHub/contact/locale/scroll interactions; and `/admin/analytics` redirects an unauthenticated browser to `/admin/sign-in`.

Use request interception to assert zero `/api/analytics/events` calls before consent. For database assertions, query only the isolated test database and delete test visitor rows in `afterEach`.

- [ ] **Step 3: Run E2E tests and fix only observed failures**

Run:

```bash
npx playwright install chromium
DATABASE_URL="$TEST_DATABASE_URL" npm run db:migrate
npm run test:e2e
```

Expected: all named tests pass on desktop and mobile. If GitHub OAuth cannot run in local CI, test the protected redirect in E2E and keep active-member callback coverage in Task 7's integration tests.

- [ ] **Step 4: Add exact environment and operator documentation**

`.env.example` lists names with empty values only:

```dotenv
DATABASE_URL=
TEST_DATABASE_URL=
ANALYTICS_HASH_SECRET=
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
ADMIN_GITHUB_ORG=laflabs-inc
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=https://laflabs.co
```

`docs/analytics-operations.md` documents, in order:

1. Create/link Neon through the Vercel Marketplace.
2. Pull environment variables locally.
3. Generate separate 32-byte analytics/auth secrets and a 16-byte-or-longer cron secret.
4. Register the GitHub OAuth callback `https://laflabs.co/api/auth/callback/github` and the local callback.
5. Set `ADMIN_GITHUB_ORG=laflabs-inc`.
6. Run `npm run db:migrate` against preview first, then production.
7. Deploy and inspect Secure/HttpOnly/SameSite cookie flags.
8. Verify no analytics request before opt-in.
9. Verify member/non-member admin access.
10. Invoke the retention endpoint with the bearer secret in preview and confirm idempotent deletion.
11. Obtain legal review for the consent/privacy copy before enabling production collection.

- [ ] **Step 5: Run the complete verification suite**

Run fresh:

```bash
npm test
npm run test:e2e
git diff --check
```

Expected: typecheck, lint, all unit/integration tests, production build, desktop/mobile browser tests, and diff check exit 0.

- [ ] **Step 6: Review the final browser output**

Capture and inspect:

```bash
npx playwright screenshot --viewport-size="1440,1000" http://127.0.0.1:3200 .impeccable/review/consent-desktop.png
npx playwright screenshot --viewport-size="390,844" http://127.0.0.1:3200 .impeccable/review/consent-mobile.png
```

Confirm the consent panel shares the common desktop/mobile content axes, does not obscure the locale control, leaves the page scrollable, and exposes both choices without scrolling.

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts e2e .env.example docs/analytics-operations.md README.md package.json package-lock.json
git commit -m "test: verify consent analytics flows"
```

---

## Spec Coverage Check

| Spec requirement | Implemented by |
|---|---|
| Non-blocking bilingual consent and footer settings | Task 3 |
| No collection before opt-in and DNT behavior | Tasks 2–5 |
| Signed visitor identity and HMAC-only storage | Tasks 2 and 4 |
| Allowlisted, minimized event collection | Tasks 4 and 5 |
| Withdrawal deletion before cookie clearing | Tasks 3 and 4 |
| 90-day retention | Task 6 |
| GitHub organization authentication | Task 7 |
| Read-only aggregate dashboard | Task 8 |
| Public-site failure isolation | Tasks 4, 5, and 9 |
| Desktop/mobile, accessibility, and regression verification | Tasks 3 and 9 |
| Vercel, Neon, OAuth, migration, and legal-review runbook | Task 9 |
| No CMS or homepage restructuring | Global Constraints and Tasks 3/5 |

## Implementation Completion Gate

Do not call the feature complete until all nine task commits exist and the following fresh evidence is recorded:

```bash
npm test
npm run test:e2e
git status --short
```

Expected: both test commands exit 0 and `git status --short` is empty apart from explicitly documented local-only review artifacts.
