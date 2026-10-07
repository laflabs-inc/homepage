# LafLabs Core UI v2 C3D Recipes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish four production-backed Core UI Recipes with live states, localized guidance, copyable TSX, and synchronized human and AI documentation.

**Architecture:** Add a serializable Recipe collection beside components and patterns in the existing design catalog. Resolve finite Recipe demo keys through a separate React registry, then render an index and detail route using the existing DesignShell, inspection contract, CodeBlock, and production `components/ui/*` exports. Extend the current deterministic serializers rather than creating a second documentation pipeline.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Vitest, Testing Library, existing Radix-backed Core UI components.

**Spec:** `docs/superpowers/specs/2026-10-06-laflabs-core-ui-v2-c3d-recipes-design.md`

## Global Constraints

- Do not publish migration or deprecation guidance in this delivery.
- A Recipe composes existing Core UI components; it does not create a replacement primitive or application abstraction.
- All visible guidance, anatomy, state, and responsive copy must have natural Korean and English values.
- Use only verified generic document-workflow content; do not invent customers, products, metrics, or claims.
- Preserve Paper `#F8FAFC`, Ink `#0F172A`, Primary Blue `#2563EB`, Line `#CBD5E1`, square geometry, and one-pixel rules.
- Keep server-safe catalog data separate from React demos; isolate client behavior in the smallest leaf.
- Keep controls usable at 320px width and 200% text zoom, with 44px small-screen targets and unclipped focus.
- Preserve application routes, mutations, analytics events, and Admin behavior.
- Before changing App Router pages, read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md`, `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`, and `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`.

## Review Focus

- A Recipe referencing an unknown component or Pattern must fail catalog validation instead of producing a broken link.
- Duplicate Recipe IDs or demo keys must fail deterministically instead of shadowing another Recipe.
- Interactive and environment-dependent states must include both Korean and English inspection instructions.
- Long Korean and English action labels must wrap or reflow at 320px and 200% zoom without hiding actions.
- Dropdowns, Combobox popups, focus outlines, and live feedback must remain visible and correctly named inside preview frames.

---

### Task 1: Typed Recipe catalog and validation

**Files:**
- Create: `lib/design-system/recipe-options.ts`
- Create: `lib/design-system/recipes.ts`
- Modify: `lib/design-system/schema.ts`
- Modify: `lib/design-system/catalog.ts`
- Test: `tests/design-system/catalog.test.ts`

**Interfaces:**
- Consumes: `LocaleText`, `ComponentStateInspection`, `ComponentEntry`, `PatternEntry`, and `formatComponentUsageExample(source: string): string`.
- Produces: `RecipeCategory`, `RecipeDemoKey`, `RecipeEntry`, `designCatalog.recipes`, and `getRecipeEntry(slug: string): RecipeEntry | undefined`.

- [ ] **Step 1: Write failing Recipe schema tests**

Add a minimal Recipe to `validCatalog` and tests named:

- `accepts a complete bilingual recipe catalog`;
- `rejects duplicate recipe ids and demo keys`;
- `rejects recipes that reference unknown components or patterns`;
- `rejects unsafe recipe source paths`;
- `requires localized instructions for interactive recipe states`;
- `publishes the four approved production recipes`.

The production assertion must expect these exact IDs:

```ts
[
  "document-publishing-toolbar",
  "search-filter-field",
  "document-settings-form",
  "collection-state-surface",
]
```

It must also verify that every declared component ID resolves from `designCatalog.components`, every Pattern ID resolves from `designCatalog.patterns`, and every non-fixture state has complete inspection instructions.

- [ ] **Step 2: Run the catalog test and verify RED**

Run: `npm run test:unit -- --run tests/design-system/catalog.test.ts`

Expected: FAIL because `DesignCatalog` has no `recipes` collection or Recipe validator.

- [ ] **Step 3: Define finite Recipe options**

Create `recipe-options.ts` with:

```ts
export const recipeCategories = ["action", "form", "collection", "system-state"] as const
export type RecipeCategory = typeof recipeCategories[number]

