# Admin Workspace PR A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the shared LafLabs Admin workspace shell and adopt it across sign-in, document-list, and category-management surfaces without changing business behavior.

**Architecture:** A typed navigation model drives one responsive client workspace rendered inside the authenticated server layout. Thin Admin page-layout components compose existing LafLabs Core UI primitives; document and category features retain their current service, URL, and mutation contracts.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Radix-backed LafLabs Core UI, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-10-12-admin-workspace-design.md`

## Global Constraints

- Read `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`, `04-linking-and-navigating.md`, `05-server-and-client-components.md`, `10-error-handling.md`, `11-css.md`, `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`, and `error.md` before editing App Router code.
- Do not add dependencies, database migrations, APIs, dashboard metrics, or environment variables.
- Preserve all existing document, category, authentication, locale, URL-query, and mutation payload behavior.
- Reuse existing LafLabs Core UI primitives; new Admin components may own layout only.
- Keep `/admin` redirecting to `/admin/documents` and keep sign-in outside the authenticated workspace.
- Support Korean and English, keyboard navigation, reduced motion, 44px touch targets, and no page-level horizontal overflow at 390px.
- Keep the official logo, paper background, navy ink, cobalt active/focus states, hard edges, mono metadata, and restrained rules.

## Review Focus

- Nested routes such as new, detail, categories, and Markdown guide keep Documents active while Categories is current only on its exact subtree; Task 1 pins route matching.
- Opening and dismissing mobile navigation by trigger, Escape, and destination selection restores focus and does not leave the page locked; Task 2 pins the interaction.
- Long Korean/English labels and actions reflow without clipping or horizontal page overflow at 390px; Tasks 2, 3, and 6 pin responsive structure and visual verification.
- Sign-in never renders authenticated navigation, while protected routes still call `requireAdmin()` before workspace content; Tasks 2 and 6 pin the boundary.
- Category activation/deactivation keeps its exact PATCH payload and requires an accessible confirmation without `window.confirm`; Task 5 pins the mutation and AlertDialog flow.

---

### Task 1: Typed Admin navigation model and localized hierarchy

**Files:**
- Create: `lib/admin/navigation.ts`
- Modify: `lib/admin/i18n.ts`
- Create: `tests/admin/navigation.test.ts`
- Modify: `tests/admin/i18n.test.ts`

**Interfaces:**
- Consumes: existing `adminCopy` locale shape and current Admin route paths.
- Produces: `AdminNavItemId`, `AdminNavGroupId`, `AdminNavItem`, `AdminNavGroup`, `adminNavigation`, `activeAdminNavItem(pathname: string): AdminNavItemId`, and localized `nav.groups`, `nav.openMenu`, `nav.closeMenu`, `nav.publicSite`, and `nav.currentSection` strings.

- [ ] **Step 1: Write failing navigation-model tests**

Assert that:

- navigation groups are ordered Content, Operations, System;
- Documents, Categories, Assets, Analytics, and Agent keep their current href values;
- Categories declares Documents as its parent;
- `/admin/documents`, `/admin/documents/new`, `/admin/documents/<uuid>`, and `/admin/documents/markdown-guide` resolve to Documents;
- `/admin/documents/categories` and its trailing-slash form resolve to Categories;
- Assets, Analytics, and Agent resolve only to their matching sections;
- unknown or sign-in paths return no active item rather than selecting a false match.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm run test:unit -- tests/admin/navigation.test.ts tests/admin/i18n.test.ts`
Expected: FAIL because the model and new localized shell labels do not exist.

- [ ] **Step 3: Implement the immutable navigation model**

Create exact types:

```ts
export type AdminNavItemId = "documents" | "categories" | "assets" | "analytics" | "agent"
export type AdminNavGroupId = "content" | "operations" | "system"

export type AdminNavItem = Readonly<{
  id: AdminNavItemId
  href: string
  parentId?: AdminNavItemId
}>

export type AdminNavGroup = Readonly<{
  id: AdminNavGroupId
  items: readonly AdminNavItem[]
}>

export function activeAdminNavItem(pathname: string): AdminNavItemId | null
```

