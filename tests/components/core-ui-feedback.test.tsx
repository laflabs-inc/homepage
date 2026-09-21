import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

describe("Alert", () => {
  it("announces live errors and exposes their semantic variant", () => {
    render(<Alert title="저장 실패" variant="error" live>다시 시도해 주세요.</Alert>)
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("저장 실패")
    expect(alert).toHaveTextContent("다시 시도해 주세요.")
    expect(alert).toHaveAttribute("data-variant", "error")
  })

  it("renders static guidance as a named region without an alert announcement", () => {
    render(<Alert title="검토 필요" variant="warning">발행 전에 확인해 주세요.</Alert>)
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(screen.getByRole("region", { name: "검토 필요" })).toHaveAttribute(
      "data-variant",
      "warning",
    )
  })
})

describe("Skeleton", () => {
  it("always stays hidden from assistive technology while forwarding layout props", () => {
    render(<Skeleton aria-hidden="false" data-testid="skeleton" style={{ height: 40 }} />)
    const skeleton = screen.getByTestId("skeleton")
    expect(skeleton).toHaveAttribute("aria-hidden", "true")
    expect(skeleton).toHaveStyle({ height: "40px" })
  })
})

describe("EmptyState", () => {
  it("keeps its title, description, and recovery action together", () => {
    render(
      <EmptyState
        title="문서가 없습니다"
        description="첫 문서를 작성해 주세요."
        action={<Button>작성</Button>}
      />,
    )
    expect(screen.getByRole("heading", { name: "문서가 없습니다" })).toBeVisible()
    expect(screen.getByText("첫 문서를 작성해 주세요.")).toBeVisible()
    expect(screen.getByRole("button", { name: "작성" })).toBeVisible()
  })
})

describe("Separator", () => {
  it("is decorative by default and semantic only when requested", () => {
    const { rerender } = render(<Separator data-testid="separator" />)
    expect(screen.queryByRole("separator")).not.toBeInTheDocument()
    expect(screen.getByTestId("separator")).toHaveAttribute("aria-hidden", "true")

    rerender(<Separator decorative={false} orientation="vertical" />)
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical")

    rerender(<Separator decorative={false} orientation="horizontal" />)
    expect(screen.getByRole("separator").tagName).toBe("HR")
  })
})
