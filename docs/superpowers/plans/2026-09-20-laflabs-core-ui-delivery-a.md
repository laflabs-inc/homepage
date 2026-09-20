# LafLabs Core UI Delivery A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the native-control half of LafLabs Core UI, expand the human and AI component documentation, and prove the APIs in low-risk public surfaces.

**Architecture:** LafLabs owns semantic React components and CSS Modules under `components/ui`. Native HTML supplies behavior for Delivery A; no interaction library is added. The design catalog remains the single source for pages, search, generated Markdown, token JSON, Skill references, and `DESIGN.md`.

**Tech Stack:** Next.js 16.3.2 App Router, React 19.2.6, TypeScript 5.9, CSS Modules, Phosphor Icons, Vitest, Testing Library, Playwright for the final browser check.

**Spec:** `docs/superpowers/specs/2026-09-20-laflabs-core-ui-design.md`

## Global Constraints

- Preserve Paper `#F8FAFC`, Ink `#0F172A`, Primary Blue `#2563EB`, zero-radius geometry, one-pixel rules, Geist Sans, Pretendard, and restrained motion.
- Native controls stay native in Delivery A; do not add `radix-ui`, shadcn, Base UI, CVA, or a class-merging dependency.
- Use Phosphor for interface icons; do not add hand-authored SVG paths.
- Keep existing component imports and `Action` behavior backward compatible.
- Navigation uses links; in-place actions and submissions use buttons.
- Every visible control needs a name, keyboard access, visible focus, disabled behavior, and a 44px mobile touch target.
- Placeholder text never replaces a label.
- Semantic status colors communicate real status only and are paired with text or iconography.
- Generated resources use `https://www.laflabs.co` directly and remain deterministic.
- npm packaging, a shadcn Registry, a LafLabs CLI, Admin-wide migration, and Delivery B composite controls are outside this plan.
- Read the relevant files under `node_modules/next/dist/docs/` before changing App Router pages or route generation.

## Review Focus

- Long Korean labels and descriptions must wrap without clipping controls or pushing adjacent actions outside a 320px viewport; Task 7 adds the rendering case.
- A Field with description and error must reference both IDs once, preserve a caller-provided `aria-describedby`, and expose `aria-invalid`; Task 3 pins the merge behavior.
- Busy and disabled Buttons must not invoke handlers or submit twice while keeping their visible label stable; Task 2 tests both activation paths.
- Indeterminate Checkbox, keyboard RadioGroup, and keyboard Switch must remain understandable without relying on color; Task 4 tests state and accessible names.
- Generated component relationships, demo registrations, source paths, public URLs, and token IDs must never drift from the catalog; Tasks 1, 6, and 7 add contract tests.

---

## File structure

### Shared UI source

- `components/ui/button.tsx` and `button.module.css`: native button behavior and visual variants.
- `components/ui/button-group.tsx` and `button-group.module.css`: labelled action grouping.
- `components/ui/field.tsx` and `field.module.css`: field context, label, description, and error composition.
- `components/ui/input.tsx`, `textarea.tsx`, `native-select.tsx`, and `form-control.module.css`: native form controls sharing one visual contract.
- `components/ui/checkbox.tsx`, `radio-group.tsx`, `switch.tsx`, and `selection-control.module.css`: native selection controls.
- `components/ui/alert.tsx`, `skeleton.tsx`, `empty-state.tsx`, `separator.tsx`, and `feedback.module.css`: status and structural primitives.

### Design catalog and generated resources

- `lib/design-system/component-options.ts`: ordered category and demo-key constants.
- `lib/design-system/component-catalog/*.ts`: focused metadata groups.
- `lib/design-system/components.ts`: stable aggregator preserving the current import path.
- `lib/design-system/schema.ts`: category, relationship, dependency, public-origin, and validation contracts.
- `lib/design-system/tokens.ts`, `lib/design-system/meta.ts`, `lib/design-system/serialize.ts`: status tokens, canonical origin, and generated output.
- `components/design-system/component-demo-*.tsx`: live demos split by responsibility.
- `components/design-system/component-demo-registry.tsx`: exhaustive demo map.
- `components/design-system/component-index.tsx` and `design-system.module.css`: grouped catalog.
- `components/design-system/ai-guide.tsx`: canonical AI instruction and final `www` links.

### Proof migrations and tests

- `components/content/document-index-toolbar.tsx` and its CSS: Field, Input, NativeSelect, and Button proof consumer.
- `app/(documents)/error.tsx` and `app/admin/(protected)/analytics/error.tsx`: Button proof consumers without changing copy or reset behavior.
- `tests/components/core-ui-*.test.tsx`: focused component behavior.
- existing `tests/design-system/*` and `tests/components/design-system-*.test.tsx`: generated-resource and documentation contracts.

---

### Task 1: Extend the catalog contract, tokens, and canonical AI origin

**Files:**
- Create: `lib/design-system/component-options.ts`
- Modify: `lib/design-system/schema.ts`
- Modify: `lib/design-system/meta.ts`
- Modify: `lib/design-system/tokens.ts`
- Modify: `lib/design-system/components.ts`
- Modify: `lib/design-system/serialize.ts`
- Modify: `app/globals.css`
- Modify: `components/design-system/ai-guide.tsx`
- Test: `tests/design-system/catalog.test.ts`
- Test: `tests/design-system/serialize.test.ts`
- Test: `tests/components/design-guide.test.tsx`

