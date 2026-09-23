import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

describe("DropdownMenu", () => {
  it("opens by keyboard, skips disabled items, activates an item, and restores focus", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>문서 메뉴</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled>삭제</DropdownMenuItem>
          <DropdownMenuItem onSelect={onSelect}>편집</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    const trigger = screen.getByRole("button", { name: "문서 메뉴" })
    trigger.focus()
    await user.keyboard("{Enter}")
    expect(screen.getByRole("menu")).toBeVisible()
    expect(screen.getByRole("menuitem", { name: "삭제" })).toHaveAttribute("data-disabled", "")

    await user.keyboard("{Enter}")
    expect(onSelect).toHaveBeenCalledOnce()
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it("supports checked and radio menu states", async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const onValueChange = vi.fn()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>보기 설정</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked onCheckedChange={onCheckedChange}>
            줄 번호
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="ko" onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="ko">한국어</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    await user.click(screen.getByRole("button", { name: "보기 설정" }))
    expect(screen.getByRole("menuitemcheckbox", { name: "줄 번호" })).toBeChecked()
    expect(screen.getByRole("menuitemradio", { name: "한국어" })).toBeChecked()

    await user.click(screen.getByRole("menuitemradio", { name: "English" }))
    expect(onValueChange).toHaveBeenCalledWith("en")

    await user.click(screen.getByRole("button", { name: "보기 설정" }))
    await user.click(screen.getByRole("menuitemcheckbox", { name: "줄 번호" }))
    expect(onCheckedChange).toHaveBeenCalledWith(false)
  })

  it("opens a submenu and dismisses the menu tree with Escape", async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>내보내기</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>형식</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Markdown</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    )

    const trigger = screen.getByRole("button", { name: "내보내기" })
    await user.click(trigger)
    await user.hover(screen.getByRole("menuitem", { name: "형식" }))
    expect(await screen.findByRole("menuitem", { name: "Markdown" })).toBeVisible()

    await user.keyboard("{Escape}{Escape}")
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
