import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"

describe("Checkbox", () => {
  it("updates its native indeterminate and checked states", () => {
    const { rerender } = render(<Checkbox label="모두 선택" indeterminate />)
    const checkbox = screen.getByRole("checkbox", { name: "모두 선택" })
    expect(checkbox).toHaveProperty("indeterminate", true)
    expect(checkbox).toHaveAttribute("aria-checked", "mixed")

    rerender(<Checkbox label="모두 선택" indeterminate={false} checked readOnly />)
    expect(screen.getByRole("checkbox", { name: "모두 선택" })).toHaveProperty(
      "indeterminate",
      false,
    )
    expect(screen.getByRole("checkbox", { name: "모두 선택" })).toBeChecked()
  })

  it("associates visible description text and preserves disabled state", () => {
    render(<Checkbox label="보관" description="목록에서 숨깁니다." disabled />)
    const checkbox = screen.getByRole("checkbox", { name: "보관" })
    const description = screen.getByText("목록에서 숨깁니다.")
    expect(checkbox).toBeDisabled()
    expect(checkbox).toHaveAttribute("aria-describedby", description.id)
  })
})

describe("RadioGroup", () => {
  const options = [
    { value: "ko", label: "한국어", description: "한국어 문서" },
    { value: "en", label: "English", description: "English document" },
    { value: "ja", label: "日本語", disabled: true },
  ] as const

  it("uses native uncontrolled selection and a visible legend", async () => {
    const user = userEvent.setup()
    render(<RadioGroup legend="언어" name="locale" options={options} defaultValue="ko" />)

    expect(screen.getByRole("group", { name: "언어" })).toBeVisible()
    expect(screen.getByRole("radio", { name: "한국어" })).toBeChecked()
    await user.click(screen.getByRole("radio", { name: "English" }))
    expect(screen.getByRole("radio", { name: "English" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "日本語" })).toBeDisabled()
  })

  it("associates option descriptions and reports controlled changes", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <RadioGroup
        legend="언어"
        name="locale"
        onValueChange={onValueChange}
        options={options}
        value="ko"
      />,
    )

    const english = screen.getByRole("radio", { name: "English" })
    const description = screen.getByText("English document")
    expect(english).toHaveAttribute("aria-describedby", description.id)
    await user.click(english)
    expect(onValueChange).toHaveBeenCalledWith("en")
  })
})

describe("Switch", () => {
  it("toggles through its native checkbox behavior without changing its label", async () => {
    const user = userEvent.setup()
    render(<Switch label="분석 허용" />)
    const control = screen.getByRole("switch", { name: "분석 허용" })

    expect(control).not.toBeChecked()
    await user.click(control)
    expect(control).toBeChecked()
    expect(screen.getByRole("switch", { name: "분석 허용" })).toBe(control)
  })

  it("associates its description and preserves disabled state", () => {
    render(<Switch label="AI 기능" description="분석 동의 후 사용할 수 있습니다." disabled />)
    const control = screen.getByRole("switch", { name: "AI 기능" })
    const description = screen.getByText("분석 동의 후 사용할 수 있습니다.")
    expect(control).toBeDisabled()
    expect(control).toHaveAttribute("aria-describedby", description.id)
  })
})
