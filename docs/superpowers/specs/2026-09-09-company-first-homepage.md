# Hybrid company-first homepage redesign

## Goal

Combine the original homepage's expressive Hero, Company, and framed-card language with the remake's clearer work registry and open-source structure. The finished page should introduce LafLabs as a software company before it presents individual work, while preserving the square blue identity and avoiding oversized typography or forced scrolling.

## Page order

1. Original Hero composition and motion, with a reduced responsive type scale.
2. Original Company composition and right-to-left entrance motion.
3. Original three-panel product-grid composition repurposed as the LafLabs work method.
4. Remade Selected Work registry in an image-led customer-story composition.
5. Remade open-source section with one public repository and two undisclosed entries.
6. Existing Latest Signals section.
7. Existing contact section without recruitment language.

The standalone careers page is explicitly deferred to the next pull request.

## Hero and Company

- Restore the original `LAF / 001` Hero, copy layout, blue motion field, and restrained vertical movement.
- Restore the original dark Company section and its offset copy composition.
- Keep the current company-first meaning and natural Korean sentence order rather than restoring translation-like legacy copy verbatim.
- Reduce the original oversized headings so the Hero remains expressive without dominating smaller screens.

## Work method

- Reuse the original bordered three-panel `ID / PAY / DOCK` layout.
- Replace product content with the company's work method: `ASK`, `BUILD`, and `RUN`.
- Keep the English marks because their letterforms work as the large decorative layer.
- Let the marks crop inside each panel and move a short distance on hover or entrance, matching the existing animation language.
- Do not restore sticky scroll stages or wheel-to-horizontal conversion. Desktop uses a three-column grid; mobile uses native horizontal scroll with snap points.

## Selected Work

- Keep the typed work registry and explicit manual navigation from the remake.
- Present the active item as a 56/44 split similar to the supplied customer-success reference: project image on the left, factual copy and metadata on the right.
- Use a real public image or project asset when one exists. Where no product image is public, use an editorial brand image that is clearly decorative and never resembles a fabricated product screenshot.
- Restyle navigation as square previous/next controls with a segmented progress rail. No autoplay.
- Preserve keyboard arrows, touch swipe, visible focus, reduced motion, and privacy-safe analytics.

## Open source

- Keep the remake's restrained repository-list composition.
- Show `lafetch` as the only named, linked public repository.
- Render the remaining two rows as `Undisclosed / 미공개 프로젝트`, without links, fabricated descriptions, or implied release status.
- Keep the organization-level GitHub link.

## Typography system

- Hero display: 64–80px desktop, 40–48px mobile.
- Company display: 52–72px desktop, 36–44px mobile.
- Section headings: 44–60px desktop, 32–40px mobile.
- Work-card titles: 28–40px desktop, 26–32px mobile.
- Body: 15–17px desktop, 14–16px mobile, with 1.6–1.75 line height.
- Mono labels: 9–11px with restrained tracking.
- Use Pretendard for Korean and the existing Geist fonts for Latin and mono content.

## Search overlay

- Preserve the existing full-screen dialog, keyboard behavior, loading/error states, grouping, and analytics.
- Reduce the search heading and input scale: input 52–64px desktop and 30–38px mobile.
- Tighten the intro, form, status, and result spacing so useful results appear without unnecessary scrolling.
- Reduce result titles to 20–26px desktop and 18–22px mobile while keeping descriptions readable.
- Keep square controls and the existing paper, ink, line, and route-blue palette.

## Content and trust rules

- Do not invent customers, testimonials, performance metrics, investment facts, or product availability.
- Product names appear only after the company and work-method sections.
- Real public artifacts take priority over generated proof.
- Decorative images must not be presented as product screenshots.
- Remove `코드가 결과를 설명합니다` from the homepage.
- Remove recruitment from the main contact copy; do not create a careers route in this pull request.

## Responsive and motion rules

- Support 320px through 1440px without document-level horizontal overflow.
- Do not intercept the vertical wheel or create a sticky stage taller than the viewport.
- Motion should stay within short transforms and purposeful section entrances.
- Native touch scrolling remains available for the mobile work-method rail.
- Reduced-motion users receive the final state immediately and retain every interaction.

## Completion criteria

- Original Hero and Company compositions are recognizable and use the updated copy and type scale.
- The original product panels now communicate `ASK / BUILD / RUN` without naming products.
- Selected Work is image-led, extensible from data, and fully operable without a mouse.
- The engineering-code section is gone.
- Only `lafetch` is named in the open-source list; two additional entries remain undisclosed.
- Latest Signals behaves as before.
- Main-page recruitment language is removed and no careers route is added.
- Search proportions and typography are visibly calmer on desktop and mobile.
- Unit tests, Playwright checks, typecheck, lint, and production build pass.
