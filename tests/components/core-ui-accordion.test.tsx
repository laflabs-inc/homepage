import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

describe("Accordion", () => {
  it("opens one item at a time and supports collapsing the active item", async () => {
    const user = userEvent.setup()
    render(
      <Accordion type="single" defaultValue="build" collapsible>
        <AccordionItem value="build">
          <AccordionTrigger>구축</AccordionTrigger>
          <AccordionContent>제품을 만듭니다.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="operate">
          <AccordionTrigger>운영</AccordionTrigger>
          <AccordionContent>직접 운영합니다.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )

    expect(screen.getByRole("button", { name: "구축" })).toHaveAttribute("aria-expanded", "true")
    await user.click(screen.getByRole("button", { name: "운영" }))
    expect(screen.getByRole("button", { name: "구축" })).toHaveAttribute("aria-expanded", "false")
    expect(screen.getByText("직접 운영합니다.")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "운영" }))
    expect(screen.getByRole("button", { name: "운영" })).toHaveAttribute("aria-expanded", "false")
  })

  it("keeps multiple items open and marks disabled triggers", async () => {
    const user = userEvent.setup()
    render(
      <Accordion type="multiple" defaultValue={["one"]}>
        <AccordionItem value="one">
          <AccordionTrigger>원칙</AccordionTrigger>
          <AccordionContent>작게 시작합니다.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="two">
          <AccordionTrigger>운영</AccordionTrigger>
          <AccordionContent>끝까지 운영합니다.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="three" disabled>
          <AccordionTrigger>비공개</AccordionTrigger>
          <AccordionContent>비공개 내용</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )

    await user.click(screen.getByRole("button", { name: "운영" }))
    expect(screen.getByText("작게 시작합니다.")).toBeVisible()
    expect(screen.getByText("끝까지 운영합니다.")).toBeVisible()
    expect(screen.getByRole("button", { name: "비공개" })).toBeDisabled()
  })

  it("moves focus between enabled triggers with arrow keys", async () => {
    const user = userEvent.setup()
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="one"><AccordionTrigger>첫째</AccordionTrigger><AccordionContent>하나</AccordionContent></AccordionItem>
        <AccordionItem value="two" disabled><AccordionTrigger>둘째</AccordionTrigger><AccordionContent>둘</AccordionContent></AccordionItem>
        <AccordionItem value="three"><AccordionTrigger>셋째</AccordionTrigger><AccordionContent>셋</AccordionContent></AccordionItem>
      </Accordion>,
    )

    const first = screen.getByRole("button", { name: "첫째" })
    first.focus()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("button", { name: "셋째" })).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(first).toHaveFocus()
  })
})