**Interfaces:**
- Produces: `componentCategories`, `ComponentCategory`, `componentDemoKeys`, and `DemoKey` from `lib/design-system/component-options.ts`.
- Produces: `DesignSystemMeta.publicOrigin: "https://www.laflabs.co"`.
- Produces: `ComponentEntry.relatedComponents: readonly string[]` and `ComponentEntry.dependencies: readonly string[]`.
- Produces: `color.info`, `color.success`, `color.warning`, and `color.error` tokens mapped to `--info`, `--success`, `--warning`, and `--error`.

- [ ] **Step 1: Write failing catalog and serializer tests**

Add assertions that lock the new contract:

```ts
expect(designCatalog.meta.publicOrigin).toBe("https://www.laflabs.co")
expect(designCatalog.tokens.filter(({ id }) => id.startsWith("color.")).map(({ id }) => id))
  .toEqual(expect.arrayContaining(["color.info", "color.success", "color.warning", "color.error"]))

for (const component of designCatalog.components) {
  expect(component.relatedComponents).toEqual(expect.any(Array))
  expect(component.dependencies).toEqual(expect.any(Array))
}

const guide = serializeDesignGuide()
expect(guide).toContain("https://www.laflabs.co/design/guide.md")
expect(guide).not.toContain("https://laflabs.co/design/")
```

Update the AI guide test to expect the exact Korean instruction to include all three canonical resources and the failure rule.

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```bash
npx vitest run tests/design-system/catalog.test.ts tests/design-system/serialize.test.ts tests/components/design-guide.test.tsx
```

Expected: failures for the missing `publicOrigin`, semantic tokens, component relationship fields, and old provider instruction.

- [ ] **Step 3: Add ordered component options and schema validation**

Create the options module:

```ts
export const componentCategories = [
  "brand",
  "action",
  "form",
  "selection",
  "navigation",
  "disclosure",
  "overlay",
  "feedback",
  "content",
  "structure",
] as const

export type ComponentCategory = typeof componentCategories[number]

export const componentDemoKeys = [
  "logo",
  "action",
  "button",
  "button-group",
  "field",
  "label",
  "input",
  "textarea",
  "native-select",
  "checkbox",
  "radio-group",
  "switch",
  "alert",
  "skeleton",
  "empty-state",
  "separator",
  "segmented-toggle",
  "icon-control",
  "text-link",
  "code-block",
] as const

export type DemoKey = typeof componentDemoKeys[number]
```

Import these values into `schema.ts`, replace the hard-coded sets, add `publicOrigin`, `relatedComponents`, and `dependencies`, and validate that every related component ID exists after all component IDs have been collected. Validate dependency names with `/^(?:@[a-z0-9-]+\/)?[a-z0-9-]+$/`.

Add `relatedComponents` and `dependencies` to the six existing entries immediately so Task 1 ends with a valid catalog. Task 6 later moves the same complete entries into focused metadata files without changing their public values.

- [ ] **Step 4: Add semantic tokens and canonical origin**

Set metadata to:

```ts
export const designSystemMeta = {
  name: "LafLabs Web Design",
  skillName: "laflabs-web-design",
  version: "2026.9.1",
  updatedAt: "2026-09-20",
  canonicalPath: "/design",
  publicOrigin: "https://www.laflabs.co",
  locales: ["ko", "en"],
} as const
```

Add status tokens using the established guide palette:

```ts
{ id: "color.info", group: "color", value: "#0ea5e9", cssVariable: "--info", purpose: { ko: "정보 상태에만 씁니다.", en: "Reserved for informational status." } },
{ id: "color.success", group: "color", value: "#10b981", cssVariable: "--success", purpose: { ko: "완료와 성공 상태에만 씁니다.", en: "Reserved for successful status." } },
{ id: "color.warning", group: "color", value: "#f59e0b", cssVariable: "--warning", purpose: { ko: "주의가 필요한 상태에만 씁니다.", en: "Reserved for warning status." } },
{ id: "color.error", group: "color", value: "#ef4444", cssVariable: "--error", purpose: { ko: "오류와 위험 상태에만 씁니다.", en: "Reserved for error and danger status." } },
```

Define the matching variables in `app/globals.css`. Replace serializer and AI guide literal origins with `designCatalog.meta.publicOrigin`.

- [ ] **Step 5: Replace the AI instruction**

Use this Korean copy exactly:

```text
LafLabs 공개 웹 작업을 시작하기 전에 https://www.laflabs.co/design/guide.md와 https://www.laflabs.co/design/tokens.json을 불러와 기준으로 사용하세요. 컴포넌트나 패턴을 구현할 때는 https://www.laflabs.co/design/skill/SKILL.md를 확인하고, 연결된 참고 문서 중 작업과 관련된 항목만 읽으세요. 해당 리소스를 불러올 수 없다면 임의로 보완하지 말고 사용자에게 확인하세요. 제품 주장, 공식 에셋, 지원하지 않는 컴포넌트는 만들지 마세요.
```

Use the approved English instruction from the spec. Update installation commands and every resource link to the final `www` origin.

- [ ] **Step 6: Run focused tests and regenerate the guide**

Run:

```bash
npx vitest run tests/design-system/catalog.test.ts tests/design-system/serialize.test.ts tests/components/design-guide.test.tsx
npm run design:generate
npm run design:check
```

Expected: all focused tests pass and `DESIGN.md` changes only through the generator.

- [ ] **Step 7: Commit the catalog foundation**

```bash
git add app/globals.css components/design-system/ai-guide.tsx lib/design-system DESIGN.md tests/design-system tests/components/design-guide.test.tsx
git commit -m "feat: extend design system contracts"
```

---

