import { readFileSync } from "node:fs"
import { join } from "node:path"

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

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

  it("keeps focus overflow and popup layers visible above adjacent documentation", () => {
    const css = readFileSync(
      join(process.cwd(), "components/design-system/recipes/recipe-demos.module.css"),
      "utf8",
    )

    expect(css).toMatch(/\.preview\s*{[^}]*overflow:\s*visible/s)
    expect(css).toMatch(/\.popupLayer\s*{[^}]*z-index:\s*[2-9]\d*/s)
    expect(css).toContain("@media (max-width: 720px)")
    expect(css).toMatch(/min-width:\s*0/)
  })
})
