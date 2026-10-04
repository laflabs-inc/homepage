import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
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
  it("composes portal overlay body footer and an explicit close control", async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>구성 열기</DialogTrigger>
        <DialogPortal>
          <DialogOverlay data-testid="dialog-overlay" />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>구성형 대화상자</DialogTitle>
            </DialogHeader>
            <DialogBody>본문</DialogBody>
            <DialogFooter>
              <DialogClose>완료</DialogClose>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>,
    )

    await user.click(screen.getByRole("button", { name: "구성 열기" }))
    expect(screen.getByTestId("dialog-overlay")).toBeInTheDocument()
    expect(screen.getByText("본문")).toHaveAttribute("data-dialog-body", "")
    await user.click(screen.getByRole("button", { name: "완료" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it.each(["small", "medium", "large", "full"] as const)(
    "supports the %s content size",
    async (size) => {
      const user = userEvent.setup()
      render(
        <Dialog>
          <DialogTrigger>{size} 열기</DialogTrigger>
          <DialogContent size={size}>
            <DialogTitle>{size} 대화상자</DialogTitle>
          </DialogContent>
        </Dialog>,
      )

      await user.click(screen.getByRole("button", { name: `${size} 열기` }))
      expect(screen.getByRole("dialog")).toHaveAttribute("data-size", size)
    },
  )

  it("keeps header and footer outside a body scrolling boundary", async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>스크롤 열기</DialogTrigger>
        <DialogContent scroll="body">
          <DialogHeader>머리말</DialogHeader>
          <DialogBody>긴 본문</DialogBody>
          <DialogFooter>꼬리말</DialogFooter>
        </DialogContent>
      </Dialog>,
    )

    await user.click(screen.getByRole("button", { name: "스크롤 열기" }))
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAttribute("data-scroll", "body")
    expect(screen.getByText("긴 본문")).toHaveAttribute("data-dialog-body", "")
    expect(screen.getByText("머리말").parentElement).toBe(dialog)
    expect(screen.getByText("꼬리말").parentElement).toBe(dialog)
  })

  it("renders one legacy close control only when closeLabel is supplied", async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <Dialog open>
        <DialogContent closeLabel="레거시 닫기">
          <DialogTitle>레거시</DialogTitle>
        </DialogContent>
      </Dialog>,
    )

    expect(screen.getAllByRole("button", { name: "레거시 닫기" })).toHaveLength(1)

    rerender(
      <Dialog open>
        <DialogContent>
          <DialogTitle>구성형</DialogTitle>
        </DialogContent>
      </Dialog>,
    )
    expect(screen.queryByRole("button", { name: "레거시 닫기" })).not.toBeInTheDocument()
  })

  it("keeps long localized content and actions inside the dialog viewport", async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>긴 내용 열기</DialogTrigger>
        <DialogContent size="large" scroll="content">
          <DialogTitle>긴 현지화 콘텐츠</DialogTitle>
          <DialogBody>{"아주 긴 한국어 본문 ".repeat(80)}</DialogBody>
          <DialogFooter><button type="button">변경 사항 저장하기</button></DialogFooter>
        </DialogContent>
      </Dialog>,
    )

    await user.click(screen.getByRole("button", { name: "긴 내용 열기" }))
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAttribute("data-size", "large")
    expect(dialog).toHaveAttribute("data-scroll", "content")
    expect(screen.getByRole("button", { name: "변경 사항 저장하기" })).toBeInTheDocument()
  })

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
