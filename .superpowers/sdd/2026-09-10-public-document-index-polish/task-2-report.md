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

## Fix round 2: corrected pre-fix evidence predicate

The prior corrective evidence command over-escaped the regular expression. The following read-only checks use the correctly escaped JavaScript predicate `/\.indexPage\s*\{[^}]*width:\s*var\(--shell\)/s` and run it against both commit snapshots.

### Parent snapshot (expected RED)

```bash
git show 8a9111a:components/content/content.module.css | node --input-type=module -e 'let s=""; process.stdin.setEncoding("utf8"); process.stdin.on("data", c => s += c); process.stdin.on("end", () => { const matches = /\.indexPage\s*\{[^}]*width:\s*var\(--shell\)/s.test(s); console.log(`index shell predicate: ${matches}`); process.exit(matches ? 0 : 1) })'
```

Output and exit code:

```text
index shell predicate: false
exit=1
```

### Fixed snapshot (expected GREEN)

```bash
git show 4c88295:components/content/content.module.css | node --input-type=module -e 'let s=""; process.stdin.setEncoding("utf8"); process.stdin.on("data", c => s += c); process.stdin.on("end", () => { const matches = /\.indexPage\s*\{[^}]*width:\s*var\(--shell\)/s.test(s); console.log(`index shell predicate: ${matches}`); process.exit(matches ? 0 : 1) })'
```

Output and exit code:

```text
index shell predicate: true
exit=0
```

### Covering tests after evidence correction

```bash
npx vitest run tests/components/document-index-layout.test.ts tests/components/document-pages.test.tsx
```

```text
Test Files  2 passed (2)
Tests       27 passed (27)
```

## Fix round 1: index-only shell isolation

### Controller findings addressed

The shared `.page` rule had incorrectly been changed to the shell width, affecting the design guide and error/not-found/detail surfaces. `DocumentIndex` now renders `styles.indexPage`; `.indexPage` owns the shell width and compact index padding, while the prior shared `.page` desktop/mobile sizing is restored. `.detailPage` remains unchanged.

The layout contract now asserts all three boundaries: `.indexPage` uses `var(--shell)`, the restored shared `.page` uses the former 1120px width, and `.detailPage` retains the 920px reading width.

### Corrective RED evidence

The runnable contract was checked against the parent/pre-fix stylesheet without modifying the working tree:

```bash
git show HEAD^:components/content/content.module.css | node --input-type=module -e 'let s=""; process.stdin.setEncoding("utf8"); process.stdin.on("data", c => s += c); process.stdin.on("end", () => { if (!/\\.indexPage\\s*\\{[^}]*width:\\s*var\\(--shell\\)/s.test(s)) { console.error("Expected contract failure: parent stylesheet has no indexPage shell rule"); process.exit(1) } })'
```

Relevant output:

```text
Expected contract failure: parent stylesheet has no indexPage shell rule
exit=1
```

This verifies the intended contract fails against the pre-fix stylesheet before the GREEN run. The test fixture uses `process.cwd()` because this repository’s Vitest/jsdom setup resolves `import.meta.url` to `http://localhost:3000/...`, which is not accepted by `fileURLToPath`; the project-root working directory is the stable test-runner convention used by the focused command.

### Corrective GREEN evidence

```bash
npx vitest run tests/components/document-index-layout.test.ts tests/components/document-pages.test.tsx
```

```text
Test Files  2 passed (2)
Tests       27 passed (27)
```