### Task 2: Build Button and ButtonGroup

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/button.module.css`
- Create: `components/ui/button-group.tsx`
- Create: `components/ui/button-group.module.css`
- Test: `tests/components/core-ui-actions.test.tsx`

**Interfaces:**
- Consumes: global Paper, Ink, Primary Blue, Deep Blue, Line, Error, and font variables.
- Produces: `ButtonProps`, `Button`, `ButtonGroupProps`, and `ButtonGroup`.

- [ ] **Step 1: Write failing action tests**

Cover safe type, native prop forwarding, variant and size data attributes, busy behavior, disabled behavior, handler suppression, labelled grouping, and long labels:

```tsx
render(<Button onClick={onClick}>Save changes</Button>)
expect(screen.getByRole("button", { name: "Save changes" })).toHaveAttribute("type", "button")

render(<Button loading onClick={onClick}>Save changes</Button>)
const busy = screen.getByRole("button", { name: "Save changes" })
expect(busy).toHaveAttribute("aria-busy", "true")
expect(busy).toBeDisabled()
await user.click(busy)
expect(onClick).not.toHaveBeenCalled()

render(<ButtonGroup label="문서 동작"><Button>저장</Button><Button>발행</Button></ButtonGroup>)
expect(screen.getByRole("group", { name: "문서 동작" })).toBeVisible()
```

- [ ] **Step 2: Run the test and verify missing-module failure**

```bash
npx vitest run tests/components/core-ui-actions.test.tsx
```

Expected: failure because `@/components/ui/button` and `button-group` do not exist.

- [ ] **Step 3: Implement Button**

Use the native button contract:

```tsx
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "inverse" | "danger"
  size?: "compact" | "default"
  loading?: boolean
}

export function Button({
  className,
  disabled = false,
  loading = false,
  size = "default",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ")
  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={classes}
      data-size={size}
      data-variant={variant}
      disabled={disabled || loading}
      type={type}
    />
  )
}
```

Style a 44px compact and 50px default control, reserve a one-pixel border in every variant, keep the label on one line, and remove transitions under reduced motion. Danger uses the Error token only for destructive actions.

- [ ] **Step 4: Implement ButtonGroup**

```tsx
export type ButtonGroupProps = HTMLAttributes<HTMLDivElement> & {
  label: string
  orientation?: "horizontal" | "vertical"
}

export function ButtonGroup({ label, orientation = "horizontal", className, ...props }: ButtonGroupProps) {
  return (
    <div
      {...props}
      aria-label={label}
      className={[styles.group, className].filter(Boolean).join(" ")}
      data-orientation={orientation}
      role="group"
    />
  )
}
```

Adjacent controls share borders through negative one-pixel margin, never rounded corners. Below 720px, a wrapping group preserves 44px targets instead of shrinking labels.

- [ ] **Step 5: Run action tests**

```bash
npx vitest run tests/components/core-ui-actions.test.tsx
```

Expected: all tests pass.

- [ ] **Step 6: Commit actions**

```bash
git add components/ui/button* components/ui/button-group* tests/components/core-ui-actions.test.tsx
git commit -m "feat: add core action components"
```

---

### Task 3: Build Field, Label, Input, Textarea, and NativeSelect

**Files:**
- Create: `components/ui/field.tsx`
- Create: `components/ui/field.module.css`
- Create: `components/ui/input.tsx`
- Create: `components/ui/textarea.tsx`
- Create: `components/ui/native-select.tsx`
- Create: `components/ui/form-control.module.css`
- Test: `tests/components/core-ui-forms.test.tsx`

**Interfaces:**
- Produces: `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `Label`, and an internal `useFieldControlProps` hook.
- Produces: `Input`, `Textarea`, and `NativeSelect`, each accepting native element attributes.
- Provides context values `{ controlId, descriptionId, errorId, invalid, required }` to nested controls.

- [ ] **Step 1: Write failing field relationship tests**

Use this representative composition:

```tsx
render(
  <Field invalid required>
    <FieldLabel>Email</FieldLabel>
    <Input aria-describedby="external-help" name="email" />
    <FieldDescription>Work address only.</FieldDescription>
    <FieldError>Enter a valid address.</FieldError>
  </Field>,
)

const input = screen.getByRole("textbox", { name: /Email/ })
expect(input).toBeRequired()
expect(input).toHaveAttribute("aria-invalid", "true")
expect(input.getAttribute("aria-describedby")?.split(" ")).toEqual([
  "external-help",
  expect.stringMatching(/-description$/),
  expect.stringMatching(/-error$/),
])
```

Also test a standalone `Label htmlFor`, Textarea rows, NativeSelect options, disabled states, and two Fields rendered together receiving unique IDs.

- [ ] **Step 2: Run the form test and verify failure**

```bash
npx vitest run tests/components/core-ui-forms.test.tsx
```

Expected: missing-module failures for all new form components.

- [ ] **Step 3: Implement Field context and compound parts**

Build a private context and stable `useId()` prefix. `FieldLabel` uses `htmlFor={controlId}`. Description and Error render only when children are not `null`, `undefined`, or an empty string. Merge described-by IDs without duplicates:

```ts
function mergeIds(...values: Array<string | undefined>): string | undefined {
  const ids = [...new Set(values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []))]
  return ids.length > 0 ? ids.join(" ") : undefined
}
```

The internal hook returns native control props while preserving caller values:

