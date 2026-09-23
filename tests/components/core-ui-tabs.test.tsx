import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function ExampleTabs({ onValueChange = vi.fn() }: { onValueChange?: (value: string) => void }) {
  return (
    <Tabs defaultValue="overview" onValueChange={onValueChange}>
      <TabsList aria-label="문서 보기">
        <TabsTrigger value="overview">개요</TabsTrigger>
        <TabsTrigger value="api">API</TabsTrigger>
        <TabsTrigger value="history" disabled>변경 이력</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">개요 내용</TabsContent>
      <TabsContent value="api">API 내용</TabsContent>
      <TabsContent value="history">변경 이력 내용</TabsContent>
    </Tabs>
  )
}

describe("Tabs", () => {
  it("associates the active trigger and panel", () => {
    render(<ExampleTabs />)

    const overview = screen.getByRole("tab", { name: "개요" })
    expect(overview).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tabpanel", { name: "개요" })).toHaveTextContent("개요 내용")
    expect(screen.getByRole("tab", { name: "변경 이력" })).toHaveAttribute("data-disabled", "")
  })

  it("moves focus with arrow keys, skips disabled tabs, and changes the active value", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<ExampleTabs onValueChange={onValueChange} />)

    const overview = screen.getByRole("tab", { name: "개요" })
    overview.focus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "API" })).toHaveFocus()
    expect(onValueChange).toHaveBeenCalledWith("api")
    expect(screen.getByRole("tabpanel", { name: "API" })).toHaveTextContent("API 내용")

    await user.keyboard("{ArrowRight}")
    expect(overview).toHaveFocus()
  })

  it("reports controlled value changes without mutating the controlled panel", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Tabs value="overview" onValueChange={onValueChange}>
        <TabsList aria-label="제어 보기">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">현재 내용</TabsContent>
        <TabsContent value="api">다음 내용</TabsContent>
      </Tabs>,
    )

    await user.click(screen.getByRole("tab", { name: "API" }))
    expect(onValueChange).toHaveBeenCalledWith("api")
    expect(screen.getByRole("tabpanel", { name: "개요" })).toBeVisible()
  })

  it("aligns vertical keyboard navigation with a vertical visual layout", async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue="overview" orientation="vertical">
        <TabsList aria-label="세로 문서 보기">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">개요 내용</TabsContent>
        <TabsContent value="api">API 내용</TabsContent>
      </Tabs>,
    )

    const overview = screen.getByRole("tab", { name: "개요" })
    expect(screen.getByRole("tablist", { name: "세로 문서 보기" })).toHaveAttribute(
      "aria-orientation",
      "vertical",
    )
    overview.focus()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("tab", { name: "API" })).toHaveFocus()

    const css = readFileSync(join(process.cwd(), "components/ui/tabs.module.css"), "utf8")
    expect(css).toContain('[data-orientation="vertical"]')
  })
})
