import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SidePanel,
  SidePanelContent,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
} from "@/components/ui/side-panel"

describe("AlertDialog", () => {
  it("requires an explicit action or cancel decision and restores trigger focus", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <AlertDialog>
        <AlertDialogTrigger>Delete document</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    )

    const trigger = screen.getByRole("button", { name: "Delete document" })
    await user.click(trigger)

    expect(screen.getByRole("alertdialog", { name: "Delete this document?" }))
      .toHaveAccessibleDescription("This action cannot be undone.")

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    await user.click(screen.getByRole("button", { name: "Delete" }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })
})

describe("Popover", () => {
  it("opens an accessible supporting surface and dismisses with Escape", async () => {
    const user = userEvent.setup()

    render(
      <Popover>
        <PopoverTrigger>Inspect filters</PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Filters</PopoverTitle>
            <PopoverDescription>Narrow the document list.</PopoverDescription>
          </PopoverHeader>
          <button type="button">Apply</button>
        </PopoverContent>
      </Popover>,
    )

    const trigger = screen.getByRole("button", { name: "Inspect filters" })
    await user.click(trigger)
    expect(screen.getByRole("dialog", { name: "Filters" }))
      .toHaveAccessibleDescription("Narrow the document list.")

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})

describe("SidePanel", () => {
  it("opens from each supported edge and keeps dialog semantics", async () => {
    const user = userEvent.setup()

    render(
      <SidePanel>
        <SidePanelTrigger>Open settings</SidePanelTrigger>
        <SidePanelContent side="left" closeLabel="Close settings">
          <SidePanelHeader>
            <SidePanelTitle>Settings</SidePanelTitle>
            <SidePanelDescription>Manage this workspace.</SidePanelDescription>
          </SidePanelHeader>
          <SidePanelFooter>Saved automatically</SidePanelFooter>
        </SidePanelContent>
      </SidePanel>,
    )

    await user.click(screen.getByRole("button", { name: "Open settings" }))
    const panel = screen.getByRole("dialog", { name: "Settings" })
    expect(panel).toHaveAttribute("data-side", "left")
    expect(panel).toHaveAccessibleDescription("Manage this workspace.")

    await user.click(screen.getByRole("button", { name: "Close settings" }))
    expect(panel).not.toBeInTheDocument()
  })
})

describe("InputGroup", () => {
  it("keeps one native input while composing text and actions around it", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <InputGroup>
        <InputGroupAddon placement="start"><InputGroupText>https://</InputGroupText></InputGroupAddon>
        <InputGroupInput aria-label="Project domain" defaultValue="laflabs.co" />
        <InputGroupAddon placement="end">
          <InputGroupButton type="button" onClick={onSubmit}>Verify</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    )

    expect(screen.getByRole("textbox", { name: "Project domain" })).toHaveValue("laflabs.co")
    await user.click(screen.getByRole("button", { name: "Verify" }))
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(screen.getByText("https://")).toHaveAttribute("aria-hidden", "true")
  })
})

describe("Breadcrumb", () => {
  it("exposes hierarchy as navigation and hides visual separators", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbEllipsis label="More levels" /></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Design</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )

    const navigation = screen.getByRole("navigation", { name: "Breadcrumb" })
    expect(within(navigation).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/")
    expect(within(navigation).getByText("Design")).toHaveAttribute("aria-current", "page")
    expect(within(navigation).getByLabelText("More levels")).toBeInTheDocument()
    expect(navigation.querySelectorAll("[data-breadcrumb-separator]")).toHaveLength(2)
    navigation.querySelectorAll("[data-breadcrumb-separator]").forEach((separator) => {
      expect(separator).toHaveAttribute("aria-hidden", "true")
    })
  })
})

const frameworkOptions: readonly ComboboxOption[] = [
  { value: "next", label: "Next.js", keywords: ["react"] },
  { value: "astro", label: "Astro" },
  { value: "legacy", label: "Legacy stack", disabled: true },
  { value: "remix", label: "Remix" },
]

describe("Combobox", () => {
  it("renders its listbox outside clipping preview containers", async () => {
    const user = userEvent.setup()

    render(
      <div data-testid="clipped-preview" style={{ height: 80, overflow: "hidden" }}>
        <Combobox
          aria-label="Framework"
          emptyText="No framework found"
          options={frameworkOptions}
          placeholder="Search frameworks"
        />
      </div>,
    )

    await user.click(screen.getByRole("combobox", { name: "Framework" }))

    const preview = screen.getByTestId("clipped-preview")
    const listbox = screen.getByRole("listbox")
    expect(preview).not.toContainElement(listbox)
    expect(document.body).toContainElement(listbox)
  })

  it("filters options, skips disabled choices, and selects with the keyboard", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    function Example() {
      const [value, setValue] = useState("")
      return (
        <Combobox
          aria-label="Framework"
          emptyText="No framework found"
          onValueChange={(next) => {
            setValue(next)
            onValueChange(next)
          }}
          options={frameworkOptions}
          placeholder="Search frameworks"
          value={value}
        />
      )
    }

    render(<Example />)
    const input = screen.getByRole("combobox", { name: "Framework" })
    expect(input).toHaveAttribute("aria-expanded", "false")

    await user.click(input)
    expect(screen.getByRole("listbox")).toBeVisible()
    expect(screen.getByRole("option", { name: "Legacy stack" })).toHaveAttribute("aria-disabled", "true")

    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}")
    expect(onValueChange).toHaveBeenCalledWith("remix")
    expect(input).toHaveValue("Remix")
    expect(input).toHaveAttribute("aria-expanded", "false")

    await user.clear(input)
    await user.type(input, "react")
    expect(screen.getByRole("option", { name: "Next.js" })).toBeVisible()
    expect(screen.queryByRole("option", { name: "Astro" })).not.toBeInTheDocument()

    await user.clear(input)
    await user.type(input, "unknown")
    expect(screen.getByText("No framework found")).toBeVisible()
  })
})