Use explicit path rules, not substring matching. Add matching Korean and English group/control copy through the existing `CopyShape` contract.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `npm run test:unit -- tests/admin/navigation.test.ts tests/admin/i18n.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit the navigation boundary**

```bash
git add lib/admin/navigation.ts lib/admin/i18n.ts tests/admin/navigation.test.ts tests/admin/i18n.test.ts
git commit -m "feat: define admin workspace navigation"
```

### Task 2: Responsive authenticated Admin workspace

**Files:**
- Create: `components/admin/admin-workspace.tsx`
- Create: `components/admin/admin-workspace.module.css`
- Modify: `components/admin/admin-nav.tsx`
- Modify: `app/admin/layout.tsx`
- Modify: `app/admin/(protected)/layout.tsx`
- Modify: `app/admin/admin.module.css`
- Create: `tests/components/admin-workspace.test.tsx`
- Modify: `tests/components/admin-shell-i18n.test.tsx`

**Interfaces:**
- Consumes: `adminNavigation`, `activeAdminNavItem()`, `AdminLanguageToggle`, `Logo`, existing `SidePanel` primitives, `usePathname()`, localized Admin shell copy, and protected-layout `children`.
- Produces: `AdminWorkspace({ children }: { children: React.ReactNode })` and `AdminNav({ onNavigate? }: { onNavigate?: () => void })`.

- [ ] **Step 1: Write failing workspace tests**

Cover these behaviors with mocked `usePathname()`:

- desktop navigation exposes Content, Operations, and System groups;
- the current item carries `aria-current="page"` for both exact and nested routes;
- Categories renders visually nested under Documents but remains keyboard reachable;
- mobile menu has localized open and close names;
- trigger opens the SidePanel, Escape closes it, and focus returns to the trigger;
- selecting a destination invokes `onNavigate` so the mobile surface closes;
- Korean/English locale changes every group and destination label together;
- public-home link points to `/`;
- sign-in rendering test does not include authenticated navigation.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm run test:unit -- tests/components/admin-workspace.test.tsx tests/components/admin-shell-i18n.test.tsx`
Expected: FAIL because `AdminWorkspace` and grouped active navigation do not exist.

- [ ] **Step 3: Implement the workspace client boundary**

`AdminWorkspace` owns only mobile-panel open state and route presentation. Use `SidePanel side="left"` so Radix supplies focus containment, Escape dismissal, focus restoration, and background interaction blocking. Render one navigation data source in desktop and mobile contexts.

Move the logo, private label, language control, and public-home access into this workspace. Replace the protected layout fragment with `<AdminWorkspace>{children}</AdminWorkspace>` after `requireAdmin()` succeeds. Reduce the root Admin layout to metadata plus a neutral Admin root wrapper so sign-in does not inherit private navigation.

- [ ] **Step 4: Implement responsive workspace CSS**

Use a 220–240px desktop sidebar, a fluid main track, sticky sidebar positioning, one shared content gutter, and no page-level horizontal overflow. At the mobile breakpoint, hide the sidebar and expose the compact top bar. Limit animation to transform/opacity and disable it under `prefers-reduced-motion`.

- [ ] **Step 5: Run workspace and authorization regression tests**

Run: `npm run test:unit -- tests/components/admin-workspace.test.tsx tests/components/admin-shell-i18n.test.tsx tests/auth/admin-authorization.test.ts`
Expected: PASS with the same protected redirect behavior.

- [ ] **Step 6: Commit the workspace shell**

```bash
git add components/admin/admin-workspace.tsx components/admin/admin-workspace.module.css components/admin/admin-nav.tsx app/admin/layout.tsx 'app/admin/(protected)/layout.tsx' app/admin/admin.module.css tests/components/admin-workspace.test.tsx tests/components/admin-shell-i18n.test.tsx
git commit -m "feat: add responsive admin workspace"
```

### Task 3: Shared Admin page-layout components

**Files:**
- Create: `components/admin/admin-page.tsx`
- Create: `components/admin/admin-page.module.css`
- Create: `tests/components/admin-page.test.tsx`

**Interfaces:**
- Consumes: semantic HTML, existing Breadcrumb primitives, and existing Core UI controls supplied as React children.
- Produces: `AdminPage`, `AdminPageHeader`, `AdminToolbar`, and `AdminSection` with the following public props:

```ts
type AdminPageProps = React.ComponentPropsWithoutRef<"section">

type AdminPageHeaderProps = {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  breadcrumbs?: React.ReactNode
  actions?: React.ReactNode
}

type AdminToolbarProps = React.ComponentPropsWithoutRef<"section"> & {
  label: string
}

type AdminSectionProps = React.ComponentPropsWithoutRef<"section"> & {
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
}
```

- [ ] **Step 1: Write failing semantic and composition tests**

