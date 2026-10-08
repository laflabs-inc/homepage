import { readFileSync } from "node:fs"
import { join } from "node:path"

import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NEXT_NOT_FOUND") },
}))
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => ({ get: () => null }),
}))
vi.mock("@/components/analytics/consent-provider", () => ({
  useAnalytics: () => ({ track: vi.fn() }),
}))

import RecipeDetailPage, {
  generateStaticParams,
} from "@/app/(documents)/design/recipes/[slug]/page"
import { RecipeDetail } from "@/components/design-system/recipe-detail"
import { RecipeIndex } from "@/components/design-system/recipe-index"
import { recipeDemos } from "@/components/design-system/recipes/recipe-demo-registry"
import { RecipePreview } from "@/components/design-system/recipes/recipe-preview"
import { designCatalog } from "@/lib/design-system/catalog"
import { recipeDemoKeys } from "@/lib/design-system/recipe-options"

describe("design-system Recipe previews", () => {
  it("resolves every finite demo key exactly once", () => {
    expect(Object.keys(recipeDemos).sort()).toEqual([...recipeDemoKeys].sort())
    expect(new Set(Object.values(recipeDemos)).size).toBe(recipeDemoKeys.length)
  })

  it("renders every catalog state in a named inspection region", () => {
    for (const recipe of designCatalog.recipes) {
      for (const state of recipe.states) {
        const label = `${recipe.title.en}: ${state.id}`
        const { unmount } = render(
          <RecipePreview
            demoKey={recipe.demoKey}
            inspectionMode={state.inspection.mode}
            label={label}
            locale="en"
            state={state.id}
          />,
        )

        expect(screen.getByRole("region", { name: label })).toHaveAttribute(
          "data-inspection-mode",
          state.inspection.mode,
        )
        unmount()
      }
    }
  })

  it("exposes publishing status and ordered publishing actions", () => {
    render(
      <RecipePreview
        demoKey="document-publishing-toolbar"
        label="Publishing recipe"
        locale="en"
        state="draft"
      />,
    )

    expect(screen.getByText("Draft")).toBeVisible()
    expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Publish document" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Open publishing options" })).toBeEnabled()
  })

  it("associates the search label and invalid error and names the filter combobox", () => {
    render(
      <RecipePreview
        demoKey="search-filter-field"
        label="Search recipe"
        locale="en"
        state="invalid"
      />,
    )

    const query = screen.getByRole("searchbox", { name: "Search documents" })
    const error = screen.getByRole("alert")
    expect(query).toHaveAttribute("aria-invalid", "true")
    expect(query.getAttribute("aria-describedby")?.split(" ")).toContain(error.id)
    expect(screen.getByRole("combobox", { name: "Filter by document status" })).toBeEnabled()
  })

  it("keeps the empty search query and offers a working next action", async () => {
    const user = userEvent.setup()
    render(
      <RecipePreview
        demoKey="search-filter-field"
        label="Empty search recipe"
        locale="en"
        state="empty"
      />,
    )

    const query = screen.getByRole("searchbox", { name: "Search documents" })
    expect(query).toHaveValue("release archive")
    expect(screen.getByText("No documents match this search.")).toBeVisible()
    await user.click(screen.getByRole("button", { name: "Clear search" }))
    expect(query).toHaveValue("")
    expect(screen.queryByText("No documents match this search.")).not.toBeInTheDocument()
  })

  it("renders named settings groups and stable disabled and saving fixtures", () => {
    const disabled = render(
      <RecipePreview
        demoKey="document-settings-form"
        label="Disabled settings"
        locale="en"
        state="disabled"
      />,
    )
    expect(screen.getByRole("group", { name: "Document settings" })).toBeDisabled()
    disabled.unmount()

    render(
      <RecipePreview
        demoKey="document-settings-form"
        label="Saving settings"
        locale="en"
        state="saving"
      />,
    )
    expect(screen.getByRole("group", { name: "Document settings" })).toBeVisible()
    expect(screen.getAllByRole("status", { name: "Saving document settings" })).toHaveLength(1)
  })

  it.each(["loading", "populated", "empty", "error"])(
    "renders the %s collection fixture without invented customer or product claims",
    (state) => {
      render(
        <RecipePreview
          demoKey="collection-state-surface"
          label={`${state} collection preview`}
          locale="en"
          state={state}
        />,
      )

      const surface = screen.getByRole("region", { name: `${state} document collection` })
      expect(surface).toBeVisible()
      expect(surface).not.toHaveTextContent(/customer|product/i)
    },
  )

  it("localizes the Korean collection region name", () => {
    render(
      <RecipePreview
        demoKey="collection-state-surface"
        label="한국어 컬렉션"
        locale="ko"
        state="loading"
      />,
    )

    expect(screen.getByRole("region", { name: "불러오는 중 문서 목록" })).toBeVisible()
  })

  it("keeps focus overflow and popup layers visible above adjacent documentation", () => {
    const css = readFileSync(
      join(process.cwd(), "components/design-system/recipes/recipe-demos.module.css"),
      "utf8",
    )

    expect(css).toMatch(/\.preview\s*{[^}]*overflow:\s*visible/s)
    expect(css).toMatch(/\.popupLayer\s*{[^}]*z-index:\s*[2-9]\d*/s)
    expect(css).toContain("@media (max-width: 720px)")
    expect(css).toMatch(/min-width:\s*0/)
    expect(css).toMatch(/\.mobileCollection\s*{[^}]*display:\s*none/s)
    expect(css).toMatch(/@media \(max-width: 720px\)[\s\S]*\.collectionTable\s*{[^}]*display:\s*none/s)
    expect(css).toMatch(/@media \(max-width: 720px\)[\s\S]*\.mobileCollection\s*{[^}]*display:\s*grid/s)
  })
})

