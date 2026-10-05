import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PatternsGuide } from "@/components/design-system/patterns-guide"

describe("PatternsGuide C3D publication", () => {
  it("renders Korean recipes as linked, semantic state matrices", () => {
    render(<PatternsGuide locale="ko" />)

    expect(screen.getByRole("heading", { name: "작업 레시피" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "문서 작성과 발행" })).toBeInTheDocument()

    const matrix = screen.getByRole("table", { name: "문서 작성과 발행 상태표" })
    expect(within(matrix).getByRole("columnheader", { name: "상태" })).toBeInTheDocument()
    expect(within(matrix).getByRole("columnheader", { name: "조건" })).toBeInTheDocument()
    expect(within(matrix).getByRole("columnheader", { name: "화면" })).toBeInTheDocument()
    expect(within(matrix).getByRole("columnheader", { name: "다음 동작" })).toBeInTheDocument()
    expect(within(matrix).getByRole("rowheader", { name: "draft" })).toBeInTheDocument()

    expect(screen.getAllByRole("link", { name: "Field" })[0]).toHaveAttribute(
      "href",
      "/design/components/field",
    )
  })

  it("renders the English migration reference as direct legacy-to-recommended rows", () => {
    render(<PatternsGuide locale="en" />)

    expect(screen.getByRole("heading", { name: "Migration reference" })).toBeInTheDocument()
    const migrationList = screen.getByRole("list", { name: "Migration reference" })
    const migration = within(migrationList).getAllByRole("listitem")[0]
    expect(within(migration).getByText("Action")).toBeInTheDocument()
    expect(within(migration).getByText("Button / ButtonLink")).toBeInTheDocument()
    expect(within(migration).getByRole("link", { name: "Button" })).toHaveAttribute(
      "href",
      "/design/components/button?locale=en",
    )
  })
})
