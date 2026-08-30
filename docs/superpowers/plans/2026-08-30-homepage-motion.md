# Homepage Motion Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use `superpowers:test-driven-development` for every behavior change and `superpowers:verification-before-completion` before claiming completion.

**Goal:** Turn the homepage’s existing product-to-system explanation into one restrained, scroll-driven technical story, then use smaller supporting motion in COMPANY and SIGNAL without changing the site’s information architecture or product claims.

**Architecture:** Keep `Landing` as the page compositor. Rebuild `BuildLoop` as one semantic ordered list whose desktop presentation becomes a sticky state machine and whose mobile/reduced-motion presentation returns to normal document flow. Keep all animation driven by Motion values (`useScroll`, `useTransform`, `whileInView`) and CSS transforms/opacity; do not add continuous React scroll state, animation dependencies, canvas, video, or WebGL. SIGNAL remains a data-loading component, but its decorative title receives a deterministic entry burst and a single quiet “lock” pulse when the load state becomes ready.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Motion 12, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-30-homepage-motion-design.md`

## Global constraints

- Preserve the current cobalt-blue, square-geometry identity and all existing routes, analytics, navigation, product data, and conversion paths.
- Desktop (`> 900px`): `BuildLoop` uses a `320svh` scroll range and a `100svh` sticky stage.
- Mobile/tablet (`<= 900px`): no sticky section, artificial height, horizontal scrolling, or scroll hijacking.
- Reduced motion: all copy is readable in normal flow and the final topology is complete without animation.
- All meaningful text must exist in semantic HTML before Motion hydrates. Decorative topology and glitch layers are `aria-hidden`.
- Use transform, opacity, and bounded clip-path only. Avoid filter animation except an optional static/sub-3px blur on the COMPANY entrance.
- Do not add a new runtime dependency.
- Before editing React/CSS, read the relevant Next.js 16 Client Components and CSS guidance under `node_modules/next/dist/docs/`, plus Impeccable’s `reference/craft-floor.md`.

### Task 1: Define the four-stage story and static topology contract

**Files:**

- Modify: `lib/content.ts`
- Modify: `components/sections/build-loop.tsx`
- Modify: `components/sections/build-loop.module.css`
- Modify: `tests/components/build-loop-styles.test.tsx`
- Modify: `tests/components/landing-refresh.test.tsx`

**Step 1: Write the failing content and structure tests**

Update `tests/components/build-loop-styles.test.tsx` to require:

```tsx
const section = screen.getByRole("region", {
  name: "제품에서 시작해 시스템으로 남깁니다.",
})

expect(section).toHaveAttribute("data-motion-sequence", "build-loop")
expect(within(section).getAllByRole("listitem")).toHaveLength(4)
expect(within(section).getByTestId("build-loop-stage")).toBeInTheDocument()
expect(within(section).getAllByTestId("build-loop-node")).toHaveLength(4)
expect(within(section).getByText("시스템")).toBeVisible()
expect(within(section).queryByText("오픈소스")).not.toBeInTheDocument()
```

Update `tests/components/landing-refresh.test.tsx` to assert the Korean and English terminal copy:

```tsx
expect(screen.getByText("시스템")).toBeVisible()
expect(screen.getByText("운영에서 확인한 경계와 반복 작업을 오래 쓰는 시스템으로 남깁니다.")).toBeVisible()
// English render
expect(screen.getByText("System")).toBeVisible()
expect(screen.getByText("Turn proven boundaries and repeated work into a system designed to last.")).toBeVisible()
```

**Step 2: Run the focused tests and confirm RED**

Run:

```bash
npx vitest run tests/components/build-loop-styles.test.tsx tests/components/landing-refresh.test.tsx
```

Expected: FAIL because the terminal stage is still “오픈소스 / Open source” and no unified visual stage exists.

**Step 3: Update bilingual content**

In `lib/content.ts`, replace only the fourth Build Loop step:

```ts
// ko
{ title: "시스템", body: "운영에서 확인한 경계와 반복 작업을 오래 쓰는 시스템으로 남깁니다." }

// en
{ title: "System", body: "Turn proven boundaries and repeated work into a system designed to last." }
```

**Step 4: Add a semantic, cumulative topology**

In `build-loop.tsx`, introduce a fixed scene identity:

```ts
const sceneIds = ["product", "foundation", "operations", "system"] as const
type SceneId = (typeof sceneIds)[number]
```

Render the ordered list once and give each item `data-scene={sceneIds[index]}`. Add a sibling visual stage:

```tsx
<div className={styles.stage} data-testid="build-loop-stage" aria-hidden="true">
  {sceneIds.map((scene, index) => (
    <div
      className={styles.node}
      data-scene={scene}
      data-testid="build-loop-node"
      key={scene}
    />
  ))}
  <span className={`${styles.stageMark} mono`}>LAF</span>
