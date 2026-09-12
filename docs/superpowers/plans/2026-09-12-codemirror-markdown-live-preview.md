# CodeMirror Markdown Live Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin editor's block-per-textarea simulation with one CodeMirror 6 Markdown document that reveals source at the selection and renders inactive blocks in place.

**Architecture:** CodeMirror owns the complete Markdown string, selection, composition, history, and clipboard behavior. Pure Markdown helpers identify exact top-level ranges and calculate input edits; a direct CodeMirror decoration field replaces complete inactive ranges with React-powered `MarkdownBody` widgets while selected or invalid source stays editable. React manages only editor lifecycle, external value synchronization, and live/source mode control.

**Tech Stack:** Next.js 16.3.2, React 19.2.6, TypeScript 5.9, CodeMirror 6, unified/remark, React Testing Library, Vitest

**Spec:** `docs/superpowers/specs/2026-09-12-codemirror-markdown-live-preview-design.md`

## Global Constraints

- Keep `bodyMarkdown` and the `MarkdownLiveEditor` `value`/`onChange` contract as one exact Markdown string.
- Do not change database schemas, document API payloads, or the public `MarkdownBody` renderer.
- Use one `EditorView`; switching modes must not recreate it or clear history.
- Keep source visible for incomplete Markdown and every block intersecting a selection.
- Preserve native composition and undo behavior, including Korean IME and mobile keyboards.
- Render only through the existing sanitized `MarkdownBody` component.
- Reject edits above the existing 200,000-character default without changing content or selection.
- Preserve the square paper/ink/blue admin design without an active-block outline.

---

### Task 1: Exact Markdown ranges and input edit model

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `lib/markdown/editor-model.ts`
- Create: `tests/markdown/editor-model.test.ts`
- Modify: `lib/markdown/blocks.ts`
- Modify: `tests/markdown/blocks.test.ts`

**Interfaces:**
- Produces: `MarkdownEditorBlock = { start: number; end: number; source: string; type: string; complete: boolean }`
- Produces: `getMarkdownEditorBlocks(source: string): MarkdownEditorBlock[]`
- Produces: `getPreviewableMarkdownBlocks(source: string, selections: readonly { from: number; to: number }[]): MarkdownEditorBlock[]`
- Produces: `getMarkdownEnterEdit(source: string, from: number, to: number, shiftKey: boolean): { from: number; to: number; insert: string; anchor: number } | null`
- Produces: `getComplexBlockExitEdit(source: string, from: number, to: number): { from: number; to: number; insert: string; anchor: number } | null`

- [ ] **Step 1: Install direct CodeMirror dependencies.**

```bash
npm install @codemirror/commands @codemirror/lang-markdown @codemirror/language @codemirror/state @codemirror/view
```

Expected: the manifest and lockfile contain one CodeMirror 6 dependency graph.

- [ ] **Step 2: Write failing tests for exact ranges and preview eligibility.**

```ts
it("excludes separators from top-level block ranges", () => {
  expect(getMarkdownEditorBlocks("first\n\nsecond")).toMatchObject([
    { start: 0, end: 5, source: "first", type: "paragraph", complete: true },
    { start: 7, end: 13, source: "second", type: "paragraph", complete: true },
  ])
})

it("keeps every selected block as source", () => {
  expect(getPreviewableMarkdownBlocks("first\n\nsecond", [{ from: 2, to: 10 }])).toEqual([])
})

it("keeps an incomplete fence as source", () => {
  expect(getPreviewableMarkdownBlocks("```ts\nconst value = 1", [{ from: 0, to: 0 }])).toEqual([])
})
```

The production change that makes these pass is exact AST start/end mapping plus fence completeness checks.

- [ ] **Step 3: Run the range tests and verify RED.**

```bash
npx vitest run tests/markdown/editor-model.test.ts tests/markdown/blocks.test.ts
```

Expected: FAIL because `editor-model.ts` does not exist and the legacy helper includes separator whitespace.

- [ ] **Step 4: Implement exact parsing.**

Use unified with `remarkParse`, `remarkGfm`, and `remarkMath`. Read both `position.start.offset` and `position.end.offset`; never infer a node end from the next node. Mark unmatched fenced code, display math, and raw HTML incomplete. Preserve `MarkdownBlock` by mapping the exact model ranges.

Use this intersection rule for non-collapsed selections:

```ts
const intersects = block.start <= selection.to && block.end >= selection.from
```

A collapsed cursor on separator whitespace intersects no block.

- [ ] **Step 5: Write failing tests for Enter edits.**

```ts
it("starts a new paragraph from prose", () => {
  expect(getMarkdownEnterEdit("first", 5, 5, false)).toEqual({
    from: 5, to: 5, insert: "\n\n", anchor: 7,
  })
})

