import { render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/app/admin/admin.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/components/content/content.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { MarkdownAuthoringGuide } from "@/components/admin/markdown-authoring-guide"

describe("MarkdownAuthoringGuide", () => {
  it("renders delimiter guidance without sending Korean prose into math mode", () => {
    const warnings: string[] = []
    const warningSpy = vi.spyOn(console, "warn").mockImplementation((...values) => {
      warnings.push(values.map(String).join(" "))
    })

    render(<MarkdownAuthoringGuide />)
    warningSpy.mockRestore()

    expect(warnings.filter((warning) => warning.includes("LaTeX-incompatible input"))).toEqual([])
  })

  it("demonstrates the renderer's rich document features through real output", () => {
    const { container } = render(<MarkdownAuthoringGuide />)

    expect(screen.getByRole("heading", { level: 1, name: "Markdown 작성 가이드" })).toBeInTheDocument()
    const contents = screen.getByRole("navigation", { name: "가이드 목차" })
    expect(within(contents).getByRole("link", { name: "콜아웃" })).toHaveAttribute("href", "#콜아웃")
    expect(screen.getByText("배포 전 확인").closest("blockquote")).toHaveAttribute("data-callout", "warning")
    expect(screen.getAllByRole("table")).toHaveLength(2)
    expect(screen.getByRole("button", { name: "Copy TypeScript code" })).toBeInTheDocument()
    expect(container.querySelector(".katex-display")).toBeInTheDocument()
    expect(screen.getByRole("figure", { name: "Mermaid diagram" })).toBeInTheDocument()
    expect(screen.getByText("접어서 둘 내용").closest("details")).toBeInTheDocument()
  })
})