```ts
function useFieldControlProps(props: {
  id?: string
  required?: boolean
  "aria-invalid"?: Booleanish
  "aria-describedby"?: string
}) {
  const field = useContext(FieldContext)
  if (!field) return props
  return {
    ...props,
    id: props.id ?? field.controlId,
    required: props.required ?? field.required,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
    "aria-describedby": mergeIds(
      props["aria-describedby"],
      field.hasDescription ? field.descriptionId : undefined,
      field.hasError ? field.errorId : undefined,
    ),
  }
}
```

Export a standalone native Label for controls outside Field:

```tsx
export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={[styles.label, className].filter(Boolean).join(" ")} />
}
```

Determine description and error presence from direct compound children so IDs are present on the first render and never reference a missing element:

```tsx
function hasPart(children: ReactNode, part: typeof FieldDescription | typeof FieldError): boolean {
  return Children.toArray(children).some((child) => isValidElement(child) && child.type === part)
}

export function Field({ children, invalid = false, required = false, ...props }: FieldProps) {
  const prefix = useId()
  const value = {
    controlId: `${prefix}-control`,
    descriptionId: `${prefix}-description`,
    errorId: `${prefix}-error`,
    hasDescription: hasPart(children, FieldDescription),
    hasError: hasPart(children, FieldError),
    invalid,
    required,
  }
  return <FieldContext.Provider value={value}><div {...props} className={styles.field}>{children}</div></FieldContext.Provider>
}
```

Document that FieldDescription and FieldError are direct children of Field. Nested layout belongs inside their content, not around the compound parts.

- [ ] **Step 4: Implement native controls**

Input and Textarea apply the merged field props and forward all native attributes. NativeSelect wraps the native select in a positioned span with a Phosphor `CaretDown` marked `aria-hidden`; the select remains the only interactive element.

```tsx
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const fieldProps = useFieldControlProps(props)
  return <input {...props} {...fieldProps} className={[styles.control, props.className].filter(Boolean).join(" ")} />
}
```

Apply the same pattern to Textarea and NativeSelect without overriding caller event handlers or names.

- [ ] **Step 5: Style form states**

Use a 48px default block size, Paper background, Ink text, Line border, Ink hover border, two-pixel Primary focus outline, Muted placeholder, Error invalid border, and opacity plus `not-allowed` cursor for disabled. Textarea uses `min-height: 132px` and vertical resize. At 200% zoom and 320px width, controls remain `width: 100%` with no fixed inline width.

- [ ] **Step 6: Run form tests**

```bash
npx vitest run tests/components/core-ui-forms.test.tsx
```

Expected: all form relationship and native behavior tests pass.

- [ ] **Step 7: Commit forms**

```bash
git add components/ui/field* components/ui/input.tsx components/ui/textarea.tsx components/ui/native-select.tsx components/ui/form-control.module.css tests/components/core-ui-forms.test.tsx
git commit -m "feat: add core form components"
```

---

### Task 4: Build Checkbox, RadioGroup, and Switch

**Files:**
- Create: `components/ui/checkbox.tsx`
- Create: `components/ui/radio-group.tsx`
- Create: `components/ui/switch.tsx`
- Create: `components/ui/selection-control.module.css`
- Test: `tests/components/core-ui-selection.test.tsx`

**Interfaces:**
- Produces: `CheckboxProps` with `label`, `description?`, and `indeterminate?`.
- Produces: `RadioGroupProps` with `legend`, `name`, `options`, `value?`, `defaultValue?`, and `onValueChange?`.
- Produces: `SwitchProps` with `label` and `description?`, forwarding checkbox attributes except `type` and `role`.

- [ ] **Step 1: Write failing selection tests**

```tsx
const { rerender } = render(<Checkbox label="모두 선택" indeterminate />)
expect(screen.getByRole("checkbox", { name: "모두 선택" })).toHaveProperty("indeterminate", true)
rerender(<Checkbox label="모두 선택" indeterminate={false} checked readOnly />)
expect(screen.getByRole("checkbox", { name: "모두 선택" })).toBeChecked()

render(<RadioGroup legend="언어" name="locale" options={[{ value: "ko", label: "한국어" }, { value: "en", label: "English" }]} />)
await user.click(screen.getByRole("radio", { name: "English" }))
expect(screen.getByRole("radio", { name: "English" })).toBeChecked()

render(<Switch label="분석 허용" />)
await user.click(screen.getByRole("switch", { name: "분석 허용" }))
expect(screen.getByRole("switch", { name: "분석 허용" })).toBeChecked()
```

Test disabled controls and ensure every visible description is associated with its input.

- [ ] **Step 2: Run the selection test and verify failure**

```bash
npx vitest run tests/components/core-ui-selection.test.tsx
```

Expected: missing-module failures.

- [ ] **Step 3: Implement Checkbox**

Use a native checkbox, set `input.indeterminate` in a cleanup-safe effect, and expose `aria-checked="mixed"` while indeterminate. Render label and optional description as text beside a square 18px control inside a 44px minimum row.

```tsx
export function Checkbox({ label, description, indeterminate = false, ...props }: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const descriptionId = useId()

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.indeterminate = indeterminate
    return () => { input.indeterminate = false }
  }, [indeterminate])

  return (
    <label className={styles.choice}>
      <input
        {...props}
        ref={inputRef}
        aria-checked={indeterminate ? "mixed" : props.checked}
        aria-describedby={description ? descriptionId : props["aria-describedby"]}
        type="checkbox"
      />
      <span><span>{label}</span>{description ? <span id={descriptionId}>{description}</span> : null}</span>
    </label>
  )
}
```

- [ ] **Step 4: Implement RadioGroup**

Use a native `fieldset` and visible `legend`. Controlled mode checks `value`; uncontrolled mode uses `defaultValue`. The change handler calls `onValueChange(event.currentTarget.value)` without preventing the native change.