export const recipeDemoKeys = [
  "document-publishing-toolbar",
  "search-filter-field",
  "document-settings-form",
  "collection-state-surface",
] as const
export type RecipeDemoKey = typeof recipeDemoKeys[number]
```

- [ ] **Step 4: Add the serializable Recipe contract and validator**

Add `RecipeEntry` to `schema.ts` with the exact fields approved by the spec: `id`, `title`, `summary`, `whenToUse`, `whenNotToUse`, `accessibility`, `category`, `demoKey`, `components`, `relatedPatterns`, `anatomy`, `states`, `responsive`, `sourcePaths`, and `usageExample`.

Add `recipes: readonly RecipeEntry[]` to `DesignCatalog`. Extend `assertDesignCatalog(catalog)` to validate unique kebab-case IDs, unique supported demo keys, localized copy, valid component and Pattern references, safe relative source paths, non-empty formatted usage, and the shared state-inspection rules.

- [ ] **Step 5: Populate and normalize the four Recipes**

Create `recipes.ts` with the four approved entries. Use generic document publishing copy only. Every `usageExample` must be passed through `formatComponentUsageExample`. State boundaries are:

- publishing toolbar: `draft` fixture, `publish-options` interactive, `publishing` fixture;
- search/filter: `default` fixture, `filters-open` interactive, `empty` fixture, `invalid` fixture;
- settings form: `default` fixture, `invalid` fixture, `disabled` fixture, `saving` fixture;
- collection surface: `loading`, `populated`, `empty`, and `error`, all fixed fixtures.

Expose the collection from `catalog.ts`, add `getRecipeEntry`, and include Recipes in `designDiscoveryEntries` with `/design/recipes/{id}` links and component/state keywords.

- [ ] **Step 6: Run the catalog test and verify GREEN**

Run: `npm run test:unit -- --run tests/design-system/catalog.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the catalog contract**

```bash
git add lib/design-system/recipe-options.ts lib/design-system/recipes.ts lib/design-system/schema.ts lib/design-system/catalog.ts tests/design-system/catalog.test.ts
git commit -m "feat: define design system recipes"
```

### Task 2: Production Recipe previews

**Files:**
- Create: `components/design-system/recipes/recipe-preview.tsx`
- Create: `components/design-system/recipes/recipe-demo-registry.tsx`
- Create: `components/design-system/recipes/document-publishing-toolbar-demo.tsx`
- Create: `components/design-system/recipes/search-filter-field-demo.tsx`
- Create: `components/design-system/recipes/document-settings-form-demo.tsx`
- Create: `components/design-system/recipes/collection-state-surface-demo.tsx`
- Create: `components/design-system/recipes/recipe-demos.module.css`
- Test: `tests/components/design-system-recipes.test.tsx`

**Interfaces:**
- Consumes: `RecipeDemoKey`, `RecipeEntry`, `Locale`, and production exports from `components/ui/*`.
- Produces: `RecipeDemoProps = Readonly<{ locale: Locale; state?: string }>`, exhaustive `recipeDemos: Record<RecipeDemoKey, ComponentType<RecipeDemoProps>>`, and `RecipePreview({ demoKey, label, locale, state, inspectionMode })`.

- [ ] **Step 1: Write failing preview and state tests**

Create `design-system-recipes.test.tsx`. For every catalog Recipe and state, render `RecipePreview` and assert a named `region` with `data-inspection-mode`. Add focused assertions that:

- the publishing toolbar exposes named save, publish, and publish-options actions;
- the search/filter Recipe connects its label and invalid error to the textbox and exposes the Combobox by keyboard name;
- the settings Recipe exposes a named field group and shows disabled and saving fixtures without duplicate live announcements;
- the collection Recipe renders named loading, populated, empty, and error regions without customer or product placeholder claims;
- each demo key exists exactly once in the registry;
- the demo stylesheet keeps preview focus overflow visible and gives Dropdown/Combobox popup layers a stacking level above adjacent documentation.

- [ ] **Step 2: Run the Recipe component test and verify RED**

Run: `npm run test:unit -- --run tests/components/design-system-recipes.test.tsx`

Expected: FAIL because the Recipe preview registry does not exist.

- [ ] **Step 3: Implement `RecipePreview` and the exhaustive registry**

