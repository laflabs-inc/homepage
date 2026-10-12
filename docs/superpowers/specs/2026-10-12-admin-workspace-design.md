# LafLabs Admin Workspace Design

Date: 2026-10-12
Status: Approved
Delivery: Two pull requests

## Goal

Make every existing Admin route feel like one dependable LafLabs product without changing its business behavior. The redesign introduces a scalable workspace shell, a small set of Admin-only layout components, and consistent composition of the existing LafLabs Core UI primitives.

Success means an administrator can move between documents, categories, media, analytics, and AI settings without relearning page structure. The interface must remain useful on a 390px viewport, preserve Korean and English operation, and leave every current API contract and mutation payload unchanged.

## Scope

### Included

- A fixed desktop sidebar and a dismissible mobile navigation surface.
- Grouped navigation for Content, Operations, and System routes.
- Shared page header, toolbar, section, loading, error, and empty-state composition.
- Visual and responsive adoption across all existing protected Admin routes.
- A refined Admin sign-in surface that retains its current authentication behavior.
- Consistent use of the existing Core UI Button, ButtonGroup, Field, InputGroup, Combobox, Panel, Item, StatusLabel, SegmentedControl, Alert, Toast, EmptyState, Pagination, Dialog, and AlertDialog contracts.
- Localized navigation, page framing, and feedback in Korean and English.

### Excluded

- New Admin features, dashboard metrics, APIs, database migrations, or dependencies.
- Changes to document publication, media upload, analytics calculation, or Agent configuration behavior.
- Inquiry, email, AI-assistance, and careers-publishing work.
- A public-site navigation redesign.
- A replacement for existing Core UI primitives.

## Current Problems

The existing Admin routes are individually functional, but their page titles, actions, filters, content widths, state feedback, and navigation do not follow one predictable hierarchy. The horizontal navigation has no scalable grouping, categories appear as a peer of documents instead of related management, and each feature owns too much page-level CSS. Mobile layouts inherit desktop structure rather than expressing a deliberate Admin workspace.

## Design Direction

The Admin becomes a square, editorial workspace rather than a generic dashboard. It uses the existing paper background, deep navy ink, cobalt focus and active states, hard edges, mono metadata, and restrained rules. There are no gradients, shadows, decorative metric cards, oversized marketing typography, or invented dashboard content.

The desktop shell prioritizes stable navigation and work area. The mobile shell prioritizes the current route and a fast, accessible way to expose the same hierarchy.

## Information Architecture

Navigation is grouped as follows:

- **Content**
  - Documents: `/admin/documents`
  - Categories: `/admin/documents/categories`, visually nested under Documents
  - Media: `/admin/assets`
- **Operations**
  - Analytics: `/admin/analytics`
- **System**
  - AI settings: `/admin/agent`

`/admin` continues to redirect to `/admin/documents`. No overview dashboard is introduced. Document creation, editing, and the Markdown guide remain contextual document routes instead of permanent navigation items.

## Workspace Shell

### Desktop

At desktop widths, a 220–240px sidebar remains visible while the content area scrolls independently with the page. The sidebar contains:

1. Official LafLabs logo and a compact `PRIVATE ADMIN` label.
2. Grouped navigation with an explicit current-page state.
3. Locale control and public-home link at the bottom.

The active destination uses a cobalt square marker or left rule plus stronger text contrast. `aria-current="page"` communicates the same state semantically. Hover and focus do not move layout.

The main work area owns one responsive gutter and a broad maximum width appropriate for tables and editors. Individual pages no longer recreate the outer shell width or top spacing.

### Mobile

Below the desktop breakpoint, the sidebar is replaced by a compact top bar containing the official logo, current section label, and a square menu control. Activating the control opens a full-height navigation surface using the existing Dialog or SidePanel contract. The surface:

- traps focus while open;
- closes on Escape, close control, or destination selection;
- restores focus to the trigger;
- prevents background scrolling;
- exposes the same groups and localized labels as desktop;
- does not animate when reduced motion is requested.

The mobile content area stays within the viewport at 390px and never relies on horizontal page scrolling.

## Admin Layout Components

Only thin layout components are added. They do not restyle or duplicate Core UI primitives.

### `AdminWorkspace`

Owns desktop/mobile shell geometry and receives the authenticated Admin content. Authentication remains in the protected server layout.

### `AdminSidebar` and `AdminMobileNav`

Render one typed navigation model. Active-route resolution accounts for nested document routes so creation, detail, guide, and category pages keep the Documents section active.

### `AdminPage`

Provides the page's width, vertical rhythm, and main landmark. It accepts no business data.

### `AdminPageHeader`

Provides an eyebrow, title, concise description, optional breadcrumb, and optional action group. Primary actions remain at the upper right on wide screens and move below the heading at narrow widths.

### `AdminToolbar`

Composes search, filter, sort, and view controls. It reflows fields rather than shrinking them below usable sizes and uses existing Field, InputGroup, Combobox, SegmentedControl, and Button components.

### `AdminSection`

