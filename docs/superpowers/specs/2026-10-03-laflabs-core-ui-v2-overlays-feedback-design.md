# LafLabs Core UI v2 C3C Design

## Context

C3A established shared action and selection contracts. C3B established compound form composition. C3C applies the same source-owned model to navigation, overlays, loading, and feedback.

The existing components work individually, but they do not yet feel like one system:

- Pagination is a collection of separate boxes rather than one calm navigation control.
- Dialog always injects its close control and offers no explicit body or size contract.
- AlertDialog duplicates Button styling instead of composing the shared action family.
- Spinner rotates a circular icon even though the LafLabs geometry is square.
- Toast has no implementation.
- Alert requires a title prop and provides little compositional freedom.
- StatusLabel depends on a small marker that reads as decoration more often than state.

The redesign must reach the compositional usefulness associated with shadcn while retaining LafLabs-owned APIs, CSS Modules, square geometry, and restrained motion. Radix remains an implementation detail for focus-managed or gesture-managed behavior.

## Design read

This is an Operate-mode component system for developers building LafLabs public and Admin interfaces. The visual language is square, technical, light, and B2B-oriented, using Paper, Ink, Line, and Primary Blue with semantic colors only when state requires them.

- Design variance: 4. Layouts are orderly with limited asymmetric emphasis.
- Motion intensity: 3. Motion confirms state changes and never becomes decoration.
- Visual density: 6. Controls are compact enough for operational interfaces while retaining usable touch targets.

## Goals

- Give all seven components a coherent visual, compositional, and accessibility model.
- Preserve existing application behavior and current imports for one compatibility release.
- Make Dialog, AlertDialog, Alert, and Toast flexible compound components rather than rigid finished cards.
- Provide a real application-wide Toast lifecycle through `ToastProvider` and `useToast()`.
- Replace decorative or conflicting geometry with the LafLabs square visual language.
- Publish realistic demos, state guidance, and copyable examples for both people and AI consumers.
- Keep Korean and English copy, 320px layouts, 200% zoom, keyboard operation, and reduced motion as release requirements.

## Non-goals

- Installing shadcn or copying its default visuals.
- Replacing the existing `radix-ui` package.
- Adding rounded corners, pills, shadows, gradients, or ornamental motion.
- Migrating every application call site during C3C.
- Publishing the future npm installer or registry.
- Building a notification inbox, persistent notification history, or server-backed delivery system.
- Expanding into Drawer, Sheet, Banner, Progress, or Command components in this delivery.

## Architecture

### Source ownership

LafLabs owns every public React API, CSS Module, test, catalog entry, demo, and generated reference. Radix supplies behavior where native HTML does not provide a complete focus or gesture contract:

- Dialog and AlertDialog use Radix focus management, dismissal, and restoration.
- Toast uses Radix timing, swipe, viewport, and live-region behavior.
- Pagination, Spinner, Alert, and StatusLabel remain native React and HTML.

Application code imports only from `components/ui/*`. It does not import Radix primitives directly for these components.

### Shared surface grammar

Dialog, AlertDialog, Toast, and Alert share a small visual grammar rather than a single over-generalized component:

- one-pixel Line boundary;
- Paper surface and Ink text;
- square corners;
- Primary Blue focus outline;
- title, description, content, and action regions with consistent spacing;
- optional semantic edge or icon treatment only when meaning requires it.

The components may share internal helpers or CSS tokens, but their public semantics remain distinct.

### Compatibility policy

Current imports and common props remain valid for one design-system release:

- `DialogContent closeLabel` continues to render the existing visible close control.
- Existing `DialogHeader`, `DialogFooter`, `DialogTitle`, and `DialogDescription` imports remain valid.
- Existing Alert `title`, `variant`, and `live` props remain valid while compound children become the recommended API.
- Existing AlertDialog action and cancel imports remain valid while their visuals delegate to the shared Button contract.
- Existing Pagination exports remain valid.
- Existing Spinner sizes and required accessible label remain valid.
- Existing StatusLabel `variant` remains valid and maps to the new `tone` vocabulary internally.

Compatibility paths receive deprecation documentation only when a replacement name or structure exists. They do not emit runtime warnings in production.

## Component contracts

### Pagination

Pagination represents navigation between known result pages. It remains anchor-based so URLs, opening in a new tab, and browser navigation continue to work.

Recommended anatomy:

- `Pagination`
- `PaginationContent`
- `PaginationItem`
- `PaginationPrevious`
- `PaginationLink`
- `PaginationEllipsis`
- `PaginationNext`

Visual and responsive behavior:

- The control reads as one connected square rail with shared internal dividers.
- Previous and Next occupy the rail ends and use the shared icon-control sizing rules.
- The current page uses a Primary Blue surface and white text.
- Ellipsis is quiet text inside the rail, not a standalone bordered box.
- Disabled boundary controls remain visible and use native or ARIA-disabled semantics without becoming links that navigate.
- At narrow widths, callers render fewer neighboring pages. The component does not hide caller-provided destinations with CSS.
- A compact form may show Previous, the current page, and Next, but it remains real pagination rather than a decorative fraction.