Assert one page heading, optional description and actions, labelled toolbar region, optional section heading, forwarded className/HTML props, and no replacement styling for nested Button, Panel, or Field children.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm run test:unit -- tests/components/admin-page.test.tsx`
Expected: FAIL because the shared layout components do not exist.

- [ ] **Step 3: Implement thin semantic components**

Keep the implementation presentational. Do not read locale, route, data, or mutation state inside these components. Generate stable heading relationships with `useId()` only where callers do not supply an id.

- [ ] **Step 4: Implement the page-layout CSS contract**

Create one page rhythm, one header grid, one toolbar reflow rule, and one section-heading rule. Actions align right on wide screens and below the title on narrow screens. Toolbars collapse to a single field column without changing DOM order.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm run test:unit -- tests/components/admin-page.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit the layout contract**

```bash
git add components/admin/admin-page.tsx components/admin/admin-page.module.css tests/components/admin-page.test.tsx
git commit -m "feat: add admin page composition"
```

### Task 4: Adopt the workspace composition on the document list

**Files:**
- Modify: `app/admin/(protected)/documents/page.tsx`
- Modify: `components/admin/document-list.tsx`
- Modify: `app/admin/admin.module.css`
- Modify: `tests/components/document-admin-pages.test.tsx`
- Modify: `tests/components/document-admin.test.tsx`
- Modify: `tests/components/document-admin-layout.test.ts`

**Interfaces:**
- Consumes: `AdminPage`, `AdminPageHeader`, `AdminToolbar`, existing `ButtonLink`, document filter Core UI, Panel/Item collection recipe, and the unchanged `DocumentListProps` contract.
- Produces: the same `/admin/documents` query behavior and `DocumentList` results with the shared page hierarchy.

- [ ] **Step 1: Update document-page tests to express the new hierarchy**

Assert that:

- the localized page heading and concise description render in `AdminPageHeader`;
- New document remains the only primary page action and links to `/admin/documents/new`;
- Category management is no longer duplicated in the document-page header because it is nested navigation;
- the search/filter controls belong to one labelled AdminToolbar;
- query parsing, debounced replacement, clear filters, pagination cursor preservation, empty states, and result accessibility remain unchanged.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm run test:unit -- tests/components/document-admin-pages.test.tsx tests/components/document-admin.test.tsx tests/components/document-admin-layout.test.ts`
Expected: FAIL on the old page header and filter wrapper.

- [ ] **Step 3: Adopt the shared page header and Core UI action**

Replace the route-owned heading markup with `AdminPage` and `AdminPageHeader`. Use `ButtonLink` for New document without changing its href or localized copy. Remove only the redundant category header link.

- [ ] **Step 4: Adopt `AdminToolbar` around the existing filters**

Keep every controlled filter value, debounce, URL replacement, cursor encoding, and clear behavior intact. Move CSS responsibilities for outer toolbar geometry to `AdminToolbar`; retain document-specific field columns only where needed.

- [ ] **Step 5: Run document and route regression tests**

Run: `npm run test:unit -- tests/components/document-admin-pages.test.tsx tests/components/document-admin.test.tsx tests/components/document-admin-layout.test.ts tests/documents/admin-list.test.ts tests/documents/workflow.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit the document-list adoption**

```bash
git add 'app/admin/(protected)/documents/page.tsx' components/admin/document-list.tsx app/admin/admin.module.css tests/components/document-admin-pages.test.tsx tests/components/document-admin.test.tsx tests/components/document-admin-layout.test.ts
git commit -m "refactor: adopt admin workspace on documents"
```

### Task 5: Adopt Core UI and page composition on category management

**Files:**
- Modify: `app/admin/(protected)/documents/categories/page.tsx`
- Modify: `components/admin/document-category-manager.tsx`
- Modify: `app/admin/admin.module.css`
- Modify: `lib/admin/i18n.ts`
- Modify: `tests/components/document-category-manager.test.tsx`
- Modify: `tests/admin/i18n.test.ts`

**Interfaces:**
- Consumes: `AdminPage`, `AdminPageHeader`, Breadcrumb primitives, Panel, Field, Input, NativeSelect, Button, ButtonGroup, StatusLabel, Alert, Toast or current inline status, and AlertDialog.
- Produces: the unchanged `DocumentCategoryManager({ initialCategories }: { initialCategories: DocumentCategorySnapshot[] })` contract and unchanged category API payloads.

- [ ] **Step 1: Rewrite category interaction tests for the approved UI contract**

Preserve assertions for create, save, reorder, version-conflict refresh, server authorization, and exact request bodies. Replace the `window.confirm` assertion with:

- opening a localized AlertDialog from Activate/Deactivate;
- cancellation causing no request;
- confirmation sending the exact existing PATCH payload;
- focus returning to the originating action after dismissal.

Also assert a Documents breadcrumb, separate create and collection Panels, Core UI labels/inputs, square status labels, and localized empty/feedback states.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm run test:unit -- tests/components/document-category-manager.test.tsx tests/admin/i18n.test.ts`
Expected: FAIL because the manager still uses raw controls and `window.confirm`.

- [ ] **Step 3: Compose the category page with existing Core UI**

Keep category state and mutation functions intact. Replace raw form controls and page framing with the declared Core UI primitives. Store only the category awaiting activation change for AlertDialog confirmation; do not change optimistic version or refresh behavior.

- [ ] **Step 4: Normalize feedback and responsive layout**

