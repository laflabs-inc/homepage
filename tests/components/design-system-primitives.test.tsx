import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Action } from "@/components/ui/action"
import { IconControl } from "@/components/ui/icon-control"
import { TextLink } from "@/components/ui/text-link"

describe("public design-system primitives", () => {
  it("renders navigation Actions as links with their selected variant", () => {
    render(<Action href="/design" variant="primary">Open guide</Action>)

    expect(screen.getByRole("link", { name: "Open guide" })).toHaveAttribute("href", "/design")
    expect(screen.getByRole("link", { name: "Open guide" })).toHaveAttribute("data-variant", "primary")
  })

  it("renders in-place Actions as buttons that do not submit by default", () => {
    const onClick = vi.fn()

    render(<Action onClick={onClick}>Save changes</Action>)

    const action = screen.getByRole("button", { name: "Save changes" })
    expect(action).toHaveAttribute("type", "button")
    fireEvent.click(action)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("gives Icon Controls a labeled native button with a safe default type", () => {
    render(<IconControl label="Search"><MagnifyingGlass aria-hidden /></IconControl>)

    expect(screen.getByRole("button", { name: "Search" })).toHaveAttribute("type", "button")
  })

  it("renders Text Links with an accessible destination", () => {
    render(<TextLink href="/design/components">Components</TextLink>)

    expect(screen.getByRole("link", { name: /Components/ })).toHaveAttribute("href", "/design/components")
  })
})

function ActionPropContract() {
  return (
    <>
      <Action href="/design">Guide</Action>
      <Action type="submit">Save</Action>
      {/* @ts-expect-error href Actions cannot accept button-only disabled state. */}
      <Action href="/design" disabled>Invalid</Action>
    </>
  )
}

void ActionPropContract
