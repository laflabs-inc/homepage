import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function ExampleDialog({ onOpenChange = vi.fn() }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger>문의 열기</DialogTrigger>
      <DialogContent closeLabel="문의 닫기">
        <DialogTitle>프로젝트 문의</DialogTitle>
        <DialogDescription>필요한 내용을 남겨 주세요.</DialogDescription>
        <input aria-label="회사명" />
        <DialogFooter><button type="button">보내기</button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

describe("Dialog", () => {
  it("exposes its title and description, traps focus, and closes from its visible control", async () => {
    const user = userEvent.setup()
    render(<ExampleDialog />)

    const trigger = screen.getByRole("button", { name: "문의 열기" })
    await user.click(trigger)
    const dialog = screen.getByRole("dialog", { name: "프로젝트 문의" })
    expect(dialog).toHaveAccessibleDescription("필요한 내용을 남겨 주세요.")

    const close = screen.getByRole("button", { name: "문의 닫기" })
    close.focus()
    await user.keyboard("{Shift>}{Tab}{/Shift}")
    expect(screen.getByRole("button", { name: "보내기" })).toHaveFocus()

    await user.click(close)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it("dismisses with Escape and outside interaction", async () => {
    const user = userEvent.setup()
    render(<ExampleDialog />)
    const trigger = screen.getByRole("button", { name: "문의 열기" })

    await user.click(trigger)
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    fireEvent.pointerDown(document.body)
    fireEvent.click(document.body)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("reports controlled open-state changes", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    function ControlledDialog() {
      const [open, setOpen] = useState(false)
      return (
        <Dialog
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next)
            setOpen(next)
          }}
        >
          <DialogTrigger>설정 열기</DialogTrigger>
          <DialogContent closeLabel="설정 닫기">
            <DialogTitle>설정</DialogTitle>
            <DialogDescription>환경을 변경합니다.</DialogDescription>
          </DialogContent>
        </Dialog>
      )
    }

    render(<ControlledDialog />)
    await user.click(screen.getByRole("button", { name: "설정 열기" }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    await user.click(screen.getByRole("button", { name: "설정 닫기" }))
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })
})