```ts
export type RadioOption = Readonly<{
  value: string
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}>

export function RadioGroup({ legend, name, options, value, defaultValue, onValueChange }: RadioGroupProps) {
  return (
    <fieldset className={styles.group}>
      <legend>{legend}</legend>
      {options.map((option) => (
        <label className={styles.choice} key={option.value}>
          <input
            checked={value === undefined ? undefined : value === option.value}
            defaultChecked={value === undefined ? defaultValue === option.value : undefined}
            disabled={option.disabled}
            name={name}
            onChange={(event) => onValueChange?.(event.currentTarget.value)}
            type="radio"
            value={option.value}
          />
          <span><span>{option.label}</span>{option.description ? <span>{option.description}</span> : null}</span>
        </label>
      ))}
    </fieldset>
  )
}
```

- [ ] **Step 5: Implement Switch**

Render `<input type="checkbox" role="switch">` with a stable visible label. The rectangular track and square thumb use CSS state selectors. The label remains unchanged when toggled; checked state comes from the native input.

```tsx
export function Switch({ label, description, ...props }: SwitchProps) {
  const descriptionId = useId()
  return (
    <label className={styles.switchRow}>
      <span><span>{label}</span>{description ? <span id={descriptionId}>{description}</span> : null}</span>
      <span className={styles.switchControl}>
        <input {...props} aria-describedby={description ? descriptionId : props["aria-describedby"]} role="switch" type="checkbox" />
        <span aria-hidden className={styles.switchTrack}><span className={styles.switchThumb} /></span>
      </span>
    </label>
  )
}
```

- [ ] **Step 6: Run selection tests**

```bash
npx vitest run tests/components/core-ui-selection.test.tsx
```

Expected: all tests pass, including indeterminate updates and keyboard-operable native controls.

- [ ] **Step 7: Commit selection controls**

```bash
git add components/ui/checkbox.tsx components/ui/radio-group.tsx components/ui/switch.tsx components/ui/selection-control.module.css tests/components/core-ui-selection.test.tsx
git commit -m "feat: add core selection controls"
```

---

### Task 5: Build Alert, Skeleton, EmptyState, and Separator

**Files:**
- Create: `components/ui/alert.tsx`
- Create: `components/ui/skeleton.tsx`
- Create: `components/ui/empty-state.tsx`
- Create: `components/ui/separator.tsx`
- Create: `components/ui/feedback.module.css`
- Test: `tests/components/core-ui-feedback.test.tsx`

**Interfaces:**
- Produces: `AlertProps` with `title`, `variant`, and optional `live`.
- Produces: `SkeletonProps` extending div attributes and always hidden from assistive technology.
- Produces: `EmptyStateProps` with `title`, `description`, and optional `action`.
- Produces: `SeparatorProps` with `decorative?` and `orientation?`.

- [ ] **Step 1: Write failing feedback tests**

```tsx
render(<Alert title="저장 실패" variant="error" live>다시 시도해 주세요.</Alert>)
expect(screen.getByRole("alert")).toHaveTextContent("저장 실패")
expect(screen.getByRole("alert")).toHaveAttribute("data-variant", "error")

render(<Skeleton data-testid="skeleton" />)
expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-hidden", "true")

render(<EmptyState title="문서가 없습니다" description="첫 문서를 작성해 주세요." action={<Button>작성</Button>} />)
expect(screen.getByRole("heading", { name: "문서가 없습니다" })).toBeVisible()

const { rerender } = render(<Separator />)
expect(screen.queryByRole("separator")).not.toBeInTheDocument()
rerender(<Separator decorative={false} orientation="vertical" />)
expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical")
```

- [ ] **Step 2: Run the feedback test and verify failure**

```bash
npx vitest run tests/components/core-ui-feedback.test.tsx
```

Expected: missing-module failures.

- [ ] **Step 3: Implement feedback and structure components**

Alert uses `role="alert"` only when `live` is true; otherwise it uses a named section so static guidance is not announced unexpectedly. Each status variant adds a Phosphor icon with `aria-hidden` and retains visible title text.

Skeleton is a Paper-to-Line opacity pulse only under `prefers-reduced-motion: no-preference`. EmptyState is a border-top composition, not a floating card. Separator renders a decorative `div` by default and a semantic `hr` or vertical role separator when `decorative={false}`.

```tsx
const alertIcons = {
  info: Info,
  success: CheckCircle,
  warning: Warning,
  error: WarningCircle,
} as const

export function Alert({ children, live = false, title, variant = "info", ...props }: AlertProps) {
  const titleId = useId()
  const AlertIcon = alertIcons[variant]
  return (
    <section
      {...props}
      aria-labelledby={titleId}
      className={styles.alert}
      data-variant={variant}
      role={live ? "alert" : undefined}
    >
      <AlertIcon aria-hidden className={styles.alertIcon} weight="bold" />
      <div><h3 id={titleId}>{title}</h3><div>{children}</div></div>
    </section>
  )
}

export function Skeleton(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} aria-hidden="true" className={[styles.skeleton, props.className].filter(Boolean).join(" ")} />
}

export function EmptyState({ action, description, title, ...props }: EmptyStateProps) {
  return <section {...props} className={styles.emptyState}><h3>{title}</h3><p>{description}</p>{action ? <div>{action}</div> : null}</section>
}

export function Separator({ decorative = true, orientation = "horizontal", ...props }: SeparatorProps) {
  if (decorative) return <div {...props} aria-hidden="true" className={styles.separator} data-orientation={orientation} />
  if (orientation === "horizontal") return <hr {...props} className={styles.separator} />
  return <div {...props} aria-orientation="vertical" className={styles.separator} role="separator" />
}
```

