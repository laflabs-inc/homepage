import { createRef } from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { MagnifyingGlass } from "@phosphor-icons/react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group"

describe("Button", () => {
  it("forwards a typed ref to the native button", () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Continue</Button>)
    expect(ref.current).toBe(screen.getByRole("button", { name: "Continue" }))
  })

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

  it("renders a low-emphasis ghost action", () => {
    render(<Button variant="ghost">More options</Button>)

    expect(screen.getByRole("button", { name: "More options" })).toHaveAttribute(
      "data-variant",
      "ghost",
    )
  })

  it("renders a transparent outline action as a first-class variant", () => {
    render(<Button variant={"outline" as never}>View details</Button>)

    const button = screen.getByRole("button", { name: "View details" })
    const stylesheet = readFileSync(join(process.cwd(), "components/ui/button.module.css"), "utf8")
    expect(button).toHaveAttribute("data-variant", "outline")
    expect(stylesheet).toMatch(
      /\.outline\s*\{[^}]*border-color:\s*var\(--ink\);[^}]*background:\s*transparent;[^}]*color:\s*var\(--ink\);/s,
    )
  })

  it("renders an accessible icon-only action", () => {
    render(
      <Button size="icon" aria-label="Search">
        <MagnifyingGlass aria-hidden />
      </Button>,
    )

    expect(screen.getByRole("button", { name: "Search" })).toHaveAttribute(
      "data-size",
      "icon",
    )
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

  it("uses a white foreground on the high-contrast Error danger surface", () => {
    const stylesheet = readFileSync(join(process.cwd(), "components/ui/button.module.css"), "utf8")
    expect(stylesheet).toMatch(
      /\.danger\s*\{[^}]*background:\s*var\(--error-deep\);[^}]*color:\s*var\(--pure-white\);/s,
    )
  })
})

describe("ButtonLink", () => {
  it("preserves navigation semantics and native anchor attributes", () => {
    const ref = createRef<HTMLAnchorElement>()
    render(
      <ButtonLink ref={ref} href="/design" target="_self">
        Design guide
      </ButtonLink>,
    )

    const link = screen.getByRole("link", { name: "Design guide" })
    expect(link).toHaveAttribute("href", "/design")
    expect(link).toHaveAttribute("target", "_self")
    expect(ref.current).toBe(link)
  })

  it("shares Button variants and sizes", () => {
    render(
      <ButtonLink href="/design" variant="secondary" size="compact">
        Components
      </ButtonLink>,
    )

    const link = screen.getByRole("link", { name: "Components" })
    expect(link).toHaveAttribute("data-variant", "secondary")
    expect(link).toHaveAttribute("data-size", "compact")
  })

  it("shares the transparent outline treatment", () => {
    render(
      <ButtonLink href="/design" variant={"outline" as never}>
        Design guide
      </ButtonLink>,
    )

    const link = screen.getByRole("link", { name: "Design guide" })
    expect(link).toHaveAttribute("data-variant", "outline")
    expect(link.className).toMatch(/outline/)
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

  it("composes text, actions, and a decorative separator in one named group", () => {
    render(
      <ButtonGroup aria-label="Search actions" data-testid="compound-group">
        <ButtonGroupText>12 results</ButtonGroupText>
        <Button variant="ghost">Previous</Button>
        <ButtonGroupSeparator data-testid="separator" />
        <Button variant="ghost">Next</Button>
      </ButtonGroup>,
    )

    const group = screen.getByRole("group", { name: "Search actions" })
    expect(group).toHaveAttribute("data-slot", "button-group")
    expect(group).toHaveAttribute("data-orientation", "horizontal")
    expect(screen.getByText("12 results")).toHaveAttribute("data-slot", "button-group-text")
    expect(screen.getByTestId("separator")).toHaveAttribute(
      "data-slot",
      "button-group-separator",
    )
    expect(screen.getByTestId("separator")).toHaveAttribute("aria-hidden", "true")
  })

  it("supports labelled nested groups without cloning their children", () => {
    render(
      <ButtonGroup label="Editor toolbar">
        <ButtonGroup label="History">
          <Button variant="secondary">Undo</Button>
          <Button variant="secondary">Redo</Button>
        </ButtonGroup>
        <ButtonGroup label="Publish">
          <Button>Publish</Button>
          <Button size="icon" aria-label="Publish options">+</Button>
        </ButtonGroup>
      </ButtonGroup>,
    )

    expect(screen.getByRole("group", { name: "Editor toolbar" })).toBeVisible()
    expect(screen.getByRole("group", { name: "History" })).toBeVisible()
    expect(screen.getByRole("group", { name: "Publish" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Publish options" })).toBeVisible()
  })
})
