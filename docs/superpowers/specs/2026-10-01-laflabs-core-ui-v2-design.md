# LafLabs Core UI v2 Design

## Context

The first LafLabs Core UI deliveries established an owned component catalog, public design pages, generated AI resources, and a useful set of native and Radix-backed controls. The system is now broad enough to reveal a second problem: several components overlap in purpose, some compound APIs are too rigid, and the public examples do not show enough realistic composition.

The most visible issues are:

- Action duplicates Button while switching between link and button semantics implicitly.
- IconControl duplicates an icon-sized Button.
- ButtonGroup groups DOM nodes but offers little composition beyond adjacency.
- SegmentedToggle is restricted to exactly two fixed-width options.
- Field connects one control correctly but does not compose complete form sections.
- InputGroup supports a narrow left-or-right addon layout.
- RadioGroup uses circular geometry that conflicts with the square LafLabs identity.
- Switch cannot express approved semantic checked states.
- Pagination, Dialog, AlertDialog, Spinner, Toast, Alert, and StatusLabel need a more coherent visual and compositional model.
- Catalog examples document isolated controls more often than real interface assemblies.

## Goals

- Remove conceptual overlap so a developer or AI can choose a component without guessing.
- Reach shadcn-level composition breadth while preserving LafLabs-owned source, square geometry, typography, tokens, and restrained motion.
- Make the component catalog useful as both a human reference and an AI implementation source.
- Keep existing application behavior stable while the public API migrates.
- Improve keyboard, focus, screen-reader, mobile, zoom, and reduced-motion behavior.
- Keep the public guide, generated Markdown, Skill references, DESIGN.md, demos, and source components synchronized.

## Non-goals

- Copying shadcn source or default visuals unchanged.
- Adopting rounded cards, pill controls, shadows, gradients, or decorative status colors.
- Adding a generic polymorphic asChild API.
- Rewriting all Admin screens in one pull request.
- Publishing the npm installer or registry in this delivery.
- Adding application-specific widgets before the foundational APIs stabilize.

## Architecture decision

Core UI v2 keeps the existing hybrid owned-code architecture.

1. Native controls remain native when the browser supplies complete semantics.
2. Radix remains the behavior layer for focus-managed overlays and composite popups.
3. LafLabs owns every exported API, CSS Module, catalog entry, demo, test, and generated reference.
4. shadcn is a reference for composition, state coverage, documentation quality, and source ownership only.
5. Public API cleanup uses one compatibility release: deprecated aliases remain importable but disappear from the recommended catalog and generated examples.

## Naming and semantic model

### Actions

- Button performs an in-place action or submits a form.
- ButtonLink navigates while sharing Button visual variants.
- TextLink is inline or editorial navigation.
- Action is deprecated. It delegates to Button or ButtonLink during the compatibility release.
- IconControl is deprecated. Button with size icon replaces it and requires an accessible name.
- ButtonGroup groups related actions or control fragments. It does not represent selected state.

### Selection and view switching

- SegmentedControl chooses exactly one value from two or more short peer options.
- Two to five options are recommended, but the component does not silently truncate larger arrays.
- Tabs switches visible content panels and retains tab semantics.
- ToggleGroup, if later added, represents independently pressed values and must not be conflated with SegmentedControl.
- SegmentedToggle is deprecated and delegates to SegmentedControl during the compatibility release.

### Forms

- Field represents one labelled control and its description or error.
- FieldGroup lays out related Fields.
- FieldSet and FieldLegend provide semantic grouping.
- FieldContent keeps label, title, description, and error aligned when a control sits beside them.
- FieldSeparator divides form sections sparingly.
- InputGroup composes a text control with inline or block addons inside one focus and validation boundary.

## Public component contracts

### Button family

Button and ButtonLink share:

- variants: primary, secondary, inverse, danger, ghost;
- sizes: compact, default, icon;
- stable focus, disabled, and pressed states;
- icons composed as children rather than component-specific icon props.

Button additionally supports loading and keeps its visible and accessible name stable. ButtonLink never exposes disabled button semantics. An icon-sized Button requires an aria-label.

Variant rules:

- Primary is the highest-priority action in a task region and should normally appear once.
- Secondary is a lower-priority action with a visible boundary.
- Inverse is reserved for Ink or Primary surfaces.
- Danger is reserved for destructive or difficult-to-reverse actions and uses a white foreground.
- Ghost is reserved for toolbars, input addons, and similarly low-emphasis surfaces.

### ButtonGroup family

The family contains ButtonGroup, ButtonGroupSeparator, and ButtonGroupText.

It supports:

- horizontal and vertical orientation;
- shared one-pixel boundaries without doubled rules;
- split actions;
- nested groups;
- text, InputGroup, Select, DropdownMenu, and Popover composition;
- compact mobile overflow or deliberate vertical layout rather than compressed labels.

### SegmentedControl

SegmentedControl accepts a readonly option array, controlled value, localized group label, change callback, and optional disabled options. It exposes a single-selection group contract with arrow-key navigation and roving focus.

The active surface follows the selected option's real width. It does not use a fixed pixel translation. Motion becomes immediate when reduced motion is requested.

### Field family

The family contains FieldSet, FieldLegend, FieldGroup, Field, FieldContent, FieldLabel, FieldTitle, FieldDescription, FieldError, and FieldSeparator.

