# LafLabs Core UI v2 C3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish practical cross-component recipes, state matrices, and migration guidance from the LafLabs design catalog, then prove the recommended contracts in representative Admin surfaces.

**Architecture:** Keep the existing `/design/patterns` information architecture and extend its catalog-backed content instead of adding another navigation destination. Store recipes and migrations as typed bilingual data, validate all component references centrally, render the same source for people, and serialize it into the existing guide, AI context, and Skill pattern reference. Preserve every C3A-C3C compatibility alias for the current release.

**Tech Stack:** Next.js 16.3.6 App Router, React 19.2.6, TypeScript 5.9, CSS Modules, Vitest, Testing Library, generated Markdown/JSON/Skill artifacts.

**Spec:** `docs/superpowers/specs/2026-10-01-laflabs-core-ui-v2-design.md`

## Global Constraints

- Preserve the established square Paper, Ink, Primary Blue, and one-pixel-rule visual language.
- Do not invent product claims, example customers, metrics, assets, or unavailable components.
- Keep the existing `/design/patterns` route and Design navigation stable.
- Recipes must describe components that exist in the catalog and expose loading, empty, success, error, or decision states where they matter.
- Migration guidance documents the recommended API without removing compatibility props or aliases in C3D.
- Korean and English copy must be equivalent, concise, and natural in each language.
- Support 320px layouts, 200% zoom, keyboard reading order, visible focus, and reduced motion.
- Use TDD for catalog contracts, serializers, and representative application adoption.

---

### Task 1: Typed recipes, state matrices, and migrations

**Files:**
- Create: `lib/design-system/recipes.ts`
- Create: `lib/design-system/migrations.ts`
- Modify: `lib/design-system/schema.ts`
- Modify: `lib/design-system/catalog.ts`
- Modify: `tests/design-system/catalog.test.ts`

- [x] Add failing catalog tests for complete recipe and migration inventories, bilingual copy, unique IDs, and valid component references.
- [x] Add `RecipeEntry`, `RecipeStateEntry`, and `MigrationEntry` types to the catalog schema.
- [x] Validate nested state IDs, localized condition/presentation/next-action copy, and every related or replacement component ID.
- [x] Publish three recipes: document publishing, searchable collection, and consequential action.
- [x] Publish focused migration entries for Action, IconControl, SegmentedToggle, StatusLabel variant, Alert title, NoticeToast, and Dialog close/body composition.
- [x] Run `npm run test:unit -- tests/design-system/catalog.test.ts` and commit the catalog delivery.

### Task 2: Human-readable patterns, recipes, and migration guide

**Files:**
- Modify: `components/design-system/patterns-guide.tsx`
- Modify: `components/design-system/design-system.module.css`
- Create: `tests/design-system/patterns-guide.test.tsx`

- [x] Add failing render tests for bilingual recipe headings, semantic state tables, component links, and migration rows.
- [x] Add a recipe section after structural patterns, with concise steps and a state matrix per recipe.
- [x] Add a migration reference after recipes, using direct legacy-to-recommended rows rather than cards.
- [x] Keep table headers and component links accessible; use horizontal overflow only where the matrix cannot remain legible at 320px.
- [x] Match the existing Pattern page rhythm without adding decorative cards, duplicate section numbering, or new accent colors.
- [x] Run focused guide tests and commit the public documentation delivery.

### Task 3: AI-readable publication and generated artifact alignment

**Files:**
- Modify: `lib/design-system/serialize.ts`
- Modify: `lib/design-system/meta.ts`
- Modify: `tests/design-system/serialize.test.ts`
- Modify: `docs/platform-roadmap.md`
- Regenerate: `DESIGN.md`

- [x] Add failing serializer tests for recipe state matrices and migration guidance in the provider-neutral guide and Skill pattern reference.
- [x] Serialize recipes and migrations into `guide.md`, `context.json`, `SKILL.md` references, and the deterministic Skill archive without adding another reference file.
- [x] Bump the catalog to `2026.10.2` dated `2026-10-05`.
- [x] Mark C3D shipped in the roadmap while keeping the next product milestones unchanged.
- [x] Run `npm run design:generate`, `npm run design:check`, and focused serializer tests; commit the publication delivery.

### Task 4: Representative application adoption

**Files:**
- Modify: `components/admin/agent-settings.tsx`
- Modify: `components/admin/asset-library.tsx`
- Modify: relevant existing component tests under `tests/components/`

- [x] Add or tighten tests proving the Agent error uses compound Alert anatomy and Asset metadata uses DialogBody.
- [x] Migrate Agent settings to `AlertIcon`, `AlertContent`, `AlertTitle`, and `AlertDescription`, and replace StatusLabel `variant` with `tone`.
- [x] Migrate the Asset metadata form to `DialogBody` and StatusLabel `tone` while preserving current mutations, labels, and compatibility behavior elsewhere.
- [x] Run focused Admin tests and commit representative adoption.

### Task 5: Release verification and pull request

- [ ] Run design generation drift check, typecheck, lint, unit tests, and production build.
- [ ] Verify `/design/patterns` at desktop and mobile widths in Korean and English, including matrix overflow and component links.
- [ ] Verify keyboard reading order, focus visibility, and reduced-motion behavior.
- [ ] Run the design detector once on changed UI files and complete a bounded self-review because delegation is not authorized for this run.
- [ ] Push `codex/core-ui-c3d` and open a stacked pull request against `codex/core-ui-c3c` while PR #58 remains open; otherwise retarget to `main`.