- [ ] **Step 4: Run feedback tests**

```bash
npx vitest run tests/components/core-ui-feedback.test.tsx
```

Expected: all tests pass.

- [ ] **Step 5: Commit feedback primitives**

```bash
git add components/ui/alert.tsx components/ui/skeleton.tsx components/ui/empty-state.tsx components/ui/separator.tsx components/ui/feedback.module.css tests/components/core-ui-feedback.test.tsx
git commit -m "feat: add core feedback components"
```

---

### Task 6: Expand the data-driven component catalog

**Files:**
- Create: `lib/design-system/component-catalog/existing.ts`
- Create: `lib/design-system/component-catalog/actions.ts`
- Create: `lib/design-system/component-catalog/forms.ts`
- Create: `lib/design-system/component-catalog/selection.ts`
- Create: `lib/design-system/component-catalog/feedback.ts`
- Modify: `lib/design-system/components.ts`
- Modify: `lib/design-system/component-slugs.ts`
- Modify: `lib/design-system/patterns.ts`
- Modify: `tests/design-system/catalog.test.ts`

**Interfaces:**
- Consumes: all Delivery A source paths and `ComponentEntry`.
- Produces: the existing `components` export with 20 unique entries in category order.
- Produces: valid `relatedComponents` references and exact package dependencies for source files that import an external package; components with no external source import use an empty dependency array.

- [ ] **Step 1: Write failing catalog completeness tests**

```ts
expect(designCatalog.components.map(({ id }) => id)).toEqual([
  "logo",
  "action",
  "button",
  "button-group",
  "field",
  "label",
  "input",
  "textarea",
  "native-select",
  "checkbox",
  "radio-group",
  "switch",
  "segmented-toggle",
  "icon-control",
  "text-link",
  "alert",
  "skeleton",
  "empty-state",
  "separator",
  "code-block",
])

for (const component of designCatalog.components) {
  expect(existsSync(resolve(process.cwd(), component.sourcePath))).toBe(true)
  expect(component.demoKey).toBe(component.id)
}
```

Add validation tests that reject unknown related components, unsafe dependencies, duplicate demo keys, and empty localized usage guidance.

- [ ] **Step 2: Run catalog tests and verify failure**

```bash
npx vitest run tests/design-system/catalog.test.ts
```

Expected: component list and new validation cases fail.

- [ ] **Step 3: Split and populate component metadata**

Move the existing six entries unchanged into `component-catalog/existing.ts`, adding category-compatible values, empty dependency arrays, and real related-component IDs. Add Delivery A entries to the other group files. Expand `designComponentSlugs` to the same ordered 20 IDs so static route typing and catalog tests remain aligned.

Every entry includes:

```ts
{
  id: "button",
  name: "Button",
  category: "action",
  maturity: "candidate",
  summary: { ko: "현재 화면에서 동작을 실행합니다.", en: "Runs an action in the current interface." },
  whenToUse: { ko: "저장, 제출, 확인처럼 즉시 실행되는 동작에 씁니다.", en: "Use it for immediate actions such as save, submit, and confirm." },
  whenNotToUse: { ko: "다른 주소로 이동할 때는 Action이나 Text Link를 씁니다.", en: "Use Action or Text Link for navigation." },
  accessibility: { ko: "동작을 설명하는 이름을 유지하고 busy와 disabled 상태를 함께 알립니다.", en: "Keep an action-specific name and expose busy and disabled states." },
  sourcePath: "components/ui/button.tsx",
  demoKey: "button",
  importExample: 'import { Button } from "@/components/ui/button"',
  usageExample: '<Button type="submit">Save</Button>',
  relatedComponents: ["action", "button-group", "icon-control"],
  dependencies: [],
  states: [
    { id: "default", guidance: { ko: "실행 가능한 기본 상태와 이름을 확인합니다.", en: "Inspect the enabled default state and accessible name." } },
    { id: "hover", guidance: { ko: "색 변화가 배치를 움직이지 않는지 확인합니다.", en: "Confirm the color change does not move layout." } },
    { id: "focus-visible", guidance: { ko: "키보드 초점 표시가 선명한지 확인합니다.", en: "Confirm keyboard focus remains clearly visible." } },
    { id: "disabled", guidance: { ko: "비활성 상태에서 실행되지 않는지 확인합니다.", en: "Confirm the disabled action cannot run." } },
    { id: "loading", guidance: { ko: "이름을 유지하면서 busy 상태를 알리는지 확인합니다.", en: "Confirm busy state is exposed without replacing the label." } },
    { id: "danger", guidance: { ko: "파괴적 동작에만 Error 색을 쓰는지 확인합니다.", en: "Confirm Error color is reserved for destructive actions." } },
  ],
  props: [
    { name: "variant", type: '"primary" | "secondary" | "inverse" | "danger"', required: false, description: { ko: "동작의 위계와 의미를 정합니다.", en: "Sets action hierarchy and semantics." } },
    { name: "size", type: '"compact" | "default"', required: false, description: { ko: "컨트롤 밀도를 정합니다.", en: "Sets the control density." } },
    { name: "loading", type: "boolean", required: false, description: { ko: "중복 실행을 막고 busy 상태를 알립니다.", en: "Prevents duplicate activation and exposes busy state." } },
    { name: "type", type: '"button" | "submit" | "reset"', required: false, description: { ko: "기본값은 button입니다.", en: "Defaults to button." } },
    { name: "children", type: "ReactNode", required: true, description: { ko: "동작을 설명하는 짧은 이름입니다.", en: "A short action-specific label." } },
  ],
}
```

