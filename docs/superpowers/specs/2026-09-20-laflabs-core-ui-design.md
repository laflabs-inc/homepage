# LafLabs Core UI Design

## Context

LafLabs Web Design is now published for people and AI at `/design`, `/design/guide.md`, `/design/tokens.json`, and `/design/skill/SKILL.md`. The public machine resources are healthy: each canonical document and Skill reference returns a successful response with the correct content type and permissive CORS, the token payload parses as JSON, and the Skill archive passes ZIP integrity checks.

The current component catalog is too small to act as a practical starting point for another LafLabs website. It documents six components: Logo, Action, Segmented Toggle, Icon Control, Text Link, and Code Block. Meanwhile, the application contains many separate implementations of buttons, inputs, selects, disclosures, and overlays. Future sites would still need to invent most interface fundamentals.

The repository also contains two conflicting descriptions of the brand. The public guide describes the current Paper, Ink, Primary Blue, square system, while the root `DESIGN.md` and its Impeccable sidecar still describe the retired dark route-era interface. An AI that starts from repository files instead of the public guide can therefore follow the wrong visual system.

## Goals

- Provide a useful Core UI set for future LafLabs public websites and branded web surfaces.
- Keep component source owned by LafLabs and easy for humans and coding agents to inspect, copy, and adapt.
- Preserve the current square geometry, one-pixel rules, Paper and Ink surfaces, Primary Blue hierarchy, Geist and Pretendard typography, and restrained motion.
- Use native HTML where it already provides complete semantics and behavior.
- Use an accessibility primitive only where focus management, keyboard interaction, or portal behavior is genuinely complex.
- Document real states, APIs, accessibility requirements, and usage boundaries for every component.
- Keep the public guide, Skill references, search entries, sitemap, and machine resources generated from one catalog.
- Align the repository-level design source of truth with the published design system.

## Non-goals

- Installing the full default shadcn theme or adopting its visual styling.
- Copying shadcn components unchanged.
- Rebuilding the entire Admin interface in the first delivery.
- Publishing an npm package or shadcn registry before the APIs have been exercised in this repository.
- Adding data tables, calendars, date pickers, command palettes, sidebars, charts, or application-specific widgets.
- Introducing rounded cards, pill badges, shadows, gradients, or a second decorative accent.
- Making dense Admin workflows visually identical to public marketing and document surfaces.

## Decision

Core UI will use a hybrid owned-code architecture.

1. Native controls remain native. Button, Input, Textarea, Native Select, Checkbox, and similar controls use semantic HTML and LafLabs CSS Modules.
2. Composite controls use the unified `radix-ui` package behind LafLabs-owned wrappers. Select, Dropdown Menu, Dialog, Tabs, Accordion, and Tooltip use Radix behavior for focus, keyboard, dismissal, portal, and state contracts.
3. LafLabs owns every exported component file, prop contract, style sheet, catalog entry, demo, and test.
4. The shadcn project is a reference for source ownership, composition, documentation breadth, and API clarity only. Its default radius, cards, typography, color variables, and visual variants do not enter the project.

This approach avoids hand-maintaining difficult interaction primitives while keeping the visual language and public API under LafLabs control.

## Component scope

The work is divided into two implementation deliveries so each group can be reviewed and stabilized before the next one depends on it.

### Delivery A: Core controls and system alignment

#### Existing components retained

- `Logo`
- `Action`
- `IconControl`
- `SegmentedToggle`
- `TextLink`
- `CodeBlock`

#### New action and form components

- `Button`: in-place action or form submission with primary, secondary, inverse, and danger treatments.
- `ButtonGroup`: groups adjacent actions without turning them into a segmented value selector.
- `Field`: composes label, control, description, required state, and error message with stable IDs.
- `Label`: standalone native label for controls that cannot use `Field`.
- `Input`: text-like native input with default, disabled, read-only, invalid, and loading-adjacent states.
- `Textarea`: multiline native text input with the same field contract as Input.
- `NativeSelect`: default single-choice form control when native platform behavior is sufficient.
- `Checkbox`: binary or indeterminate selection.
- `RadioGroup`: one selection from a short visible set.
- `Switch`: immediate on/off setting. It is not interchangeable with Checkbox and requires a stable label.

#### New feedback and structure components

- `Alert`: persistent inline information, success, warning, or error message. Semantic color is reserved for genuine status and always paired with text or an icon.
- `Skeleton`: layout-preserving loading placeholder with reduced-motion behavior.
- `EmptyState`: concise empty result with an optional single recovery action.
- `Separator`: semantic or decorative one-pixel division without ad hoc border markup.