Mirror the server-safe `ComponentPreview` boundary. `RecipePreview` accepts `inspectionMode` defaulting to `fixture`, renders the selected demo inside a named region, and writes the inspection mode as a data attribute. Throw `Missing recipe demo: {demoKey}` for an impossible unresolved key.

- [ ] **Step 4: Implement the four state-aware production demos**

Compose only existing UI exports. Keep application data local and generic. Put any open-state or event-driven behavior in the smallest client leaf; keep fixed state fixtures server-renderable. Use `recipe-demos.module.css` only for composition, responsive reflow, and preview spacing—never to restyle a child component contract.

At `max-width: 720px`, toolbar actions and search/filter controls become one-column or full-width in task order. Ensure preview wrappers use `min-width: 0`, visible overflow for focus, and popup layering above neighboring documentation.

- [ ] **Step 5: Run the Recipe component test and verify GREEN**

Run: `npm run test:unit -- --run tests/components/design-system-recipes.test.tsx`

Expected: PASS.

- [ ] **Step 6: Run static UI detection**

Run:

```bash
node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json components/design-system/recipes
```

Expected: `[]`. Fix any finding in the owning Recipe demo before committing.

- [ ] **Step 7: Commit the previews**

```bash
git add components/design-system/recipes tests/components/design-system-recipes.test.tsx
git commit -m "feat: add production recipe previews"
```

### Task 3: Recipe index and detail routes

**Files:**
- Create: `components/design-system/recipe-index.tsx`
- Create: `components/design-system/recipe-index-client.tsx`
- Create: `components/design-system/recipe-detail.tsx`
- Create: `components/design-system/design-code.tsx`
- Create: `components/design-system/recipe-code.tsx`
- Create: `components/design-system/state-inspection-copy.ts`
- Create: `lib/design-system/recipe-slugs.ts`
- Create: `app/(documents)/design/recipes/page.tsx`
- Create: `app/(documents)/design/recipes/[slug]/page.tsx`
- Modify: `components/design-system/component-code.tsx`
- Modify: `components/design-system/component-detail.tsx`
- Modify: `components/design-system/code-copy-button.tsx`
- Modify: `components/design-system/design-system.module.css`
- Modify: `lib/analytics/normalize.ts`
- Modify: `lib/analytics/public-paths.ts`
- Modify: `lib/design-system/catalog.ts`
- Test: `tests/analytics/normalize.test.ts`
- Test: `tests/components/design-system-recipes.test.tsx`
- Test: `tests/components/design-system-interactions.test.tsx`
- Test: `tests/components/document-pages.test.tsx`

**Interfaces:**
- Consumes: `designCatalog.recipes`, `getRecipeEntry`, `RecipePreview`, `ComponentPreview` inspection copy conventions, `DesignShell`, and `getDesignPageHref`.
- Produces: `RecipeIndex({ locale }: { locale: Locale })`, client leaf `RecipeIndexClient({ locale, recipes })`, `RecipeDetail({ recipe, locale }: { recipe: RecipeEntry; locale: Locale })`, shared `DesignCode({ source, targetId, locale })`, shared `stateInspectionCopy`, `designRecipeSlugs`, `/design/recipes`, and `/design/recipes/[slug]`.

- [ ] **Step 1: Read the four required Next.js 16 guides**

Read the files listed in Global Constraints completely before writing route code. Preserve the repository's async `params` and `searchParams` conventions.

- [ ] **Step 2: Write failing route and page tests**

Extend `design-system-recipes.test.tsx` to assert:

- the Korean index renders four full-width Recipe rows and locale-preserving detail links;
- the English index renders equivalent copy;
- search filters localized title, summary, component ID, and state ID text without changing the URL;
- category selection filters the rows, and a no-result query renders a localized empty result with a clear action;
- every detail route renders its H1, primary preview, when-to-use, anatomy, states, responsive rules, accessibility, multiline copyable TSX, related components/Patterns, and source paths;
- `generateStaticParams()` returns all four IDs;
- an unknown slug calls `notFound()`;
- `filters-open` displays `directly interact` guidance and its preview carries `data-inspection-mode="interactive"`;
- long bilingual Recipe titles remain inside a shrink-safe row at 320px, pinned by stylesheet assertions for `minmax(0, ...)`, `min-width: 0`, and the `720px` reflow.

