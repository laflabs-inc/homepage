import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function LanguageSelect({ onValueChange = vi.fn() }: { onValueChange?: (value: string) => void }) {
  return (
    <Select defaultValue="ko" onValueChange={onValueChange}>
      <SelectTrigger aria-label="문서 언어">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>언어</SelectLabel>
          <SelectItem value="ko">한국어</SelectItem>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="ja" disabled>日本語</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

describe("Select", () => {
  it("opens from its trigger and exposes the selected value and indicator", async () => {
    const user = userEvent.setup()
    render(<LanguageSelect />)

    const trigger = screen.getByRole("combobox", { name: "문서 언어" })
    expect(trigger).toHaveTextContent("한국어")
    await user.click(trigger)

    expect(screen.getByRole("listbox")).toBeVisible()
    expect(screen.getByRole("option", { name: "한국어" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("option", { name: "한국어" }).querySelector("[data-select-indicator]"))
      .toBeInTheDocument()
  })

  it("selects by keyboard, skips disabled items, reports the value, and returns focus", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<LanguageSelect onValueChange={onValueChange} />)

    const trigger = screen.getByRole("combobox", { name: "문서 언어" })
    trigger.focus()
    await user.keyboard("{Enter}{ArrowDown}{ArrowDown}{Enter}")

    expect(onValueChange).toHaveBeenCalledWith("en")
    expect(trigger).toHaveTextContent("English")
    expect(trigger).toHaveFocus()
  })

  it("opens by keyboard and closes with Escape without changing the value", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<LanguageSelect onValueChange={onValueChange} />)

    const trigger = screen.getByRole("combobox", { name: "문서 언어" })
    trigger.focus()
    await user.keyboard(" ")
    expect(screen.getByRole("listbox")).toBeVisible()

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(onValueChange).not.toHaveBeenCalled()
    expect(trigger).toHaveFocus()
  })
})