Pagination does not fetch, calculate total pages, or own URL state.

### Dialog

Dialog supports focused forms, settings, and short contextual tasks. It is not used for destructive confirmation or long document reading.

Recommended anatomy:

- `Dialog`
- `DialogTrigger`
- `DialogPortal`
- `DialogOverlay`
- `DialogContent`
- `DialogHeader`
- `DialogTitle`
- `DialogDescription`
- `DialogBody`
- `DialogFooter`
- `DialogClose`

Content contract:

- `size`: `small | medium | large | full`, defaulting to `medium`.
- `scroll`: `content | body`, defaulting to `content` for compatibility.
- Content no longer requires an injected close button. A composed `DialogClose` is the preferred API.
- During the compatibility release, `closeLabel` injects the legacy close control when present.
- Header and Footer may become sticky only when `scroll="body"` is selected.
- `asChild` remains available on behavior primitives where Radix supports it and where native semantics stay explicit.

Behavior requirements:

- Focus moves into the dialog, remains trapped, and returns to the trigger.
- Escape and outside interaction close a standard Dialog unless the caller deliberately prevents the Radix event.
- Title and Description provide accessible naming and description.
- Long content scrolls inside the viewport without placing the close control or primary actions off-screen.
- At mobile widths, Dialog remains a centered inset surface rather than silently changing into a Sheet.

### AlertDialog

AlertDialog handles decisions that require an explicit response, especially destructive or difficult-to-reverse actions.

It reuses the Dialog surface rhythm while preserving AlertDialog semantics:

- outside interaction does not dismiss the decision;
- Escape behavior follows Radix AlertDialog defaults;
- Cancel and Action paths remain explicit;
- focus begins on the safest useful action unless the caller deliberately chooses otherwise.

Recommended anatomy remains:

- `AlertDialog`
- `AlertDialogTrigger`
- `AlertDialogPortal`
- `AlertDialogOverlay`
- `AlertDialogContent`
- `AlertDialogHeader`
- `AlertDialogTitle`
- `AlertDialogDescription`
- `AlertDialogBody`
- `AlertDialogFooter`
- `AlertDialogCancel`
- `AlertDialogAction`

`AlertDialogCancel` and `AlertDialogAction` delegate their visual contract to Button. The action supports primary and danger intent. Danger uses the approved destructive surface with white text. The component does not duplicate standalone button CSS.

### Spinner

Spinner indicates an indeterminate operation when a skeleton or inline pending label is not more informative.

- The visible geometry is a stationary square outline.
- A highlighted or missing perimeter segment advances around the four sides.
- The square itself does not rotate.
- Sizes remain `compact | default | large`.
- The accessible label remains required and is exposed through `role="status"` unless the caller supplies equivalent surrounding status semantics.
- Under reduced motion, the Spinner becomes a static pending square with one emphasized segment.
- Color follows `currentColor`, allowing use inside Button and Status surfaces without new color props.

The implementation may animate opacity or background position. It must not animate layout or rotate the complete geometry.

### Toast

Toast reports transient results without interrupting the current task. Persistent errors and required decisions belong in Alert or AlertDialog.

Public provider and hook:

```tsx
<ToastProvider>{children}</ToastProvider>

const toast = useToast()
toast.success("Saved")
toast.error("Upload failed", { description: "Try the file again." })
```

The hook exposes:

- `show(options)`
- `neutral(title, options)`
- `info(title, options)`
- `success(title, options)`
- `warning(title, options)`
- `error(title, options)`
- `update(id, options)`
- `dismiss(id?)`

Toast options support:

- stable optional ID;
- title;
- optional description;
- tone: neutral, info, success, warning, or error;
- optional action label and callback;
- optional cancel or dismiss label;
- duration, including deliberate persistence;
- callback after dismissal when a caller needs local cleanup.

Lifecycle and placement:

- The provider owns one viewport and an in-memory queue.
- At most three Toasts are visible. Newer items remain closest to the viewport edge.
- Additional items wait rather than causing an unbounded visual stack.
- Desktop placement is inline-end near the top shell while avoiding the Navbar.
- Mobile placement is above the safe-area bottom edge and does not cover primary fixed controls.
- Swipe dismissal follows logical inline direction and keyboard dismissal remains available.
- Success and informational Toasts use a finite default duration. Error Toasts receive a longer default but do not become permanently blocking without caller intent.
- Duplicate IDs update the current Toast instead of producing repeated messages.
- Route changes do not require server persistence; the provider lifetime determines whether a Toast remains visible.

Toast anatomy is exported for catalog demos and advanced composition, but ordinary application code uses `useToast()`.

### Alert

Alert communicates persistent inline information that remains relevant until the surrounding content changes.