describe("design-system Recipe pages", () => {
  it("renders four Korean full-width Recipe rows with locale-preserving links", () => {
    render(<RecipeIndex locale="ko" />)

    expect(screen.getByRole("heading", { level: 1, name: "레시피" })).toBeVisible()
    const rows = screen.getAllByTestId("recipe-row")
    expect(rows).toHaveLength(4)
    expect(screen.getByRole("link", { name: /문서 발행 도구 모음/ })).toHaveAttribute(
      "href",
      "/design/recipes/document-publishing-toolbar",
    )
  })

  it("renders equivalent English index copy and preserves English detail links", () => {
    render(<RecipeIndex locale="en" />)

    expect(screen.getByRole("heading", { level: 1, name: "Recipes" })).toBeVisible()
    expect(screen.getByText("Production compositions for recurring interface tasks.")).toBeVisible()
    expect(screen.getByRole("link", { name: /Document publishing toolbar/ })).toHaveAttribute(
      "href",
      "/design/recipes/document-publishing-toolbar?locale=en",
    )
  })

  it.each([
    ["문서 발행", "문서 발행 도구 모음"],
    ["예측 가능한", "문서 발행 도구 모음"],
    ["checkbox", "문서 설정 폼"],
    ["filters-open", "검색과 필터 필드"],
  ])("filters Korean Recipes by %s without changing the URL", async (query, result) => {
    const user = userEvent.setup()
    window.history.replaceState({}, "", "/design/recipes")
    render(<RecipeIndex locale="ko" />)

    await user.type(screen.getByRole("searchbox", { name: "레시피 검색" }), query)

    expect(screen.getAllByTestId("recipe-row")).toHaveLength(1)
    expect(screen.getByRole("link", { name: new RegExp(result) })).toBeVisible()
    expect(window.location.pathname).toBe("/design/recipes")
    expect(window.location.search).toBe("")
  })

  it("filters by category and provides one localized clear action for no results", async () => {
    const user = userEvent.setup()
    render(<RecipeIndex locale="en" />)

    await user.selectOptions(screen.getByRole("combobox", { name: "Recipe category" }), "action")
    expect(screen.getAllByTestId("recipe-row")).toHaveLength(1)

    await user.type(screen.getByRole("searchbox", { name: "Search Recipes" }), "not-a-recipe")
    expect(screen.getByText("No Recipes match these filters.")).toBeVisible()
    const clear = screen.getByRole("button", { name: "Clear Recipe filters" })
    expect(clear).toBeVisible()
    await user.click(clear)
    expect(screen.getAllByTestId("recipe-row")).toHaveLength(4)
  })

  it("renders the complete detail contract for every Recipe route", async () => {
    for (const recipe of designCatalog.recipes) {
      const { unmount } = render(await RecipeDetailPage({
        params: Promise.resolve({ slug: recipe.id }),
        searchParams: Promise.resolve({ locale: "en" }),
      }))
      const article = screen.getByRole("article")

      expect(within(article).getByRole("heading", { level: 1, name: recipe.title.en })).toBeVisible()
      expect(within(article).getByRole("heading", { name: "Live preview" })).toBeVisible()
      expect(within(article).getByRole("heading", { name: "When to use" })).toBeVisible()
      expect(within(article).getByRole("heading", { name: "Anatomy" })).toBeVisible()
      expect(within(article).getByRole("heading", { name: "States" })).toBeVisible()
      expect(within(article).getByRole("heading", { name: "Responsive behavior" })).toBeVisible()
      expect(within(article).getByRole("heading", { name: "Accessibility" })).toBeVisible()
      expect(within(article).getByRole("heading", { name: "Usage" })).toBeVisible()
      expect(within(article).getByRole("heading", { name: "Related documentation" })).toBeVisible()
      expect(within(article).getByRole("heading", { name: "Source paths" })).toBeVisible()
      expect(
        within(article).getByRole("region", { name: "Usage code" }).textContent,
      ).toContain("\n")
      expect(within(article).getByRole("button", { name: "Copy usage code" })).toBeEnabled()
      for (const componentId of recipe.components) {
        expect(within(article).getByRole("link", { name: componentId })).toHaveAttribute(
          "href",
          `/design/components/${componentId}?locale=en`,
        )
      }
      for (const sourcePath of recipe.sourcePaths) {
        expect(within(article).getByText(sourcePath, { selector: "code" })).toBeVisible()
      }
      unmount()
    }
  })

  it("publishes finite static params and rejects an unknown Recipe", async () => {
    expect(generateStaticParams()).toEqual(
      recipeDemoKeys.map((slug) => ({ slug })),
    )

    await expect(RecipeDetailPage({
      params: Promise.resolve({ slug: "missing-recipe" }),
      searchParams: Promise.resolve({ locale: "en" }),
    })).rejects.toThrow("NEXT_NOT_FOUND")
  })

  it("marks filters-open as interactive and explains direct interaction", () => {
    const recipe = designCatalog.recipes.find(({ id }) => id === "search-filter-field")
    if (!recipe) throw new Error("Search and filter Recipe fixture is missing")

    render(<RecipeDetail locale="en" recipe={recipe} />)

    const state = screen.getByTestId("recipe-state-filters-open")
    expect(within(state).getByText("Interact to inspect")).toBeVisible()
    expect(within(state).getByText(/preview control/i)).toBeVisible()
    expect(within(state).getByRole("region", { name: /filters-open state preview/ })).toHaveAttribute(
      "data-inspection-mode",
      "interactive",
    )
  })

  it("pins shrink-safe long-title and narrow-screen layout rules", () => {
    const css = readFileSync(
      join(process.cwd(), "components/design-system/design-system.module.css"),
      "utf8",
    )

    expect(css).toMatch(/\.recipeRow\s*{[^}]*min-width:\s*0/s)
    expect(css).toMatch(/\.recipeRow\s*{[^}]*minmax\(0,/s)
    expect(css).toMatch(/@media \(max-width:\s*720px\)[\s\S]*\.recipeRow/s)
  })
})