Provides a section heading and description around existing Panels, tables, charts, forms, or Items. It creates hierarchy without adding a decorative card around every block.

## Page Adoption

### Documents and Categories

The document list uses the shared page header, with New document as the primary action. Category management moves from the page header into the nested sidebar destination and optional contextual secondary action. Search and structured filters use one AdminToolbar. Results continue to use Panel, Item, StatusLabel, and Pagination.

The category page adds a Documents breadcrumb and clearly separates category creation from the managed collection. Existing create, update, reorder, and delete behavior remains unchanged. Destructive actions continue through AlertDialog.

### Document Creation, Editing, and Guide

The editor keeps its persistent Markdown source, explicit source/preview switch, draft state, and publication workflow. The page header holds document identity and status; the existing publishing ButtonGroup remains the single action hierarchy. Document settings use a deliberate Panel and Field composition. The Markdown guide adopts the shared page frame without changing renderer examples.

### Media

The media library uses the same header and toolbar rhythm as documents. Upload remains the primary action. Search, type, status, and tag filters retain their current URL and service behavior. Pending, processing, ready, failed, archived, deleting, and deleted states use existing feedback primitives consistently. Upload queue behavior and Blob APIs do not change.

### Analytics

Date range selection uses SegmentedControl in the page header or toolbar. Summary metrics read as one connected data region rather than unrelated cards. Charts, funnel, distributions, and tables use the same AdminSection heading contract. Empty data uses EmptyState and existing explanatory copy. Analytics queries and calculations remain unchanged.

### AI Settings

Credentials, model configuration, usage limits, and automation policy become distinct, named Panel sections. One coherent action area owns save and verification actions. Existing optimistic state, version-conflict refresh, verification diagnostics, and API payloads remain unchanged. Success and failure feedback use Alert and Toast consistently.

### Sign In

The sign-in route remains outside the authenticated workspace. It uses the same paper, ink, cobalt, square geometry, and private-system context, with one clear GitHub authentication action. Authentication providers and redirects do not change.

## Data and Behavior Boundaries

This project changes presentation composition only. Server pages continue to load their current data and pass the same props to feature components. Client components continue to call the same endpoints with identical methods and payloads. The new navigation model contains route metadata and localized labels only.

The shell introduces client state solely for mobile navigation visibility and active-route presentation. It does not create a global Admin data store.

## Loading, Error, and Empty States

- Route-level loading states use Skeleton or Spinner within the final page geometry so content does not jump after load.
- Recoverable page errors use Alert with a concise explanation and retry action.
- Empty collections use EmptyState within the same collection Panel used for results.
- Mutation failures remain adjacent to their task and may also use a localized Toast when confirmation must survive a local layout change.
- Provider or credential payloads are never exposed by redesigned feedback.

## Responsive Rules

- The workspace has no horizontal overflow at 390px.
- Page actions wrap below the title while preserving primary-to-secondary order.
- Toolbars collapse to one column; labels remain attached to their controls.
- Existing Item-based collections remain stacked on mobile.
- True data tables keep semantic table markup and use bounded local overflow only when conversion to Items would remove important relationships.
- Editor controls remain reachable without covering the document title or source area.
- Touch targets remain at least 44px.

## Accessibility

- Sidebar and mobile navigation have distinct accessible labels.
- Current destinations expose `aria-current="page"`.
- Mobile navigation follows Dialog focus containment, Escape dismissal, and focus restoration.
- Every icon-only control has an accessible name.
- Heading levels remain sequential inside each page.
- Cobalt, status, focus, and destructive states meet the established contrast rules.
- Motion is limited to transform and opacity and respects `prefers-reduced-motion`.

## Delivery Plan

### Pull Request A: Workspace foundation and content administration

- Shared workspace shell and typed navigation model.
- Desktop sidebar and mobile navigation.
- Admin page-layout components.
- Documents list and category management adoption.
- Sign-in refinement.
- Shared loading, error, and empty-state framing.

This PR establishes the contract consumed by the remaining pages. It must leave all routes usable and must not include placeholder navigation.

### Pull Request B: Operational and settings adoption

- Document creation, editing, and Markdown guide.
- Media library.
- Analytics.
- AI settings.
- Removal of superseded page-specific shell CSS.
- Final cross-route responsive and visual verification.

## Verification

Each pull request must pass:

- generated design-system consistency check;
- TypeScript typecheck;
- ESLint;
- complete unit and component test suite;
- Next.js production build;
- Korean and English navigation and page-header assertions;
- active-route tests for nested Admin paths;
- keyboard tests for mobile navigation and page actions;
- 390px mobile overflow checks;
- desktop and mobile visual checks across every route changed by that pull request.

Existing behavioral tests for documents, categories, media, analytics, Agent settings, authorization, and Admin stability must pass without weakening assertions.

## Rollback

PR A can be reverted independently because it changes only layout and presentation contracts. PR B depends on PR A and can also be reverted without database or API rollback. No migration, environment variable, dependency, or provider configuration is introduced.
