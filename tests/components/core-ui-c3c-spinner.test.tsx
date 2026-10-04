import { render, screen } from "@testing-library/react"
import { createRef } from "react"
import { describe, expect, it } from "vitest"

import { Spinner } from "@/components/ui/spinner"

describe("Spinner C3C", () => {
  it("announces the pending task with a required status name", () => {
    render(<Spinner label="문서를 저장하는 중" />)

    expect(screen.getByRole("status", { name: "문서를 저장하는 중" })).toBeInTheDocument()
  })

  it("renders one hidden square track without rotating the geometry", () => {
    render(<Spinner label="업로드 중" />)

    const spinner = screen.getByRole("status", { name: "업로드 중" })
    expect(spinner.querySelector("svg")).not.toBeInTheDocument()
    expect(spinner.querySelectorAll("[data-spinner-track]")).toHaveLength(1)
    expect(spinner.querySelector("[data-spinner-track]")).toHaveAttribute("aria-hidden", "true")
    expect(spinner.querySelector("[data-spinner-segment]")).not.toBeInTheDocument()
  })

  it.each(["compact", "default", "large"] as const)(
    "forwards native span props and the %s size",
    (size) => {
      const ref = createRef<HTMLSpanElement>()
      const { unmount } = render(
        <Spinner ref={ref} data-testid="spinner" label={`${size} 작업 중`} size={size} title="진행 중" />,
      )

      expect(screen.getByTestId("spinner")).toHaveAttribute("data-size", size)
      expect(screen.getByTestId("spinner")).toHaveAttribute("title", "진행 중")
      expect(ref.current).toBe(screen.getByTestId("spinner"))
      unmount()
    },
  )
})