it("does not swallow Enter on a blank separator", () => {
  expect(getMarkdownEnterEdit("first\n\nsecond", 6, 6, false)).toEqual({
    from: 6, to: 6, insert: "\n", anchor: 7,
  })
})

it("inserts a Markdown hard break for Shift Enter", () => {
  expect(getMarkdownEnterEdit("first", 5, 5, true)).toEqual({
    from: 5, to: 5, insert: "  \n", anchor: 8,
  })
})

it("leaves fenced code Enter to CodeMirror", () => {
  expect(getMarkdownEnterEdit("```ts\nvalue\n```", 8, 8, false)).toBeNull()
})
```

- [ ] **Step 6: Run tests, implement minimal edit helpers, and verify GREEN.**

Run before implementation and confirm the new assertions fail, then implement paragraph/heading separators, blank-line insertion, hard breaks, and complex-block exit. Return `null` for lists, quotes, code, tables, math, HTML, and Mermaid so a specialized or default CodeMirror command owns them.

```bash
npx vitest run tests/markdown/editor-model.test.ts tests/markdown/blocks.test.ts
```

Expected after implementation: PASS.

- [ ] **Step 7: Commit the tested model.**

```bash
git add package.json package-lock.json lib/markdown/editor-model.ts lib/markdown/blocks.ts tests/markdown/editor-model.test.ts tests/markdown/blocks.test.ts
git commit -m "feat: add markdown live preview model"
```

---

### Task 2: CodeMirror Markdown commands

**Files:**
- Create: `components/admin/markdown-editor-commands.ts`
- Create: `tests/components/markdown-editor-commands.test.ts`

**Interfaces:**
- Consumes: Task 1 edit helpers.
- Produces: `markdownEditorKeymap: readonly KeyBinding[]`
- Produces: `markdownMaxLength(maxLength: number): Extension`

- [ ] **Step 1: Write failing tests using real `EditorState` transactions.**

```ts
it("dispatches one paragraph transaction", () => {
  const { state, dispatch, dispatched } = commandHarness("first", 5)
  expect(runMarkdownEnter({ state, dispatch })).toBe(true)
  expect(dispatched().state.doc.toString()).toBe("first\n\n")
  expect(dispatched().state.selection.main.head).toBe(7)
})

it("does not claim Enter inside fenced code", () => {
  const { state, dispatch } = commandHarness("```ts\nvalue\n```", 8)
  expect(runMarkdownEnter({ state, dispatch })).toBe(false)
})

it("rejects content above max length", () => {
  const state = createState("12345", markdownMaxLength(5))
  expect(applyInsert(state, 5, "6").doc.toString()).toBe("12345")
})
```

The command module is the production change that makes these tests pass.

- [ ] **Step 2: Run tests and verify RED.**

```bash
npx vitest run tests/components/markdown-editor-commands.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement commands and the transaction filter.**

Each owned command dispatches one transaction with explicit `changes`, `selection`, and `scrollIntoView: true`. Export the keymap in this precedence order:

```ts
export const markdownEditorKeymap = [
  { key: "Shift-Enter", run: runMarkdownHardBreak },
  { key: "Mod-Enter", run: exitComplexMarkdownBlock },
  { key: "Enter", run: insertNewlineContinueMarkup },
  { key: "Enter", run: runMarkdownEnter },
]
```

When all specialized commands return `false`, the standard CodeMirror newline command handles a multiline structure. Use a transaction filter to reject `newDoc.length > maxLength`.

- [ ] **Step 4: Run tests and verify GREEN.**

```bash
npx vitest run tests/components/markdown-editor-commands.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add components/admin/markdown-editor-commands.ts tests/components/markdown-editor-commands.test.ts
git commit -m "feat: add markdown editor input commands"
```

---

### Task 3: Live Preview decorations and widgets

**Files:**
- Create: `components/admin/markdown-live-preview-extension.tsx`
- Create: `tests/components/markdown-live-preview-extension.test.tsx`
- Modify: `tests/setup.ts`

