import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getButtonClassName } from "@/components/ui/button-contract"

function DecisionDialog({ onConfirm = vi.fn() }: { onConfirm?: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>문서 삭제</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>문서를 삭제할까요?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogBody>삭제한 문서는 복구할 수 없습니다.</AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>삭제</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

describe("AlertDialog C3C", () => {
  it("requires an explicit cancel or action decision instead of outside dismissal", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<DecisionDialog onConfirm={onConfirm} />)

    await user.click(screen.getByRole("button", { name: "문서 삭제" }))
    fireEvent.pointerDown(document.body)
    fireEvent.click(document.body)
    expect(screen.getByRole("alertdialog", { name: "문서를 삭제할까요?" })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "삭제" }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("uses the shared Button contract for cancel primary and destructive actions", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>스타일 확인</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel>대화상자 취소</AlertDialogCancel>
            <AlertDialogAction>대화상자 확인</AlertDialogAction>
            <AlertDialogAction variant="destructive">대화상자 위험</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    )

    expect(screen.getByRole("button", { name: "대화상자 취소" }).className)
      .toBe(getButtonClassName({ variant: "secondary" }))
    expect(screen.getByRole("button", { name: "대화상자 확인" }).className)
      .toBe(getButtonClassName({ variant: "primary" }))
    expect(screen.getByRole("button", { name: "대화상자 위험" }).className)
      .toBe(getButtonClassName({ variant: "danger" }))
  })

  it("composes portal overlay header body and footer", () => {
    render(
      <AlertDialog open>
        <AlertDialogPortal>
          <AlertDialogOverlay data-testid="decision-overlay" />
        </AlertDialogPortal>
        <AlertDialogContent>
          <AlertDialogHeader>머리말</AlertDialogHeader>
          <AlertDialogBody>본문</AlertDialogBody>
          <AlertDialogFooter>꼬리말</AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    )

    expect(screen.getByTestId("decision-overlay")).toBeInTheDocument()
    expect(screen.getByText("본문")).toHaveAttribute("data-alert-dialog-body", "")
  })

  it("returns focus to the trigger after cancel", async () => {
    const user = userEvent.setup()
    render(<DecisionDialog />)

    const trigger = screen.getByRole("button", { name: "문서 삭제" })
    await user.click(trigger)
    await user.click(screen.getByRole("button", { name: "취소" }))

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