Write full localized states and props for every new component. Do not use generated filler or repeat Button wording for unrelated components.

- [ ] **Step 4: Update composition patterns**

Add related components where current patterns can now use Field, Button, EmptyState, and Separator. Do not add a generic card pattern.

- [ ] **Step 5: Run catalog tests**

```bash
npx vitest run tests/design-system/catalog.test.ts
```

Expected: all catalog integrity and source-path tests pass.

- [ ] **Step 6: Commit catalog entries**

```bash
git add lib/design-system/components.ts lib/design-system/component-slugs.ts lib/design-system/component-catalog lib/design-system/patterns.ts tests/design-system/catalog.test.ts
git commit -m "feat: catalog core UI components"
```

---

### Task 7: Add live demos, grouped discovery, and generated documentation

**Files:**
- Create: `components/design-system/component-demo-actions.tsx`
- Create: `components/design-system/component-demo-forms.tsx`
- Create: `components/design-system/component-demo-selection.tsx`
- Create: `components/design-system/component-demo-feedback.tsx`
- Modify: `components/design-system/component-demo-registry.tsx`
- Modify: `components/design-system/component-index.tsx`
- Modify: `components/design-system/design-system.module.css`
- Modify: `components/design-system/component-detail.tsx`
- Modify: `lib/design-system/serialize.ts`
- Modify: `tests/components/design-system-pages.test.tsx`
- Modify: `tests/components/design-system-primitives.test.tsx`
- Modify: `tests/design-system/serialize.test.ts`
- Modify: `tests/design-system/routes.test.ts`

**Interfaces:**
- Consumes: all catalog entries and source components.
- Produces: `componentDemos satisfies Record<DemoKey, ComponentType<ComponentDemoProps>>`.
- Produces: grouped component sections in the ordered categories from Task 1.
- Produces: generated guide and Skill component reference containing all 20 components and final canonical links.

- [ ] **Step 1: Write failing demo and grouped-page tests**

Assert that every demo key renders, category headings appear only when populated, component links remain localized, and long Korean examples fit the document:

```tsx
for (const component of designCatalog.components) {
  const Demo = componentDemos[component.demoKey]
  const { unmount } = render(<Demo locale="ko" />)
  expect(document.body).not.toBeEmptyDOMElement()
  unmount()
}

render(<ComponentIndex locale="ko" />)
expect(screen.getByRole("heading", { name: "폼" })).toBeVisible()
expect(screen.getByRole("heading", { name: "선택" })).toBeVisible()
expect(screen.getByRole("link", { name: /Button 자세히 보기/ })).toHaveAttribute("href", "/design/components/button")
```

Add serializer assertions for Button, Field, Switch, Empty State, related-component links, dependencies, and `www` URLs.

- [ ] **Step 2: Run design-system tests and verify failure**

```bash
npx vitest run tests/components/design-system-pages.test.tsx tests/components/design-system-primitives.test.tsx tests/design-system/serialize.test.ts tests/design-system/routes.test.ts
```

Expected: missing demo registrations, missing groups, and missing serialized entries.

- [ ] **Step 3: Build focused demo modules**

Each demo module exports a typed map. Demos use real components and local state only when interaction is the state being demonstrated. Example:

```tsx
export function InputDemo({ locale, state }: ComponentDemoProps) {
  const invalid = state === "invalid"
  return (
    <Field invalid={invalid}>
      <FieldLabel>{locale === "ko" ? "연락처" : "Contact"}</FieldLabel>
      <Input disabled={state === "disabled"} placeholder="contact@laflabs.co" />
      {invalid ? <FieldError>{locale === "ko" ? "주소를 확인해 주세요." : "Check the address."}</FieldError> : null}
    </Field>
  )
}
```

Skeleton demos render a labelled `aria-busy` wrapper. Empty State demos use no invented product claims. Feedback and destructive variants use plain interface copy.

- [ ] **Step 4: Make the registry exhaustive**

Merge the group maps and retain existing demos:

```ts
export const componentDemos = {
  ...existingDemos,
  ...actionDemos,
  ...formDemos,
  ...selectionDemos,
  ...feedbackDemos,
} satisfies Record<DemoKey, ComponentType<ComponentDemoProps>>
```

- [ ] **Step 5: Group the component index**

Add bilingual group labels and descriptions. Render only categories with entries. Keep one continuous shell width, use headings plus one-pixel rules instead of cards, and stack each component row at 720px. The group order comes from `componentCategories`, not object enumeration.

- [ ] **Step 6: Enrich detail and serialization output**

Render related component links and dependency information on detail pages. Serializer output includes `Related components` and `Dependencies` only when arrays are non-empty. Preserve deterministic sorting and exact final-origin links.

- [ ] **Step 7: Run documentation tests and generation**

```bash
npx vitest run tests/components/design-system-pages.test.tsx tests/components/design-system-primitives.test.tsx tests/design-system/serialize.test.ts tests/design-system/routes.test.ts
npm run design:generate
npm run design:check
```

Expected: tests pass, generated `DESIGN.md` lists all 20 components, and no generated artifact is stale.

- [ ] **Step 8: Commit documentation expansion**

```bash
git add components/design-system lib/design-system/serialize.ts DESIGN.md tests/components/design-system-pages.test.tsx tests/components/design-system-primitives.test.tsx tests/design-system/serialize.test.ts tests/design-system/routes.test.ts
git commit -m "feat: expand core UI documentation"
```