**Interfaces:**
- Consumes: `getPreviewableMarkdownBlocks`.
- Produces: `createMarkdownLivePreview(options: { className: string }): Extension`
- Produces: `setMarkdownLivePreview: StateEffectType<boolean>`

- [ ] **Step 1: Add only missing jsdom geometry shims.**

```ts
Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList
Range.prototype.getBoundingClientRect ??= () => new DOMRect()
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
```

Do not mock `EditorView`, transactions, selections, or decorations.

- [ ] **Step 2: Write failing real-`EditorView` tests.**

Test that a cursor in the first paragraph leaves it as source and previews the second; a cross-block selection previews neither; a separator cursor preserves the blank line; the mode effect removes widgets without changing document/selection; widget activation selects its source start; view destruction unmounts React roots cleanly.

The direct decoration field and widget lifecycle are the production changes that make these pass.

- [ ] **Step 3: Run tests and verify RED.**

```bash
npx vitest run tests/components/markdown-live-preview-extension.test.tsx
```

Expected: FAIL because the extension does not exist.

- [ ] **Step 4: Implement direct decorations and the widget.**

Use `StateField.define<DecorationSet>` and `EditorView.decorations.from(field)`. Rebuild after `docChanged`, `selectionSet`, or the mode effect. Use exact sorted ranges and no decoration for whitespace or incomplete source.

The `WidgetType` mounts this existing renderer into its container:

```tsx
<MarkdownBody source={source} />
```

Intercept pointer activation to dispatch selection at the source start, prevent link navigation inside the authoring surface, keep roots in `WeakMap<HTMLElement, Root>`, and unmount in `destroy(dom)`.

- [ ] **Step 5: Run tests and verify GREEN.**

```bash
npx vitest run tests/components/markdown-live-preview-extension.test.tsx
```

Expected: PASS without React lifecycle warnings.

- [ ] **Step 6: Commit.**

```bash
git add components/admin/markdown-live-preview-extension.tsx tests/components/markdown-live-preview-extension.test.tsx tests/setup.ts
git commit -m "feat: render inactive markdown blocks in CodeMirror"
```

---

### Task 4: Persistent React editor lifecycle

**Files:**
- Rewrite: `components/admin/markdown-live-editor.tsx`
- Modify: `tests/components/document-admin.test.tsx`

**Interfaces:**
- Consumes: Tasks 2 and 3.
- Preserves: `MarkdownLiveEditorProps = { value: string; onChange: (value: string) => void; maxLength?: number }`.
- Renders exactly one CodeMirror host in both modes.

- [ ] **Step 1: Replace obsolete textarea tests with failing lifecycle tests.**

```ts
it("uses one continuous editor in both modes", async () => {
  render(<ControlledMarkdownEditor initialValue={"first\n\nsecond"} />)
  expect(screen.getAllByRole("textbox", { name: "Markdown body" })).toHaveLength(1)
  await userEvent.click(screen.getByRole("button", { name: "Full source" }))
  expect(screen.getAllByRole("textbox", { name: "Markdown body" })).toHaveLength(1)
})
```

Also assert that a mode change preserves text/selection, a local transaction calls `onChange` once, and a same-value rerender produces no parent callback.

- [ ] **Step 2: Run tests and verify RED.**

```bash
npx vitest run tests/components/document-admin.test.tsx
```

Expected: FAIL because the current component renders block textareas and a separate source textarea.

- [ ] **Step 3: Implement one persistent `EditorView`.**

Construct it once in `useLayoutEffect` with Markdown language support, history/default keymaps, high-precedence Task 2 keymap, line wrapping, max-length filter, Task 3 preview extension, and:

```ts
EditorView.contentAttributes.of({ "aria-label": t.markdownBody })
```

The update listener calls the latest `onChange` ref only for local `docChanged` transactions. A separate effect compares external `value` with `view.state.doc.toString()` and dispatches a minimal annotated replacement only when different. Mode buttons dispatch only `setMarkdownLivePreview.of(boolean)`. Destroy the view on unmount.

- [ ] **Step 4: Run integration tests and verify GREEN.**

