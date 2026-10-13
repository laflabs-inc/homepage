---
version: 1
slug: "admin-workspace"
primary_target: "app/admin/(protected)/layout.tsx"
related_targets: ["components/admin/admin-workspace.tsx","components/admin/admin-workspace.module.css","components/admin/admin-page.tsx","components/admin/admin-page.module.css","lib/admin/navigation.ts"]
---

## Scope and Mode

LafLabs Admin, Operate. The primary user is an authenticated LafLabs operator publishing documents, managing media, reading consented analytics, and configuring bounded system settings.

## Operator Job and Actions

Find the correct operational area quickly, understand the current page and state, complete a focused task, and recover from loading or request failures without losing saved data. Public-site discovery is secondary and remains available from the workspace footer.

## Content and Constraints

Use the existing GitHub organization-membership gate. Preserve API payloads, authorization, document lifecycle, storage behavior, analytics consent boundaries, and Agent settings contracts. Admin copy is bilingual and selected through the shared locale system. Do not expose credentials, provider payloads, stack traces, or invented operational data in recovery states.

## Chosen Direction

Quiet Operations. The interface extends the square Paper, Ink, and Primary Blue language into a dense operational workspace. Brand expression lives in exact rules, compact mono metadata, deliberate blue state signals, and clear page geometry rather than decorative dashboards.

## Workspace Shell

- Desktop uses a fixed 232px navigation rail and a fluid content column capped at 1500px.
- Navigation is grouped as Content, Operations, and System. Documents owns the nested Categories destination.
- Active state is exact for leaf routes and prefix-aware only for document detail and editor routes.
- The official logo returns to the public site; locale and public-site access remain at the bottom of the rail.
- At 900px and below, replace the rail with a sticky compact bar and a left Side Panel. The panel must close after navigation, on Escape, and restore focus to its trigger.
- At 420px and below, the wordmark may collapse to the official symbol while the accessible home name remains intact.

## Page Composition Interfaces

- `AdminPage` owns vertical page rhythm and accepts normal section attributes.
- `AdminPageHeader` owns breadcrumbs, one concise title, optional description, and page-level actions. Actions stack below copy on small screens.
- `AdminToolbar` groups filters and controls in a responsive grid. It always has an accessible label.
- `AdminSection` owns a titled operational region and optional local actions. It does not add a decorative card by default.
- `AdminRouteLoading` reserves recognizable header and content geometry and exposes a localized status label.
- `AdminRouteError` uses safe localized copy and one explicit retry action. Recovery copy must wrap instead of widening the workspace.

## Functional Boundaries

- Shell and page components are presentational. They must not own fetching, mutations, authorization, or domain-state transitions.
- Route files and existing feature components continue to own data and server actions.
- Shared Core UI components provide controls, fields, panels, alerts, dialogs, focus behavior, and status feedback.
- A new Admin destination is registered once in `lib/admin/navigation.ts` and receives localized labels from `lib/admin/i18n.ts`.
- Sign-in is intentionally outside the protected workspace. It has a compact independent masthead, the official logo, locale control, private-system context, and one GitHub membership action.

## Responsive and Resilience Rules

- Every grid and flex content child that can contain user text starts with `min-width: 0`.
- Long Korean, English, identifiers, and recovery copy wrap or truncate intentionally; they never create horizontal page overflow.
- Mobile controls retain at least a 44px target. Keyboard focus stays visible against Paper, Blue, and Ink surfaces.
- Loading, empty, error, disabled, and in-progress states communicate meaning in text rather than color alone.
- Motion is limited to state transitions and panel behavior. Reduced-motion users reach the final state immediately.
- Verify Korean and English at 1440px and 390px, including `document.documentElement.scrollWidth === window.innerWidth`.

## Delivery Boundary

PR A establishes the workspace shell and adopts it for Documents and Categories. PR B may migrate Analytics, Assets, Agent settings, and remaining editors, but must preserve the interfaces and functional boundaries above.

## Unresolved Decisions

No decision blocks PR A. Dense operational patterns should be evaluated during PR B using real feature data instead of speculative dashboard modules.
