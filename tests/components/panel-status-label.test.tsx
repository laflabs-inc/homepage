import { createRef } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  Panel,
  PanelAction,
  PanelContent,
  PanelDescription,
  PanelFooter,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel"
import { StatusLabel } from "@/components/ui/status-label"

describe("Panel", () => {
  it("composes a labelled content region without hiding native semantics", () => {
    render(
      <Panel aria-labelledby="account-panel-title" tone="subtle">
        <PanelHeader>
          <PanelTitle id="account-panel-title">Account</PanelTitle>
          <PanelDescription>Manage the public company profile.</PanelDescription>
          <PanelAction><button type="button">Edit</button></PanelAction>
        </PanelHeader>
        <PanelContent><p>contact@laflabs.co</p></PanelContent>
        <PanelFooter>Updated today</PanelFooter>
      </Panel>,
    )

    const panel = screen.getByRole("region", { name: "Account" })
    expect(panel).toHaveAttribute("data-tone", "subtle")
    expect(screen.getByRole("heading", { level: 3, name: "Account" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument()
    expect(screen.getByText("contact@laflabs.co")).toBeInTheDocument()
    expect(screen.getByText("Updated today")).toBeInTheDocument()
  })

  it("forwards native div props and refs", () => {
    const ref = createRef<HTMLDivElement>()

    render(<Panel ref={ref} data-testid="panel" className="custom-panel" />)

    expect(ref.current).toBe(screen.getByTestId("panel"))
    expect(screen.getByTestId("panel")).toHaveClass("custom-panel")
    expect(screen.getByTestId("panel")).toHaveAttribute("data-tone", "default")
  })

  it("lets the title follow the surrounding document heading level", () => {
    render(<PanelTitle as="h2">Company settings</PanelTitle>)

    expect(screen.getByRole("heading", { level: 2, name: "Company settings" })).toBeInTheDocument()
  })
})

describe("StatusLabel", () => {
  it("shows semantic status text without creating a live region", () => {
    render(<StatusLabel variant="success">Published</StatusLabel>)

    const label = screen.getByText("Published")
    expect(label).toHaveAttribute("data-variant", "success")
    expect(label).not.toHaveAttribute("role")
    expect(label).not.toHaveAttribute("aria-live")
  })

  it("forwards native span props and refs", () => {
    const ref = createRef<HTMLSpanElement>()

    render(<StatusLabel ref={ref} title="Current state">Draft</StatusLabel>)

    expect(ref.current).toBe(screen.getByText("Draft"))
    expect(screen.getByText("Draft")).toHaveAttribute("title", "Current state")
    expect(screen.getByText("Draft")).toHaveAttribute("data-variant", "neutral")
  })
})