Keep actionable mutation errors next to the category task and expose success through the existing live status or localized Toast, not both for the same event. At 390px, place form fields and row actions in one readable column without horizontal page scrolling.

- [ ] **Step 5: Run category and API regression tests**

Run: `npm run test:unit -- tests/components/document-category-manager.test.tsx tests/documents/category-admin-api.test.ts tests/documents/category-service.test.ts tests/documents/category-validation.test.ts`
Expected: PASS with exact existing API contracts.

- [ ] **Step 6: Commit category adoption**

```bash
git add 'app/admin/(protected)/documents/categories/page.tsx' components/admin/document-category-manager.tsx app/admin/admin.module.css lib/admin/i18n.ts tests/components/document-category-manager.test.tsx tests/admin/i18n.test.ts
git commit -m "refactor: unify admin category management"
```

### Task 6: Sign-in, shared route states, documentation, and PR A release gate

**Files:**
- Modify: `app/admin/sign-in/page.tsx`
- Create: `app/admin/(protected)/loading.tsx`
- Create: `app/admin/(protected)/error.tsx`
- Create: `components/admin/admin-route-state.tsx`
- Modify: `app/admin/admin.module.css`
- Modify: `lib/admin/i18n.ts`
- Modify: `tests/components/admin-shell-i18n.test.tsx`
- Create: `tests/components/admin-route-state.test.tsx`
- Modify: `docs/platform-roadmap.md`
- Create: `.impeccable/surfaces/admin-workspace.md`
- Create or replace: `.impeccable/review/admin-workspace-documents-desktop.png`
- Create or replace: `.impeccable/review/admin-workspace-categories-mobile.png`

**Interfaces:**
- Consumes: unauthenticated sign-in action, `Logo`, `AdminLanguageToggle`, Button, Alert, EmptyState, Skeleton/Spinner, shared page layout, and existing reset callback conventions.
- Produces: `AdminRouteLoading()` and `AdminRouteError({ title, description, retryLabel, onRetry })`, shared protected-route loading/error files, and PR A visual evidence.

- [ ] **Step 1: Write failing sign-in and route-state tests**

Assert that:

- sign-in renders the official logo, private-system context, locale control, and one GitHub membership action;
- sign-in has no authenticated navigation groups;
- its server action still calls `signIn("github", { redirectTo: "/admin/analytics" })`;
- loading reserves page-header and content geometry and has an accessible loading label;
- error shows localized safe copy and invokes `reset()` from its retry control;
- long Korean and English state copy wraps rather than widening the page.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm run test:unit -- tests/components/admin-shell-i18n.test.tsx tests/components/admin-route-state.test.tsx`
Expected: FAIL because shared protected route states do not exist and sign-in lacks its independent masthead.

- [ ] **Step 3: Refine sign-in and implement shared route states**

Keep the authentication server action unchanged. Give sign-in its own compact masthead because the root Admin layout no longer owns one. Implement protected `loading.tsx` and client `error.tsx` with safe localized copy and the shared route-state component.

- [ ] **Step 4: Record PR A status and surface guidance**

Add an Admin workspace refinement workstream to `docs/platform-roadmap.md` with PR A marked shipped only after all release checks pass and PR B identified as next. Document the shell, navigation, page-layout interfaces, functional boundaries, and responsive constraints in `.impeccable/surfaces/admin-workspace.md`.

- [ ] **Step 5: Run the complete automated release gate**

Run: `npm test`
Expected: design check, typecheck, lint, all unit/component tests, and the Next.js production build PASS. Existing API, authorization, document, category, media, analytics, and Agent tests remain green.

- [ ] **Step 6: Perform bounded desktop/mobile verification**

Verify protected Documents and Categories in Korean and English at 1440px and 390px. Check active nested navigation, mobile open/close/Escape/focus return, locale switching, filters, category confirmation, empty/error/loading states, focus visibility, reduced motion, and `document.documentElement.scrollWidth === window.innerWidth`. Save only the two specified review screenshots.

- [ ] **Step 7: Run final repository checks**

Run: `git diff --check`
Expected: no whitespace errors.

Run: `git status --short`
Expected: only intentional PR A files before the final commit.

- [ ] **Step 8: Commit PR A release evidence**

```bash
git add app/admin components/admin lib/admin docs/platform-roadmap.md .impeccable/surfaces/admin-workspace.md .impeccable/review/admin-workspace-documents-desktop.png .impeccable/review/admin-workspace-categories-mobile.png tests/admin tests/components
git commit -m "feat: complete admin workspace foundation"
```

- [ ] **Step 9: Push and open the PR**

Push `codex/admin-workspace-shell` and open a pull request against `main` summarizing the workspace shell, Core UI adoption, unchanged business contracts, automated results, and desktop/mobile evidence. Preserve the worktree for review feedback.