```bash
npx vitest run tests/components/document-admin.test.tsx tests/components/markdown-editor-commands.test.ts tests/components/markdown-live-preview-extension.test.tsx tests/markdown/editor-model.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add components/admin/markdown-live-editor.tsx tests/components/document-admin.test.tsx
git commit -m "refactor: use one CodeMirror markdown editor"
```

---

### Task 5: LafLabs styling and legacy removal

**Files:**
- Modify: `app/admin/admin.module.css`
- Modify: `components/admin/markdown-live-editor.tsx`
- Modify: `lib/admin/i18n.ts`
- Modify: `lib/markdown/blocks.ts`
- Modify: `tests/components/document-admin.test.tsx`
- Modify: `tests/markdown/blocks.test.ts`

**Interfaces:**
- Removes: `markdownBlockSupportsInternalNewlines` and legacy active-textarea DOM/classes.
- Adds: `.markdownCodeMirror` and `.markdownPreviewWidget` scoped styles.

- [ ] **Step 1: Add a failing structure assertion.**

Assert the live editor host uses the new continuous-editor class, active source has no block outline element, and toggling mode never adds a second editor DOM node. The new host markup and CSS make the assertion pass.

- [ ] **Step 2: Run the component test and verify RED.**

```bash
npx vitest run tests/components/document-admin.test.tsx
```

Expected: FAIL on the missing new host structure.

- [ ] **Step 3: Replace legacy styles.**

Remove `.markdownBlock`, `.markdownActiveBlock`, and `.markdownSourceEditor`. Add scoped CodeMirror rules that remove default borders, preserve a blue caret and native selection, use a 520px desktop/420px mobile minimum writing height, retain document typography, avoid widget borders/backgrounds, use `overflow-wrap: anywhere`, and prevent 375px viewport overflow. Focus-visible belongs on the editor shell, not individual blocks.

- [ ] **Step 4: Remove dead helpers and strings after confirming no consumers.**

```bash
rg -n "markdownBlockSupportsInternalNewlines|markdownActiveBlock|markdownSourceEditor|editingBlock" components lib app tests
```

Expected: no production consumers after removal.

- [ ] **Step 5: Verify affected code.**

```bash
npx vitest run tests/components/document-admin.test.tsx tests/markdown/blocks.test.ts
npm run typecheck
npm run lint
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 6: Commit.**

```bash
git add app/admin/admin.module.css components/admin/markdown-live-editor.tsx lib/admin/i18n.ts lib/markdown/blocks.ts tests/components/document-admin.test.tsx tests/markdown/blocks.test.ts
git commit -m "style: finish continuous markdown editor"
```

---

### Task 6: Full verification and PR

**Files:**
- Modify only files required by failures directly caused by Tasks 1–5.

**Interfaces:**
- Produces a deployable branch preserving all document APIs and published Markdown rendering.

- [ ] **Step 1: Run complete verification.**

```bash
npm test
```

Expected: typecheck, lint, all Vitest files, and the Next.js production build exit 0.

- [ ] **Step 2: Run the Impeccable detector once on the finished UI.**

```bash
node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json components/admin/markdown-live-editor.tsx components/admin/markdown-live-preview-extension.tsx app/admin/admin.module.css
```

Expected: no newly introduced high-severity anti-pattern. Fix only branch-introduced findings and rerun relevant tests.

- [ ] **Step 3: Inspect final state.**

```bash
git status --short
git diff --check
git diff --stat origin/main...HEAD
```

Expected: a clean branch containing only the editor replacement, tests, dependencies, spec, and plan.

- [ ] **Step 4: Push and open a PR.**

```bash
git push -u origin codex/document-editor-input-fix
gh pr create --base main --head codex/document-editor-input-fix --title "feat: replace admin Markdown editor with Live Preview" --body-file /tmp/codex-markdown-editor-pr.md
```

The PR body lists the continuous architecture, input behavior, test totals, build result, and authenticated manual checks.

- [ ] **Step 5: Verify Vercel and hand off manual checks.**

After Vercel succeeds, verify or ask the authenticated user to verify:

1. Korean composition and deletion on mobile and desktop.
2. Enter after a middle paragraph, Enter on a blank line, and Shift+Enter.
3. Undo/redo across multiple blocks.
4. Mouse/touch selection spanning two rendered blocks.
5. Editing tables, code, math, HTML, and Mermaid without a lost keystroke.
6. Live/source toggling without cursor or history reset.
7. No horizontal overflow at 375px.
