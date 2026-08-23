import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/content/content.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { MarkdownDocument } from "@/components/content/markdown-document"

const fixture = `
## 중복 제목

## 중복 제목

| 이름 | 상태 |
| --- | --- |
| 문서 | 준비 |

- [x] 검토 완료

[안전한 링크](https://laflabs.example/docs)
[안전하지 않은 링크](javascript:alert('xss'))

![설명 이미지](https://images.example/laf.png)

\`\`\`ts
const ready = true
\`\`\`

> [!WARNING] 배포 전
> 반드시 검토하세요.
`

describe("MarkdownDocument", () => {
  it("renders safe GitHub-flavored Markdown with LafLabs document semantics", () => {
    render(<MarkdownDocument source={fixture} title="문서 제목" />)

    expect(screen.getByRole("heading", { level: 1, name: "문서 제목" })).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { level: 2, name: "중복 제목" })).toHaveLength(2)
    expect(screen.getAllByRole("heading", { level: 2, name: "중복 제목" })[0]).toHaveAttribute("id", "중복-제목")
    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.getByRole("table").parentElement?.className).toContain("tableScroll")
    expect(screen.getByRole("region", { name: "Scrollable table" })).toHaveAttribute("tabindex", "0")
    expect(screen.getByRole("checkbox")).toBeChecked()
    expect(screen.getByRole("link", { name: "안전한 링크" })).toHaveAttribute("rel", "noreferrer noopener")
    expect(screen.getByText("안전하지 않은 링크").closest("a")).not.toHaveAttribute("href")
    expect(screen.getByRole("img", { name: "설명 이미지" })).toHaveAttribute("src", "https://images.example/laf.png")
    expect(screen.getByText("const ready = true").closest("pre")).toBeInTheDocument()
    expect(screen.getByText("반드시 검토하세요.").closest("blockquote")).toHaveAttribute("data-callout", "warning")
    expect(screen.getByText("배포 전")).toBeInTheDocument()
  })
})