---

### Task 8: Migrate low-risk proof consumers

**Files:**
- Modify: `components/content/document-index-toolbar.tsx`
- Modify: the toolbar's existing CSS module
- Modify: `app/(documents)/error.tsx`
- Modify: `app/admin/(protected)/analytics/error.tsx`
- Modify: `tests/components/document-index-layout.test.ts`
- Modify: `tests/components/document-pages.test.tsx`
- Modify: `tests/components/analytics-dashboard.test.tsx`

**Interfaces:**
- Consumes: `Button`, `Field`, `FieldLabel`, `Input`, and `NativeSelect`.
- Preserves: all field names, query parameters, submit/reset handlers, analytics behavior, visible copy, and public routes.

- [ ] **Step 1: Add proof-migration assertions**

Extend existing tests to assert that the toolbar keeps its current labels, selected values, query submission, reset behavior, and mobile order. Add retry-button assertions to both error surfaces.

```tsx
expect(screen.getByRole("textbox", { name: /검색/ })).toHaveAttribute("name", "q")
expect(screen.getByRole("combobox", { name: /종류/ })).toHaveAttribute("name", "kind")
expect(screen.getByRole("button", { name: /초기화/ })).toHaveAttribute("type", "button")
```

- [ ] **Step 2: Run consumer tests before migration**

```bash
npx vitest run tests/components/document-index-layout.test.ts tests/components/document-pages.test.tsx tests/components/analytics-dashboard.test.tsx
```

Expected: current behavior passes, establishing the migration baseline.

- [ ] **Step 3: Replace matching raw controls**

Wrap toolbar fields with Field and FieldLabel, replace text input with Input, native selects with NativeSelect, and submit/reset actions with Button. Preserve the form's existing URL and handler logic. Replace only retry buttons on error surfaces; do not restyle the surrounding page.

- [ ] **Step 4: Remove superseded local control CSS**

Delete only declarations now owned by Core UI. Keep toolbar grid, responsive order, width, and page-specific spacing in its local module.

- [ ] **Step 5: Run consumer and Core UI tests**

```bash
npx vitest run tests/components/document-index-layout.test.ts tests/components/document-pages.test.tsx tests/components/analytics-dashboard.test.tsx tests/components/core-ui-actions.test.tsx tests/components/core-ui-forms.test.tsx
```

Expected: behavior remains unchanged and Core UI tests still pass.

- [ ] **Step 6: Commit proof migrations**

```bash
git add components/content app/'(documents)'/error.tsx app/admin/'(protected)'/analytics/error.tsx tests/components
git commit -m "refactor: adopt core UI in shared surfaces"
```

---

### Task 9: Complete generated artifacts and full verification

**Files:**
- Modify: `.impeccable/design.json`
- Modify: `DESIGN.md` through the generator only
- Modify: tests only if verification exposes a real contract omission

**Interfaces:**
- Consumes: the finished Delivery A components, catalog, tokens, and generated guide.
- Produces: an Impeccable schema version 2 sidecar containing the current token metadata and 5-10 representative Core UI snippets without replacing `DESIGN.md`.

- [ ] **Step 1: Refresh the Impeccable sidecar only**

Preserve the generated `DESIGN.md`. Update `.impeccable/design.json` to schema version 2 using the current Paper, Ink, Primary Blue, zero-radius, one-pixel, motion, and breakpoint contracts. Include representative self-contained snippets for Primary Button, Secondary Button, Input, Checkbox, Switch, Alert, Site Navigation, and Segmented Toggle. Prefix snippet classes with `ds-` and use literal CSS or public CSS variables only.

- [ ] **Step 2: Regenerate and check design artifacts**

```bash
npm run design:generate
npm run design:check
git diff --check
```

Expected: generation is deterministic and the diff contains no whitespace errors.

- [ ] **Step 3: Run all automated verification**

```bash
npm test
```

Expected: design check, typecheck, lint, unit tests, and production build all pass.

- [ ] **Step 4: Run the Impeccable detector once**

```bash
node /home/singlethread/.codex/skills/impeccable/scripts/detect.mjs --json \
  components/ui \
  components/design-system \
  components/content/document-index-toolbar.tsx \
  app/'(documents)'/design
```

Expected: no unresolved design-rule findings. Fix all findings in one batch and rerun only the focused tests affected by those fixes.

- [ ] **Step 5: Perform one combined browser defect pass**

Run the dev server and inspect these routes at desktop and mobile widths in Korean and English:

```text
/design/components
/design/components/button
/design/components/field
/design/components/checkbox
/design/components/alert
/design/ai
/notices
```

Check keyboard focus, long Korean strings, 320px overflow, 200% zoom, invalid fields, disabled and busy actions, reduced motion, and touch targets. Record all visible defects, fix them in one batch, then perform one confirmation pass.

- [ ] **Step 6: Re-run final checks after visual fixes**

```bash
npm run design:check
npm run typecheck
npm run lint
npm run test:unit
npm run build
git diff --check
git status --short
```

Expected: all checks pass and only intended Delivery A changes remain.

- [ ] **Step 7: Commit verification artifacts**

```bash
git add .impeccable/design.json DESIGN.md app components lib tests package.json package-lock.json
git commit -m "chore: verify LafLabs core UI delivery"
```

---

## Follow-up plan boundary

Delivery B receives a separate implementation plan after Delivery A is reviewed. That plan introduces the unified `radix-ui` dependency and implements Select, Dropdown Menu, Dialog, Tabs, Accordion, and Tooltip against the stable tokens, Field contract, catalog schema, and documentation structure produced here.