Extend `document-pages.test.tsx` so site metadata and sitemap expectations include `/design/recipes` and each Recipe detail URL. Extend `design-system-interactions.test.tsx` and `normalize.test.ts` to prove Recipe code copies the exact source, reports feedback, records the existing `design_code_copy` event with an allowlisted Recipe ID, and still rejects arbitrary targets.

- [ ] **Step 3: Run route tests and verify RED**

Run:

```bash
npm run test:unit -- --run tests/components/design-system-recipes.test.tsx tests/components/design-system-interactions.test.tsx tests/components/document-pages.test.tsx tests/analytics/normalize.test.ts
```

Expected: FAIL because Recipe pages and navigation do not exist.

- [ ] **Step 4: Add the Recipe navigation entry and index**

Extend `DesignPageEntry["id"]` with `recipes` and add a bilingual `/design/recipes` entry after Components and before Patterns. Implement `RecipeIndex` as a server wrapper and `RecipeIndexClient` as the smallest client leaf for local search and category selection. Search the localized title and summary plus stable component/state IDs, filter immediately, and provide one localized clear action for no results. Render category-grouped full-width rows showing title, purpose, category label, and linked component names; do not use a generic equal-card grid.

- [ ] **Step 5: Add the Recipe detail page**

Implement the exact information order from the spec. Extract the state mode labels from `component-detail.tsx` into `state-inspection-copy.ts` so component and Recipe pages use the same localized wording. Extract the markup shared by `ComponentCode` and Recipe code into `DesignCode`; change `CodeCopyButton` from `componentSlug` to `targetId`, then keep `ComponentCode` and `RecipeCode` as typed wrappers. Add the four IDs to `designRecipeSlugs`, allow them as existing `design_code_copy` targets, and include Recipe index/detail paths in `publicAnalyticsPaths` without introducing a new event name.

Related component links point to `/design/components/{id}`. Build related Pattern links as `${getDesignPageHref("/design/patterns", locale)}#pattern-{id}` so the English query appears before the fragment.

Implement route metadata, canonical URLs, static params, locale resolution, and `notFound()` using the same shape as the component detail route.

- [ ] **Step 6: Add responsive Recipe page styles**

Add focused `recipe*` classes to `design-system.module.css`. Preserve the existing shell and typography. At 1020px, move previews below Recipe identity content; at 720px, collapse metadata/anatomy/state rows to one column with 44px actions. Keep focus and popup overflow visible.

- [ ] **Step 7: Run route tests and verify GREEN**

Run:

```bash
npm run test:unit -- --run tests/components/design-system-recipes.test.tsx tests/components/design-system-interactions.test.tsx tests/components/document-pages.test.tsx tests/analytics/normalize.test.ts
```

Expected: PASS.

- [ ] **Step 8: Run static UI detection**

Run:

```bash
node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json components/design-system/recipe-index.tsx components/design-system/recipe-detail.tsx components/design-system/design-system.module.css
```

Expected: `[]`.

- [ ] **Step 9: Commit the Recipe pages**

```bash
git add app/'(documents)'/design/recipes components/design-system/recipe-index.tsx components/design-system/recipe-index-client.tsx components/design-system/recipe-detail.tsx components/design-system/design-code.tsx components/design-system/recipe-code.tsx components/design-system/state-inspection-copy.ts components/design-system/component-code.tsx components/design-system/component-detail.tsx components/design-system/code-copy-button.tsx components/design-system/design-system.module.css lib/design-system/catalog.ts lib/design-system/recipe-slugs.ts lib/analytics/normalize.ts lib/analytics/public-paths.ts tests/analytics/normalize.test.ts tests/components/design-system-recipes.test.tsx tests/components/design-system-interactions.test.tsx tests/components/document-pages.test.tsx
git commit -m "feat: publish core ui recipes"
```

### Task 4: Generated human and AI Recipe references