</div>
```

The initial CSS must show a coherent static final state before JavaScript runs. Use square nodes and straight connector rules; do not imitate a dashboard, source-code window, or product screenshot.

**Step 5: Run focused tests and confirm GREEN**

Run the same Vitest command. Expected: PASS.

**Step 6: Commit**

```bash
git add lib/content.ts components/sections/build-loop.tsx components/sections/build-loop.module.css tests/components/build-loop-styles.test.tsx tests/components/landing-refresh.test.tsx
git commit -m "feat: define the homepage system story"
```

### Task 2: Rebuild Build Loop as a desktop scroll state machine

**Files:**

- Modify: `components/sections/build-loop.tsx`
- Modify: `components/sections/build-loop.module.css`
- Modify: `tests/components/build-loop-styles.test.tsx`

**Step 1: Write failing tests for the motion contract**

Extend `tests/components/build-loop-styles.test.tsx`:

```tsx
expect(section).toHaveAttribute("data-scene-count", "4")
expect(within(section).getByTestId("build-loop-stage")).toHaveAttribute("data-stage-layout", "sticky")

for (const [index, item] of within(section).getAllByRole("listitem").entries()) {
  expect(item).toHaveAttribute("data-scene-index", String(index))
}
```

Add a source-level CSS assertion in the same test file using `readFileSync` so the regression is explicit:

```ts
expect(css).toContain("height: 320svh")
expect(css).toContain("position: sticky")
expect(css).toContain("@media (max-width: 900px)")
expect(css).toContain("height: auto")
```

**Step 2: Run the test and confirm RED**

```bash
npx vitest run tests/components/build-loop-styles.test.tsx
```

Expected: FAIL on missing state-machine attributes and `320svh`.

**Step 3: Implement stable scene windows**

In `build-loop.tsx`, define the approved windows:

```ts
const sceneWindows = [
  [0, 0.20],
  [0.28, 0.45],
  [0.53, 0.70],
  [0.78, 1],
] as const
```

For every scene, derive entry/hold/exit values directly from `scrollYProgress` with `useTransform`. The last scene holds through `1`; earlier scenes fade and move out before the next stable window. Use values equivalent to:

```ts
const opacity = useTransform(progress, [entry - 0.08, entry, exit, exit + 0.06], [0, 1, 1, 0])
const y = useTransform(progress, [entry - 0.08, entry, exit, exit + 0.06], [32, 0, 0, -20])
```

Clamp the first and last input ranges so they remain monotonic. Use the same progress value to accumulate node/connector visibility: scene `n` reveals topology through `n`, never removes previously established nodes.

**Step 4: Compose the single desktop stage**

Restructure the desktop grid so:

- left: section heading, lede, numeric `01–04` progress rail;
- right: one bounded copy viewport layered over/next to one cumulative topology;
- only one scene’s copy is visually exposed during each stable interval;
- the ordered list remains the semantic source; decorative duplicates are `aria-hidden` if required.

CSS requirements:

```css
.buildLoop { height: 320svh; }
.sticky { min-height: 100svh; position: sticky; top: 0; }
.sceneViewport { position: relative; min-height: 230px; overflow: clip; }
.scene { position: absolute; inset: 0; }
```

Do not update React state on every scroll frame. If a discrete index is needed for `data-active-scene`, use Motion’s `useMotionValueEvent` only when a threshold is crossed.

**Step 5: Run focused tests**

```bash
npx vitest run tests/components/build-loop-styles.test.tsx tests/components/landing-refresh.test.tsx
```

Expected: PASS.

**Step 6: Commit**

```bash
git add components/sections/build-loop.tsx components/sections/build-loop.module.css tests/components/build-loop-styles.test.tsx
git commit -m "feat: turn build loop into a scroll story"
```

### Task 3: Make mobile and reduced-motion modes intentionally static

**Files:**

- Modify: `components/sections/build-loop.tsx`
- Modify: `components/sections/build-loop.module.css`
- Modify: `playwright.homepage.config.ts`
- Modify: `e2e/homepage-motion.spec.ts`

**Step 1: Write failing browser tests**

Replace the current generic Build Loop transform test with three explicit behaviors:

```ts
test("desktop build loop pins one stage and advances its scene", async ({ page }) => {
  // 1440px project only
  // assert computed section height > 3 * viewport height
  // scroll to the Product and System windows
  // assert data-active-scene changes from product to system
  // assert stage position is sticky
})

