import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/content/content.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { MarkdownDocument } from "@/components/content/markdown-document"

const fixture = `
## 중복 제목

## 중복 제목

# Same

## Same

#### Same

### Same

| 이름 | 상태 |
| --- | --- |
| 문서 | 준비 |

- [x] 검토 완료

[안전한 링크](https://laflabs.example/docs)
[대문자 HTTPS 링크](HTTPS://laflabs.example/docs)
[HTTP 링크](http://laflabs.example/docs)
[메일 링크](mailto:hello@laflabs.example)
[해시 링크](#section)
[루트 링크](/documents)
[프로토콜 상대 링크](//laflabs.example/docs)
[안전하지 않은 링크](javascript:alert('xss'))

![설명 이미지](https://images.example/laf.png)
![루트 이미지](/laflabs-logo.png)
![HTTP 이미지](http://images.example/laf.png)
![프로토콜 상대 이미지](//images.example/laf.png)

\`\`\`ts
const ready = true
\`\`\`

> [!WARNING] 배포 전
> 반드시 검토하세요.

<script data-hostile="true">alert('xss')</script>
`

describe("MarkdownDocument", () => {
  it("renders safe GitHub-flavored Markdown with LafLabs document semantics", () => {
    render(<MarkdownDocument source={fixture} title="문서 제목" />)

    expect(screen.getByRole("heading", { level: 1, name: "문서 제목" })).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { level: 2, name: "중복 제목" })).toHaveLength(2)
    expect(screen.getAllByRole("heading", { level: 2, name: "중복 제목" })[0]).toHaveAttribute("id", "중복-제목")
    expect(screen.getAllByRole("heading", { level: 2, name: "중복 제목" })[1]).toHaveAttribute("id", "중복-제목-1")
    expect(screen.getAllByRole("heading", { name: "Same" }).map((heading) => heading.id)).toEqual([
      "same",
      "same-1",
      "same-2",
      "same-3",
    ])
    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.getByRole("table").parentElement?.className).toContain("tableScroll")
    expect(screen.getByRole("region", { name: "Scrollable table" })).toHaveAttribute("tabindex", "0")
    expect(screen.getByRole("checkbox")).toBeChecked()
    expect(screen.getByRole("link", { name: "안전한 링크" })).toHaveAttribute("rel", "noreferrer noopener")
    expect(screen.getByRole("link", { name: "대문자 HTTPS 링크" })).toHaveAttribute("rel", "noreferrer noopener")
    expect(screen.getByRole("link", { name: "HTTP 링크" })).toHaveAttribute("href", "http://laflabs.example/docs")
    expect(screen.getByRole("link", { name: "메일 링크" })).toHaveAttribute("href", "mailto:hello@laflabs.example")
    expect(screen.getByRole("link", { name: "해시 링크" })).toHaveAttribute("href", "#section")
    expect(screen.getByRole("link", { name: "루트 링크" })).toHaveAttribute("href", "/documents")
    expect(screen.getByText("프로토콜 상대 링크").closest("a")).not.toHaveAttribute("href")
    expect(screen.getByText("안전하지 않은 링크").closest("a")).not.toHaveAttribute("href")
    expect(screen.getByRole("img", { name: "설명 이미지" })).toHaveAttribute("src", "https://images.example/laf.png")
    expect(screen.getByRole("img", { name: "루트 이미지" })).toHaveAttribute("src", "/laflabs-logo.png")
    expect(screen.getByRole("img", { name: "HTTP 이미지" })).not.toHaveAttribute("src")
    expect(screen.getByRole("img", { name: "프로토콜 상대 이미지" })).not.toHaveAttribute("src")
    expect(screen.getByText("const ready = true").closest("pre")).toBeInTheDocument()
    expect(screen.getByText("반드시 검토하세요.").closest("blockquote")).toHaveAttribute("data-callout", "warning")
    expect(screen.getByText("배포 전")).toBeInTheDocument()
    expect(document.querySelector("script[data-hostile='true']")).not.toBeInTheDocument()
  })
})