**Files:**
- Modify: `lib/design-system/serialize.ts`
- Modify: `lib/design-system/meta.ts`
- Modify: `docs/platform-roadmap.md`
- Modify: `DESIGN.md` through `npm run design:generate`
- Test: `tests/design-system/serialize.test.ts`
- Test: `tests/design-system/routes.test.ts`
- Test: `tests/components/design-guide.test.tsx`
- Test: `tests/design-system/catalog.test.ts`

**Interfaces:**
- Consumes: `designCatalog.recipes`, `serializeDesignGuide()`, `serializeSkillFiles()`, `serializeAiContext()`, and the existing deterministic generator.
- Produces: Recipe sections in the guide, context bundle, Skill Patterns reference, and generated `DESIGN.md`; design-system version `2026.10.3`, updated `2026-10-07`.

- [ ] **Step 1: Write failing serialization and version tests**

Add assertions that:

- the provider-neutral guide contains `## Recipes` and all four Recipe IDs;
- every Recipe lists category, components, related Patterns, state inspection modes, responsive rules, and formatted TSX;
- `references/patterns.md` contains both composition Patterns and a distinct `# Recipes` section;
- `context.json` embeds the updated Recipe-aware guide and Skill reference;
- generated output is deterministic when called twice;
- metadata and Skill zip filename use `2026.10.3` and `2026-10-07`.

- [ ] **Step 2: Run serialization tests and verify RED**

Run:

```bash
npm run test:unit -- --run tests/design-system/serialize.test.ts tests/design-system/routes.test.ts tests/components/design-guide.test.tsx tests/design-system/catalog.test.ts
```

Expected: FAIL because Recipe serialization and the new metadata version are absent.

- [ ] **Step 3: Serialize Recipes from the typed catalog**

Add one private Recipe summary serializer for `guide.md` and one private complete Recipe serializer appended to `serializePatternsReference()`. Include canonical formatted TSX in fenced `tsx` blocks. Extend the Skill workflow with one instruction: choose a published Recipe before composing a common documented task and preserve its declared component semantics and order.

Do not add a new public machine route or a sixth Skill archive file; Recipes belong to the existing guide, context bundle, and Patterns reference.

- [ ] **Step 4: Bump metadata and update the roadmap boundary**

Set `designSystemMeta.version` to `2026.10.3` and `updatedAt` to `2026-10-07`. Update `docs/platform-roadmap.md` so C3D is `In progress`, Recipe publication is shipped by this slice, and representative application adoption remains next. Remove no compatibility code and add no migration section.

- [ ] **Step 5: Regenerate repository design guidance**

Run: `npm run design:generate`

Expected: `DESIGN.md` contains the new version and all four Recipe entries with no hand-edited drift.

- [ ] **Step 6: Run serialization tests and verify GREEN**

Run:

```bash
npm run test:unit -- --run tests/design-system/serialize.test.ts tests/design-system/routes.test.ts tests/components/design-guide.test.tsx tests/design-system/catalog.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run complete verification**

Run: `npm test`

Expected: generated design check, typecheck, lint, all Vitest tests, and the Next.js production build pass.

Then run:

```bash
git diff --check
node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json components/design-system
```

Expected: no whitespace errors and detector output `[]`.

- [ ] **Step 8: Perform browser verification**

Verify `/design/recipes` and all four detail pages in Korean and English at desktop, 320px, and 200% text zoom. Complete keyboard-only checks for Dropdown Menu and Combobox states, confirm popup layering and focus restoration, then enable reduced motion and verify stable final states.

- [ ] **Step 9: Commit generated publication artifacts**

```bash
git add lib/design-system/serialize.ts lib/design-system/meta.ts docs/platform-roadmap.md DESIGN.md tests/design-system/serialize.test.ts tests/design-system/routes.test.ts tests/components/design-guide.test.tsx tests/design-system/catalog.test.ts
git commit -m "docs: publish core ui recipe guidance"
```

- [ ] **Step 10: Push and open the implementation PR**

Push `codex/core-ui-c3d-recipes` and open a PR targeting `main`. If PR #62 is still open, declare the PR as stacked on #62 and do not hide the dependency; after #62 merges, update the branch from `origin/main` before final merge.