test("mobile build loop is a readable vertical sequence", async ({ page }) => {
  // 390px and 768px projects
  // assert computed height is near content height, not 320svh
  // assert all four headings are visible in document order after scrolling
  // assert sticky stage position resolves to relative/static
  // assert document scrollWidth <= clientWidth + 1
})

test("reduced motion exposes the complete story without transforms", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  // assert all four scene headings are visible/readable
  // assert final LAF topology mark is visible
})
```

Keep the API route interception helper shared at the top of the file so the test never needs a database.

In `playwright.homepage.config.ts`, add a tablet project:

```ts
{
  name: "tablet-chromium",
  use: { browserName: "chromium", viewport: { width: 768, height: 1024 }, hasTouch: true },
}
```

Set `reuseExistingServer: false` to avoid validating a stale manual server.

**Step 2: Run the browser tests and confirm RED**

```bash
npx playwright test --config=playwright.homepage.config.ts e2e/homepage-motion.spec.ts --grep "build loop"
```

Expected: FAIL because desktop does not expose discrete scene state and the current mobile inline transforms are still scroll-derived.

**Step 3: Add mobile and reduced-motion overrides**

At `max-width: 900px`:

- set the section height to `auto`;
- make the sticky wrapper `position: relative`;
- render scenes as a normal four-row ordered sequence;
- expose each cumulative topology snapshot beside/under its own copy;
- override desktop Motion inline opacity/transform so copy cannot remain hidden;
- use only a short nested `whileInView` opacity/y entrance with `viewport={{ once: true, amount: 0.35 }}`;
- keep all widths `min-width: 0` and prevent horizontal overflow.

At `prefers-reduced-motion: reduce`, apply the same normal-flow rules at every viewport and show the complete topology. Do not merely shorten the animations.

**Step 4: Run browser tests and confirm GREEN**

Run the same Playwright command. Expected: PASS for desktop, tablet, mobile, and reduced-motion cases.

**Step 5: Commit**

```bash
git add components/sections/build-loop.tsx components/sections/build-loop.module.css playwright.homepage.config.ts e2e/homepage-motion.spec.ts
git commit -m "fix: preserve the build story across motion modes"
```

### Task 4: Refine the COMPANY entrance as supporting motion

**Files:**

- Modify: `components/landing.tsx`
- Modify: `tests/components/landing-refresh.test.tsx`
- Modify: `e2e/homepage-motion.spec.ts`

**Step 1: Write the failing contract tests**

Require stable hooks around the two animated lines:

```tsx
expect(screen.getByText(/아이덴티티, 결제, 클라우드/)).toHaveAttribute("data-company-line", "copy")
expect(screen.getByText(/BUILD QUIETLY/)).toHaveAttribute("data-company-line", "motto")
```

Add a Playwright assertion that, when the COMPANY section first enters the viewport, the copy settles before the motto and both finish with a zero horizontal transform.

**Step 2: Run tests and confirm RED**

```bash
npx vitest run tests/components/landing-refresh.test.tsx
npx playwright test --config=playwright.homepage.config.ts e2e/homepage-motion.spec.ts --grep "COMPANY"
```

Expected: FAIL on the new hooks/timing contract.

**Step 3: Tighten the entrance**

Replace the current `96px`/`7px` entrance with:

```ts
const companyEnter = (delay = 0) => ({
  initial: reduced ? false : { opacity: 0, x: 64, filter: "blur(2px)" },
  whileInView: reduced ? undefined : { opacity: 1, x: 0, filter: "blur(0px)" },
  viewport: { once: true, amount: 0.42 },
  transition: { duration: 0.72, delay, ease: [0.16, 1, 0.3, 1] as const },
})
```

Use `0` delay for the sentence and `0.12` for the motto. Keep the section title and number stable.

**Step 4: Run tests and confirm GREEN**

Run the same focused commands. Expected: PASS.

**Step 5: Commit**

```bash
git add components/landing.tsx tests/components/landing-refresh.test.tsx e2e/homepage-motion.spec.ts
git commit -m "feat: sharpen the company section entrance"
```

### Task 5: Make SIGNAL react to a successful content lock

**Files:**

- Modify: `components/sections/latest-signals.tsx`
- Modify: `components/sections/latest-signals.module.css`
- Modify: `tests/components/latest-signals.test.tsx`
- Modify: `e2e/homepage-motion.spec.ts`

**Step 1: Write failing state tests**

In `tests/components/latest-signals.test.tsx`, query the decorative stage by a stable test hook and require:

```tsx
expect(screen.getByTestId("signal-lock")).toHaveAttribute("data-signal-state", "loading")
// after successful non-empty fetch
expect(await screen.findByTestId("signal-lock")).toHaveAttribute("data-signal-state", "ready")
// failed/empty responses
expect(screen.getByTestId("signal-lock")).toHaveAttribute("data-signal-state", "error")
```

Also assert the stable accessible section heading exists in all states. Decorative glitch layers must remain `aria-hidden`.

**Step 2: Run the focused test and confirm RED**

```bash
npx vitest run tests/components/latest-signals.test.tsx
```

Expected: FAIL because `SignalGlitch` is unaware of loading state.

**Step 3: Pass deterministic load state into the title**

Change the private component interface:

```ts
function SignalGlitch({ state, pulseKey }: {
  state: LoadState["status"]
  pulseKey: string
})
```

Render:

```tsx
<SignalGlitch
  state={displayState.status}
  pulseKey={`${locale}:${displayState.status === "ready" ? displayState.items.map(({ id }) => id).join(",") : displayState.status}`}
