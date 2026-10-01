import { useState } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@/components/ui/segmented-control"
import { SegmentedToggle } from "@/components/ui/segmented-toggle"

const threeOptions = [
  { value: "all", label: "All documents", content: "All" },
  { value: "draft", label: "Draft documents", content: "Drafts" },
  {
    value: "published",
    label: "Published documents",
    content: "Published documents",
  },
] as const

function ControlledSegmentedControl({
  options = threeOptions,
}: {
  options?: readonly SegmentedControlOption<string>[]
}) {
  const [value, setValue] = useState(options[0]?.value ?? "")

  return (
    <>
      <SegmentedControl
        label="Document status"
        value={value}
        options={options}
        onValueChange={setValue}
      />
      <output>{value}</output>
    </>
  )
}

describe("SegmentedControl", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("renders two or more named single-selection options", () => {
    render(
      <SegmentedControl
        label="Language"
        value="ko"
        options={[
          { value: "ko", label: "한국어", content: "KO" },
          { value: "en", label: "English", content: "EN" },
        ]}
        onValueChange={() => undefined}
      />,
    )

    const group = screen.getByRole("radiogroup", { name: "Language" })
    expect(within(group).getAllByRole("radio")).toHaveLength(2)
    expect(screen.getByRole("radio", { name: "한국어" })).toHaveAttribute(
      "aria-checked",
      "true",
    )
  })

  it("keeps the active surface inside the selected variable-width option", () => {
    render(
      <SegmentedControl
        label="Document status"
        value="published"
        options={threeOptions}
        onValueChange={() => undefined}
      />,
    )

    const selected = screen.getByRole("radio", { name: "Published documents" })
    expect(selected).not.toHaveStyle({ width: "34px" })
    expect(
      selected.querySelector('[data-slot="segmented-control-indicator"]'),
    ).toBeInTheDocument()
  })

  it("renders five options without dropping values", () => {
    const options = ["one", "two", "three", "four", "five"].map((value) => ({
      value,
      label: value,
      content: value.toUpperCase(),
    }))

    render(
      <SegmentedControl
        label="Five choices"
        value="three"
        options={options}
        onValueChange={() => undefined}
      />,
    )

    expect(screen.getAllByRole("radio")).toHaveLength(5)
    expect(screen.getByRole("radio", { name: "three" })).toHaveAttribute(
      "aria-checked",
      "true",
    )
  })

  it("changes once for a new click and ignores current or disabled options", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <SegmentedControl
        label="Status"
        value="all"
        options={[
          { value: "all", label: "All", content: "All" },
          { value: "draft", label: "Draft", content: "Draft" },
          { value: "archived", label: "Archived", content: "Archived", disabled: true },
        ]}
        onValueChange={onValueChange}
      />,
    )

    await user.click(screen.getByRole("radio", { name: "All" }))
    await user.click(screen.getByRole("radio", { name: "Archived" }))
    expect(onValueChange).not.toHaveBeenCalled()

    await user.click(screen.getByRole("radio", { name: "Draft" }))
    expect(onValueChange).toHaveBeenCalledOnce()
    expect(onValueChange).toHaveBeenCalledWith("draft")
  })

  it("uses one roving tab stop and selects with arrow, Home, and End keys", async () => {
    const user = userEvent.setup()
    const options = [
      { value: "all", label: "All", content: "All" },
      { value: "draft", label: "Draft", content: "Draft", disabled: true },
      { value: "published", label: "Published", content: "Published" },
    ] as const

    render(<ControlledSegmentedControl options={options} />)

    const all = screen.getByRole("radio", { name: "All" })
    const draft = screen.getByRole("radio", { name: "Draft" })
    const published = screen.getByRole("radio", { name: "Published" })

    expect(all).toHaveAttribute("tabindex", "0")
    expect(draft).toHaveAttribute("tabindex", "-1")
    expect(published).toHaveAttribute("tabindex", "-1")

    all.focus()
    await user.keyboard("{ArrowRight}")
    expect(published).toHaveFocus()
    expect(screen.getByText("published", { selector: "output" })).toBeVisible()

    await user.keyboard("{ArrowRight}")
    expect(all).toHaveFocus()
    expect(screen.getByText("all", { selector: "output" })).toBeVisible()

    await user.keyboard("{End}")
    expect(published).toHaveFocus()
    await user.keyboard("{Home}")
    expect(all).toHaveFocus()
  })

  it("gives an unknown value no selection and the first enabled option as the tab stop", () => {
    render(
      <SegmentedControl
        label="Unknown selection"
        value="missing"
        options={[
          { value: "disabled", label: "Disabled", content: "Disabled", disabled: true },
          { value: "first", label: "First", content: "First" },
          { value: "second", label: "Second", content: "Second" },
        ]}
        onValueChange={() => undefined}
      />,
    )

    expect(
      screen.getAllByRole("radio").every(
        (option) => option.getAttribute("aria-checked") === "false",
      ),
    ).toBe(true)
    expect(screen.getByRole("radio", { name: "First" })).toHaveAttribute("tabindex", "0")
  })

  it("keeps the selected state when reduced motion is requested", () => {
    vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })))

    render(
      <SegmentedControl
        label="Motion preference"
        value="on"
        options={[
          { value: "off", label: "Off", content: "Off" },
          { value: "on", label: "On", content: "On" },
        ]}
        onValueChange={() => undefined}
      />,
    )

    expect(screen.getByRole("radio", { name: "On" })).toHaveAttribute(
      "aria-checked",
      "true",
    )
    expect(
      screen
        .getByRole("radio", { name: "On" })
        .querySelector('[data-slot="segmented-control-indicator"]'),
    ).toBeInTheDocument()
  })

  it("rejects a control with fewer than two options during development", () => {
    expect(() =>
      render(
        <SegmentedControl
          label="Invalid"
          value="only"
          options={[{ value: "only", label: "Only", content: "Only" }]}
          onValueChange={() => undefined}
        />,
      ),
    ).toThrow("SegmentedControl requires at least two options")
  })
})

describe("SegmentedToggle compatibility", () => {
  it("preserves its group, pressed-button, and active-index contract", () => {
    render(
      <SegmentedToggle
        label="Language"
        value="ko"
        options={[
          { value: "ko", label: "한국어", content: "KO" },
          { value: "en", label: "English", content: "EN" },
        ]}
        onValueChange={() => undefined}
      />,
    )

    const group = screen.getByRole("group", { name: "Language" })
    expect(group).toHaveAttribute("data-active-index", "0")
    expect(within(group).getByRole("button", { name: "한국어" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(within(group).getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )
  })
})
