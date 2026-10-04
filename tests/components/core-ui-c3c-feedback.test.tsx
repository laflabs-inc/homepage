import { Info } from "@phosphor-icons/react/dist/ssr"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert"

describe("Alert C3C", () => {
  it("composes icon title description and action with one labelled region", () => {
    render(
      <Alert data-testid="alert" variant="info">
        <AlertIcon><Info aria-hidden /></AlertIcon>
        <AlertContent>
          <AlertTitle>배포 준비 완료</AlertTitle>
          <AlertDescription>변경 사항을 검토한 뒤 발행할 수 있습니다.</AlertDescription>
        </AlertContent>
        <AlertAction><button type="button">검토하기</button></AlertAction>
      </Alert>,
    )

    const alert = screen.getByTestId("alert")
    const title = screen.getByRole("heading", { name: "배포 준비 완료" })
    expect(alert).toHaveAttribute("aria-labelledby", title.id)
    expect(screen.getByRole("button", { name: "검토하기" })).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { name: "배포 준비 완료" })).toHaveLength(1)
  })

  it("keeps static information out of live regions", () => {
    render(<Alert title="참고">자동 저장됩니다.</Alert>)

    const alert = screen.getByText("참고").closest("section")
    expect(alert).not.toHaveAttribute("role")
    expect(alert).not.toHaveAttribute("aria-live")
  })

  it("announces only a live urgent alert", () => {
    render(<Alert live title="저장 실패" variant="error">다시 시도해 주세요.</Alert>)

    expect(screen.getByRole("alert", { name: "저장 실패" })).toHaveTextContent("다시 시도해 주세요.")
  })

  it("keeps the title prop as a non-duplicating compatibility shorthand", () => {
    render(<Alert title="검토 필요" variant="warning">발행 전에 내용을 확인하세요.</Alert>)

    expect(screen.getAllByRole("heading", { name: "검토 필요" })).toHaveLength(1)
    expect(screen.getByText("발행 전에 내용을 확인하세요.")).toBeInTheDocument()
  })
})