/>
```

Behavior:

- entry: two clipped duplicate text layers plus one scan line, `450–600ms`, one time in viewport;
- loading → ready: remount only a small lock pulse keyed by `pulseKey`, `180–260ms`;
- empty/error: no pulse or continuous noise;
- locale changes: the ready result may pulse once again after the new locale resolves;
- stable SIGNAL text never disappears;
- no randomness or infinite animation.

CSS should use tight rectangular clips and no neon shadow, RGB split, or cyberpunk color treatment.

**Step 4: Add a browser-level lock assertion**

In `e2e/homepage-motion.spec.ts`, assert the intercepted successful response changes `[data-signal-state]` from `loading` to `ready`, the stable word remains visible, and the section does not widen the document.

**Step 5: Run focused tests and confirm GREEN**

```bash
npx vitest run tests/components/latest-signals.test.tsx
npx playwright test --config=playwright.homepage.config.ts e2e/homepage-motion.spec.ts --grep "SIGNAL|latest signals"
```

Expected: PASS.

**Step 6: Commit**

```bash
git add components/sections/latest-signals.tsx components/sections/latest-signals.module.css tests/components/latest-signals.test.tsx e2e/homepage-motion.spec.ts
git commit -m "feat: animate the latest signal lock"
```

### Task 6: Visual polish, detector, and full verification

**Files:**

- Modify only if verification finds a concrete defect: files touched in Tasks 1–5

**Step 1: Run the full automated suite**

```bash
npm test
npx playwright test --config=playwright.homepage.config.ts
```

Expected: TypeScript, ESLint, all Vitest suites, production build, and all homepage Playwright projects PASS.

**Step 2: Run the Impeccable detector once on the changed UI targets**

```bash
node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json \
  components/landing.tsx \
  components/sections/build-loop.tsx \
  components/sections/build-loop.module.css \
  components/sections/latest-signals.tsx \
  components/sections/latest-signals.module.css
```

Resolve only findings that are relevant and correct for this design; record any intentional exceptions in the final handoff.

**Step 3: Perform the motion polish pass**

Review screenshots/video traces at 1440×1000, 768×1024, and 390×844. Verify:

- only one Build Loop copy is visually active on desktop;
- topology reads as product → modules → operating boundary → stable LAF field;
- mobile shows four normal-flow stages and no horizontal overflow;
- reduced motion shows all content and final topology;
- COMPANY moves right-to-left once and does not drag with page scroll;
- SIGNAL has one authored burst and one subtle ready lock, never continuous noise;
- all section gutters remain aligned with the existing site grid.

If a defect is found, add or tighten a regression assertion before changing the source, rerun the focused test, then rerun the full suite.

**Step 4: Inspect the final diff and commit verification fixes**

```bash
git diff --check
git status --short
git diff origin/main...HEAD --stat
```

If polish required source changes:

```bash
git add components/landing.tsx components/sections/build-loop.tsx components/sections/build-loop.module.css components/sections/latest-signals.tsx components/sections/latest-signals.module.css tests/components/build-loop-styles.test.tsx tests/components/landing-refresh.test.tsx tests/components/latest-signals.test.tsx e2e/homepage-motion.spec.ts playwright.homepage.config.ts
git commit -m "fix: polish homepage motion across viewports"
```

If no source changes were needed, do not create an empty commit.

**Step 5: Prepare the PR handoff**

Report:

- the Build Loop state-machine behavior;
- mobile/reduced-motion behavior;
- COMPANY and SIGNAL supporting motion;
- exact verification commands and results;
- PR URL after pushing and creating the PR.