Field supports vertical, horizontal, and responsive layouts. Invalid, required, and disabled state remains understandable without color. Native IDs and caller-provided aria-describedby values are preserved and merged, not replaced.

### InputGroup family

The family contains InputGroup, InputGroupInput, InputGroupTextarea, InputGroupAddon, InputGroupButton, and InputGroupText.

Addon alignment supports inline-start, inline-end, block-start, and block-end. DOM order remains accessible even when visual placement changes. Focus, invalid, disabled, and read-only styling applies to the group boundary rather than creating several competing borders.

### Selection controls

- Checkbox remains square and uses check or mixed marks.
- RadioGroup uses a square outer control with a smaller filled square for selection. It never reuses the Checkbox check mark.
- Switch keeps the approved square track and thumb. Its checked tone may be primary, success, warning, danger, or neutral, using design tokens only.

### Navigation, overlays, and feedback

- Pagination becomes one connected square rail with previous and next at the ends, quiet ellipsis, and a strong current page. A compact current-position variant is available for constrained layouts.
- Dialog exposes independently composable Trigger, Portal, Overlay, Content, Header, Title, Description, Body, Footer, and Close parts. Content supports small, medium, large, and full sizes plus scrolling.
- AlertDialog reuses the same visual shell but preserves mandatory decision semantics and explicit cancel and action paths.
- Spinner uses a stationary square outline whose gap travels around the perimeter. Reduced motion shows a static pending indicator.
- Toast is the public name. It supports title, description, semantic tone, action, cancel, duration, ID-based update, and deliberate dismissal. NoticeToast remains a deprecated alias.
- Alert uses a clear semantic rail or icon cell, content, and optional action rather than only recoloring a top border.
- StatusLabel removes the decorative dot and uses a compact semantic surface or edge block with text.

## Visual rules

- Paper #F8FAFC, Ink #0F172A, Primary Blue #2563EB, Line #CBD5E1, and Muted #64748B remain the foundation.
- Radius remains 0px.
- Connected controls share one outer frame and one-pixel internal rules.
- Focus uses a two-pixel Primary Blue outline and cannot be clipped by a parent.
- Semantic colors are reserved for real state. They are paired with text, iconography, or structure.
- Components do not move layout on hover, press, focus, or loading.
- Controls remain usable at 320px width and 200% text zoom.

## Documentation model

Every public component detail page contains:

1. Purpose and semantic distinction.
2. When to use and when not to use.
3. Basic production example.
4. Real composition example.
5. Anatomy.
6. Variants and interactive states.
7. Keyboard and screen-reader behavior.
8. Do and do-not examples.
9. Props and compatibility notes.
10. Copyable import and usage code.
11. Related components and source path.

Action and IconControl disappear from the recommended component index. Their source remains available during the compatibility release with deprecation annotations. SegmentedToggle is replaced in the index by SegmentedControl.

Examples prioritize actual assemblies such as a publish toolbar, document settings FieldSet, search InputGroup, destructive AlertDialog, and data-list Pagination. A grid of visually similar isolated controls is not sufficient documentation.

## Migration policy

- Internal call sites move to Button, ButtonLink, and SegmentedControl as their owning delivery lands.
- Deprecated aliases preserve current props and behavior for one public design-system version.
- Compatibility aliases are tested but are not used in new examples.
- The following release may remove aliases only after repository search confirms no internal uses and the migration is announced in the generated guide.
- No route, copy, analytics event, form field name, or server behavior changes as a side effect.

## Delivery sequence

### Delivery C3A: actions and selection navigation

- Button and ButtonLink shared contract.
- Action and IconControl compatibility aliases.
- ButtonGroup compound API.
- SegmentedControl and SegmentedToggle compatibility alias.
- Internal migrations and complete catalog examples.

### Delivery C3B: form composition

- Field family expansion.
- InputGroup family expansion.
- RadioGroup square indicator.
- Switch checked-tone variants.
- Form recipes and Admin proof migrations.

### Delivery C3C: overlays, navigation, and feedback

- Pagination redesign.
- Dialog and AlertDialog shared shell.
- Square-gap Spinner.
- Toast API and lifecycle redesign.
- Alert and StatusLabel redesign.

### Delivery C3D: system publication

- Cross-component recipes and state matrices.
- Generated guide, Skill references, tokens, and DESIGN.md alignment.
- Deprecation and migration reference.
- Representative application adoption.
- Mobile, zoom, keyboard, reduced-motion, and production-build verification.

## Verification

Automated tests cover:

- correct button versus link semantics;
- deprecated alias compatibility;
- icon-button accessible names;
- Button loading and duplicate activation prevention;
- ButtonGroup orientation and compound parts;
- SegmentedControl two, three, and five-option selection, disabled values, keyboard navigation, and reduced motion;
- Field ID and accessibility relationships;
- InputGroup focus and invalid propagation;
- RadioGroup, Switch, Pagination, Dialog, AlertDialog, Toast, and Spinner interaction contracts;
- catalog-to-demo completeness and generated resource determinism.

Final browser review covers desktop and mobile component pages, 320px width, 200% zoom, long Korean and English labels, keyboard-only operation, popup layering, overlay scrolling, live-region announcements, and reduced motion.
