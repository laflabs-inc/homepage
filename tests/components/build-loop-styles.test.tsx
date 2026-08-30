import { render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/sections/build-loop.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { LocaleProvider } from "@/components/i18n/locale-provider"
import { BuildLoop } from "@/components/sections/build-loop"

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

describe("BuildLoop styling", () => {
  it("owns the styling hooks required to preserve its mobile layout", () => {
    render(
      <LocaleProvider initialLocale="ko">
        <BuildLoop />
      </LocaleProvider>,
    )

    const section = screen.getByRole("region", { name: "제품에서 시작해 시스템으로 남깁니다." })
    expect(section).toHaveClass("buildLoop")
    expect(section).toHaveAttribute("data-motion-sequence", "build-loop")
    expect(section).toHaveAttribute("data-scene-count", "4")

    const title = within(section).getByRole("heading", {
      level: 2,
      name: "제품에서 시작해 시스템으로 남깁니다.",
    })
    expect(title.parentElement).toHaveClass("intro")
    expect(within(section).getByRole("list")).toHaveClass("steps")
    expect(within(section).getAllByRole("listitem")).toHaveLength(4)
    expect(within(section).getByTestId("build-loop-stage")).toBeInTheDocument()
    expect(within(section).getAllByTestId("build-loop-node")).toHaveLength(4)
    expect(within(section).getByTestId("build-loop-stage")).toHaveAttribute(
      "data-stage-layout",
      "sticky",
    )
    within(section).getAllByRole("listitem").forEach((item, index) => {
      expect(item).toHaveAttribute("data-scene-index", String(index))
    })
    expect(within(section).getByText("시스템")).toBeInTheDocument()
    expect(within(section).queryByText("오픈소스")).not.toBeInTheDocument()
  })
})
