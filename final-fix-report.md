# Final fix report

## Scope completed

- Shared one lightweight, exact public analytics pathname allowlist between consent initialization and server normalization. It contains only `/` and the concrete catalog component-detail routes sourced from `component-slugs.ts`; unsupported and malformed values still coerce to `/`.
- Replaced state-name-only component details with catalog-backed bilingual inspection guidance and editorial state rows that render the real production components. Actual disabled `Action` and `IconControl` controls are disabled in their state previews; interactive and pseudo-class states explain how to inspect the real control.
- Derived related patterns from patterns that contain the current component, then derived related components from those patterns. Korean and English links preserve locale and pattern links target the catalog section anchor.
- Made foundation guidance rows and rules span the editorial column while constraining only their nested text to `72ch`.
- Extended catalog validation for localized component states and valid pattern component references, and included bilingual state inspection guidance in the generated component reference serializer.

## TDD evidence

The initial focused RED run reported 14 expected failures across four files: six component pathname normalization cases, one stored design-event pathname, three catalog/state relationship contracts, three component-detail contracts, and one foundation CSS contract. After implementation, the same focused set passed 117 tests.

## Verification

- `npm run test:unit -- --run tests/components/design-system-pages.test.tsx tests/components/design-system-interactions.test.tsx tests/design-system/catalog.test.ts tests/design-system/serialize.test.ts tests/analytics tests/components/consent-panel.test.tsx` — 17 files, 259 tests passed.
- `npm run typecheck` — passed.
- Touched TypeScript/TSX ESLint invocation — passed with no findings.
- `npm run design:check` — passed.
- `git diff --check` — passed.
- Full build intentionally not run, per task instruction.

## Concerns

- Vitest prints the repository's existing warning that `vitest.config.ts` uses `__dirname` with Vite's future native config loader. It is non-failing and outside this fix scope.
