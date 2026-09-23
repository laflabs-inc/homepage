import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

function ExampleTooltip() {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>상태</TooltipTrigger>
        <TooltipContent>현재 정상 운영 중</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

describe("Tooltip", () => {
  it("opens on hover in a portal and describes its trigger", async () => {
    const user = userEvent.setup()
    render(<ExampleTooltip />)
    const trigger = screen.getByRole("button", { name: "상태" })

    await user.hover(trigger)
    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent("현재 정상 운영 중")
    expect(tooltip.closest("[data-radix-popper-content-wrapper]")?.parentElement).toBe(document.body)
    expect(trigger).toHaveAccessibleDescription("현재 정상 운영 중")
  })

  it("opens on focus and dismisses with Escape", async () => {
    const user = userEvent.setup()
    render(<ExampleTooltip />)
    const trigger = screen.getByRole("button", { name: "상태" })

    await user.tab()
    expect(trigger).toHaveFocus()
    expect(await screen.findByRole("tooltip")).toBeVisible()
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
