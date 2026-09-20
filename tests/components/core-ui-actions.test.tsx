import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"

describe("Button", () => {
  it("uses a safe default type and forwards native button props", () => {
    render(<Button form="document-form" name="intent" value="save">Save changes</Button>)

    const button = screen.getByRole("button", { name: "Save changes" })
    expect(button).toHaveAttribute("form", "document-form")
    expect(button).toHaveAttribute("name", "intent")
    expect(button).toHaveAttribute("value", "save")
    expect(button).toHaveAttribute("type", "button")
  })

  it("exposes its visual variant and size without changing its accessible name", () => {
    const label = "Delete the selected document revision permanently"
    render(<Button variant="danger" size="compact">{label}</Button>)

    expect(screen.getByRole("button", { name: label })).toHaveAttribute("data-variant", "danger")
    expect(screen.getByRole("button", { name: label })).toHaveAttribute("data-size", "compact")
  })

  it("marks a loading action busy, disables it, and suppresses activation", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Save changes</Button>)

    const button = screen.getByRole("button", { name: "Save changes" })
    expect(button).toHaveAttribute("aria-busy", "true")
    expect(button).toBeDisabled()
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("preserves an explicitly disabled native button", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Publish</Button>)

    const button = screen.getByRole("button", { name: "Publish" })
    expect(button).toBeDisabled()
    expect(button).not.toHaveAttribute("aria-busy")
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe("ButtonGroup", () => {
  it("groups related actions under a required accessible label", () => {
    render(
      <ButtonGroup label="문서 동작">
        <Button>저장</Button>
        <Button>발행</Button>
      </ButtonGroup>,
    )

    expect(screen.getByRole("group", { name: "문서 동작" })).toBeVisible()
  })

  it("exposes horizontal and vertical orientation while forwarding native props", () => {
    const { rerender } = render(
      <ButtonGroup label="Actions" data-testid="group" title="Document actions" />,
    )
    expect(screen.getByTestId("group")).toHaveAttribute("data-orientation", "horizontal")
    expect(screen.getByTestId("group")).toHaveAttribute("title", "Document actions")

    rerender(<ButtonGroup label="Actions" data-testid="group" orientation="vertical" />)
    expect(screen.getByTestId("group")).toHaveAttribute("data-orientation", "vertical")
  })
})