### Delivery B: Composite controls

- `Select`: custom single-choice popup for cases where grouping, descriptions, or consistent cross-platform presentation is required. Native Select remains the default.
- `DropdownMenu`: a menu of actions, not a value picker or site navigation replacement.
- `Dialog`: modal task or confirmation surface with focus trapping, close control, Escape handling, and focus restoration.
- `Tabs`: switches between related panels without navigation when all content belongs to one local task.
- `Accordion`: reveals and hides sections while preserving heading structure.
- `Tooltip`: brief supplementary text for pointer and keyboard users. It never carries required instructions.

Cards and badges are intentionally excluded. LafLabs groups content with spacing, surface changes, and rules. If repeated product needs later justify them, they will be designed as `Panel` and `StatusLabel` rather than imported as generic shadcn defaults.

## Public API rules

### Semantics before appearance

- Navigation uses links. In-place actions use buttons.
- `Action` remains backward compatible in the first delivery, but new in-place behavior uses `Button`.
- Every form control accepts native attributes wherever practical.
- Components expose refs and native event handlers without replacing browser behavior.
- Controlled and uncontrolled modes follow the underlying native or Radix primitive rather than adding a second state model.

### Variants

- Variants express real hierarchy or semantic state only.
- Size options are limited to compact, default, and mobile touch behavior where required.
- A `className` escape hatch is available for layout placement, not for replacing internal component styling.
- No generic `asChild` or polymorphic API is added unless a concrete use requires it.

### Composition

- Field owns label, description, error, and ID relationships but does not own form validation logic.
- ButtonGroup arranges actions. SegmentedToggle continues to represent exactly two mutually exclusive values.
- NativeSelect and Select have parallel naming where possible, but they are separate components with explicit usage guidance.
- Composite components expose named subcomponents only when their structure must remain flexible, following the compound component pattern used by Radix.

## Visual system

All Core UI components consume semantic values from the existing public tokens.

- Surface: Paper `#F8FAFC`
- Text and strong rule: Ink `#0F172A`
- Primary action and focus: Primary Blue `#2563EB`
- Quiet rule: Line `#CBD5E1`
- Secondary copy: Muted `#64748B`
- Radius: `0px`
- Rule width: `1px`
- Compact control: `34px` visual size with a minimum `44px` touch target on small screens

Delivery A adds explicit semantic status tokens for error, warning, success, and information. These colors may appear only when they communicate actual status. They do not become decorative accents, and status is also communicated through text, iconography, or structure.

Focus uses a visible two-pixel Primary Blue outline with sufficient offset. Hover and pressed treatments may change color and opacity but do not move layout. Reduced motion produces a complete static state immediately.

## Documentation experience

`/design/components` becomes a grouped catalog instead of one undifferentiated list. The primary groups are Brand, Actions, Forms, Selection, Navigation, Disclosure, Overlays, Feedback, Content, and Structure. Empty groups are not rendered.

Each component detail page contains:

1. Purpose and maturity.
2. When to use and when not to use.
3. An interactive production component preview.
4. A state matrix covering relevant default, hover, focus-visible, disabled, invalid, loading, empty, and reduced-motion states.
5. Props and composition contract.
6. Keyboard and screen-reader behavior.
7. Copyable import and usage examples.
8. Related components and patterns.
9. Source path.

The catalog remains data-driven. Adding a component entry automatically adds its detail route, design search entry, guide section, Skill component reference, and sitemap entry. Demo registration remains an explicit compile-time contract so a documented component cannot silently render an empty preview.

## AI consumption

The public AI instruction is revised to remove the redirect and name the Skill entry point explicitly:

> LafLabs public web work must begin by loading `https://www.laflabs.co/design/guide.md` and `https://www.laflabs.co/design/tokens.json` as the source of truth. When implementing components or patterns, load `https://www.laflabs.co/design/skill/SKILL.md` and only the references relevant to the task. If these resources cannot be loaded, do not improvise; ask the user. Do not invent product claims, official assets, or unsupported components.

The Korean version communicates the same rules naturally rather than translating word for word. The `/design/ai` page presents both versions with copy controls.

Canonical machine links in generated documents use `https://www.laflabs.co` directly. Automated contract tests verify successful serialization, absolute link integrity, unique token names, valid component references, and deterministic Skill ZIP output.