Recommended anatomy:

- `Alert`
- `AlertIcon`
- `AlertContent`
- `AlertTitle`
- `AlertDescription`
- `AlertAction`

Visual behavior:

- A structural edge or icon cell identifies the feedback region.
- Semantic color is limited to that signal, icon, and necessary emphasis. The whole surface does not become a saturated semantic block.
- Body copy remains Ink or Muted for readability.
- Optional action aligns with content on wide layouts and moves below it at narrow widths.

Accessibility behavior:

- Static informational Alerts do not create a live region by default.
- `live` is reserved for newly created urgent feedback and maps to an assertive alert contract.
- Tone is always understandable from visible title or text, not color alone.
- The current `title` prop remains a compatibility shorthand for `AlertTitle`.

### StatusLabel

StatusLabel is compact metadata for a real entity state. It is not an interactive filter, category tag, or decorative badge.

- Tones: neutral, info, success, warning, and error.
- The default form uses text plus a semantic edge block or restrained surface.
- The decorative leading dot is removed.
- An optional Phosphor icon may be composed when it clarifies the state, but text remains required.
- Labels remain square and compact without becoming pills.
- Long localized labels may wrap only when the container explicitly allows it; the default remains one line with a documented overflow strategy.
- StatusLabel never creates a live region. A changing urgent status uses Alert or a separate status announcement.

## Motion and layering

- Overlay fade: 120-160ms.
- Dialog entry and exit: 160-200ms using opacity and a small block-axis translation.
- Toast entry, reorder, swipe, and exit: 160-240ms using transform and opacity.
- Spinner perimeter step: approximately 700-900ms per complete cycle.
- Hover and press feedback: no layout movement.
- `prefers-reduced-motion: reduce` removes automatic transform animation and uses immediate state changes.

The existing overlay z-index values are consolidated into a documented layer order:

1. sticky navigation;
2. popovers and menus;
3. Dialog or AlertDialog overlay;
4. Dialog or AlertDialog content;
5. Toast viewport.

Components must not introduce arbitrary local z-index values outside this scale.

## Catalog and documentation

C3C adds or updates catalog records and live demos for every redesigned component.

Each component page must show:

- purpose and semantic distinction;
- recommended compound anatomy;
- baseline example;
- realistic application composition;
- tones, sizes, and interactive states;
- keyboard and screen-reader behavior;
- mobile and reduced-motion behavior;
- copyable imports and usage;
- compatibility notes;
- related components and source path.

Required realistic demos include:

- a document list Pagination rail;
- a settings Dialog with a scrollable Body and action Footer;
- a destructive archive AlertDialog;
- Button pending state with the square Spinner;
- save, upload-error, and undo Toasts;
- an inline validation Alert with an action;
- document and asset lifecycle StatusLabels.

Catalog demos must use real LafLabs UI copy and clearly labelled sample states. They must not invent product performance, customers, availability, or operational claims.

## Application adoption boundary

C3C updates only call sites required to prove compatibility or integrate the root ToastProvider safely. Broad visual migration remains C3D.

Acceptable C3C proof points are:

- existing asset-library Dialog and AlertDialog behavior remains intact;
- one non-critical Admin mutation uses `useToast()` in addition to its durable inline error state;
- existing StatusLabel call sites compile and retain semantics;
- existing Dialog tests pass without rewriting callers to the new compound API.

C3C must not change routes, server mutations, analytics event names, form field names, or localized business copy as a side effect.

## Testing and release gates

Automated coverage includes:

- Pagination link, current-page, disabled-boundary, and accessible-label semantics;
- Dialog focus trap, focus restoration, Escape, outside dismissal, optional Close, size, and scroll modes;
- AlertDialog non-dismissal from outside interaction, cancel, primary action, and destructive action;
- Spinner required label, size, currentColor behavior, and reduced-motion state;
- Toast provider absence error, helper methods, queue limit, ID update, duration, action, dismissal, swipe contract, and live-region output;
- Alert compound and compatibility APIs, tones, action, and live behavior;
- StatusLabel tones, optional icon composition, ref forwarding, and absence of live-region semantics;
- catalog-to-demo completeness and generated-resource determinism.

Browser review covers:

- desktop and mobile component pages in Korean and English;
- 320px viewport and 200% text zoom;
- keyboard-only operation and visible focus;
- long content and nested scrolling;
- popup and Toast layering;
- long Korean and English labels;
- screen-reader naming and live announcements;
- reduced motion;
- light LafLabs component surfaces using the approved square geometry.

The release passes design generation checks, typecheck, lint, unit tests, production build, and the bounded Impeccable detector pass over changed UI targets.

## Delivery boundary

C3C is complete when the seven component families, tests, catalog records, demos, generated design resources, and limited compatibility proof points ship together. C3D remains responsible for cross-component recipes, the complete migration reference, broader application adoption, and final system-wide publication.
