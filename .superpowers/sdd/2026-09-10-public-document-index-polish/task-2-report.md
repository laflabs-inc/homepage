# Task 2 Report: Shell alignment and responsive square styling

## Implementation summary

- Split the shared page sizing into separate `.page` and `.detailPage` rules.
- Aligned public document indexes to `var(--shell)` while preserving the 920px detail reading width.
- Added the compact responsive masthead, page-header copy wrapper, and document type navigation styles.
- Added tablet masthead stacking and mobile horizontal navigation containment.
- Added a static CSS contract test for index/detail widths and mobile navigation overflow.

## Files changed

- `components/content/content.module.css`
- `tests/components/document-index-layout.test.ts`

## Self-review

- Confirmed the desktop `.page` rule uses `width: var(--shell)` and `padding: 132px 0 110px`.
- Confirmed `.detailPage` remains `width: min(920px, calc(100% - 64px))` on desktop and uses the specified mobile width.
- Confirmed `.pageHeader` stacks at 900px and `.documentKindNav` scrolls internally at 700px, with links remaining non-shrinking.
- `git diff --check` passes.

## Concerns

- The exact brief fixture using `fileURLToPath(new URL(..., import.meta.url))` cannot run in this repository’s Vitest/jsdom configuration because Vitest resolves `import.meta.url` to `http://localhost:3000/...`; the test uses `process.cwd()` with the same stylesheet target instead. This is test-harness compatibility only and does not affect the CSS contract.
- No visual browser review was performed; that is reserved for Task 3.

## TDD evidence

### RED

Command:

```bash
npx vitest run tests/components/document-index-layout.test.ts
```

Relevant output:

```text
TypeError: The URL must be of scheme file
```

The initial test fixture exposed the repository’s HTTP `import.meta.url` behavior under Vitest/jsdom. After switching the fixture path to the repository working directory, the contract assertions ran normally.

### GREEN

Command:

```bash
npx vitest run tests/components/document-index-layout.test.ts tests/components/document-pages.test.tsx
```

Relevant output:

```text
Test Files  2 passed (2)
Tests       27 passed (27)
```