No custom shadcn registry is published in this phase. The component contracts need to stabilize before they become an installation interface. The catalog schema will keep dependency and source-path fields explicit so a registry can be added later without redesigning component metadata.

## Repository source of truth

`DESIGN.md` is updated to describe the current Paper, Ink, Primary Blue system and the Core UI rules. Retired route-era values remain documented only as legacy tokens in the public token catalog.

The Impeccable design sidecar is regenerated after `DESIGN.md` is aligned. Generated public resources continue to derive from `lib/design-system/*`; `DESIGN.md` is project guidance, not a second runtime catalog.

## Migration strategy

Delivery A does not mechanically replace every raw Admin control. It first migrates a small set of low-risk public or shared uses that match the new component intent exactly. This proves the APIs without mixing public brand work with an Admin redesign.

Candidate migrations are:

- design documentation copy and navigation buttons to Button where they perform in-place actions;
- public document index toolbar fields to Field, Input, and NativeSelect;
- shared error retry actions to Button;
- repeated one-pixel structural dividers to Separator where semantic grouping benefits.

Admin migration follows in focused work after the Core UI contracts stabilize. Existing controls remain valid until they are deliberately migrated. No form field names, analytics events, legal copy, or public routes change as a side effect.

## Accessibility behavior

- Native elements retain their native roles and keyboard behavior.
- Every control has an accessible name; placeholder text never substitutes for a label.
- Field connects label, description, and error message with stable IDs.
- Invalid controls use `aria-invalid` and an associated error message.
- Button, Checkbox, RadioGroup, Switch, Tabs, Accordion, Select, Dropdown Menu, Dialog, and Tooltip follow the relevant WAI-ARIA Authoring Practices keyboard contract.
- Dialog traps focus while open, includes a visible close action, closes on Escape unless a task explicitly prevents it, and restores focus to its trigger.
- Popup content remains usable at 320px width and with 200% text zoom.
- Focus indicators, disabled states, and status messages remain understandable without color.
- Motion honors `prefers-reduced-motion`.

## Failure and edge states

- Async Button keeps its label stable, exposes busy state, and prevents duplicate activation.
- Field error content does not shift unrelated layout more than necessary.
- Select and Dropdown Menu handle empty item collections with a disabled explanatory row.
- Dialog prevents background interaction and restores body state on unmount.
- Tooltip content is supplementary; hiding it never removes required information.
- Skeleton has fixed final-layout geometry to prevent cumulative layout shift.
- EmptyState supports long Korean and English strings without fixed-height clipping.

## Expected code areas

- `components/ui/*`: owned Core UI source and colocated CSS Modules.
- `lib/design-system/components.ts`: component metadata, props, states, relationships, and source paths.
- `lib/design-system/schema.ts`: category, relationship, and dependency metadata contracts.
- `components/design-system/*`: grouped index, live demos, state previews, and AI instruction copy.
- `lib/design-system/serialize.ts`: updated guide and Skill references.
- `lib/design-system/tokens.ts`: semantic status and control tokens.
- `app/(documents)/design/*`: existing data-driven routes with updated content.
- `DESIGN.md` and `.impeccable/design.json`: aligned repository guidance.
- focused public/shared consumers selected during Delivery A.
- unit, interaction, serialization, and route contract tests.

## Verification

Automated checks cover:

- native prop forwarding and correct link/button semantics;
- keyboard interaction for every composite component;
- focus restoration and dismissal for overlays;
- label, description, required, and error relationships;
- controlled and uncontrolled state contracts;
- disabled, invalid, busy, empty, and reduced-motion behavior;
- catalog-to-demo completeness;
- component relationship and source-path validity;
- deterministic Markdown, JSON, sitemap, and Skill ZIP generation;
- unique tokens and component IDs;
- lint, typecheck, unit tests, design drift check, and production build.

The final browser review covers the component index and representative detail pages together at desktop and mobile widths. It checks visual hierarchy, overflow, Korean and English copy, keyboard focus, long values, popup positioning, dialog scrolling, 200% zoom, reduced motion, and touch targets. Visual review is bounded to one combined defect pass and one confirmation pass.

## Delivery sequence

1. Align `DESIGN.md`, semantic tokens, schema, and AI instruction.
2. Implement and document Delivery A components.
3. Migrate the selected low-risk consumers.
4. Verify and publish Delivery A.
5. Implement the Radix-backed Delivery B components.
6. Verify component interactions and publish Delivery B.
7. Evaluate real usage before deciding whether to publish a LafLabs installation registry.
