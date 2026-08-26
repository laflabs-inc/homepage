import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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
    expect(screen.getByRole("code").closest("pre")).toHaveTextContent("const ready = true")
    expect(screen.getByText("반드시 검토하세요.").closest("blockquote")).toHaveAttribute("data-callout", "warning")
    expect(screen.getByText("배포 전")).toBeInTheDocument()
    expect(document.querySelector("script[data-hostile='true']")).not.toBeInTheDocument()
  })

  it("renders the approved document HTML while stripping executable markup", () => {
    render(
      <MarkdownDocument
        title="HTML 문서"
        source={`
<mark>중요 표시</mark> H<sub>2</sub>O <kbd>Ctrl</kbd>

<details open>
<summary><strong>세부 내용</strong></summary>

안쪽에서도 **마크다운 강조**가 동작합니다.

- 첫 번째 항목
- 두 번째 항목

</details>

<abbr title="HyperText Markup Language">HTML</abbr>
<script data-hostile="true">alert('xss')</script>
`}
      />,
    )

    expect(screen.getByText("중요 표시").tagName).toBe("MARK")
    expect(screen.getByText("2").tagName).toBe("SUB")
    expect(screen.getByText("Ctrl").tagName).toBe("KBD")
    const details = screen.getByText("세부 내용").closest("details")
    expect(details).toHaveAttribute("open")
    expect(within(details as HTMLElement).getByText("마크다운 강조").tagName).toBe("STRONG")
    expect(within(details as HTMLElement).getAllByRole("listitem")).toHaveLength(2)
    expect(screen.getByText("HTML")).toHaveAttribute("title", "HyperText Markup Language")
    expect(document.querySelector("script[data-hostile='true']")).not.toBeInTheDocument()
  })

  it("typesets inline and display math", () => {
    const { container } = render(
      <MarkdownDocument
        title="수식 문서"
        source={`인라인 수식 $E = mc^2$ 입니다.\n\n$$\n\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}\n$$`}
      />,
    )

    expect(container.querySelectorAll(".katex")).toHaveLength(2)
    expect(container.querySelector(".katex-display")).toBeInTheDocument()
  })

  it("typesets aligned equations and matrices without KaTeX errors", () => {
    const { container } = render(
      <MarkdownDocument
        title="복합 수식 문서"
        source={`인라인 수식: $E = mc^2$ 이고, 오일러 항등식은 $e^{i\\pi} + 1 = 0$ 입니다.

$$
\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}
$$

$$
\\begin{aligned}
f(x) &= \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n \\\\
     &= f(a) + f'(a)(x-a) + \\frac{f''(a)}{2!}(x-a)^2 + \\cdots
\\end{aligned}
$$

$$
A = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}, \\quad \\det(A) = ad - bc
$$`}
      />,
    )

    expect(container.querySelectorAll(".katex")).toHaveLength(5)
    expect(container.querySelectorAll(".katex-display")).toHaveLength(3)
    expect(container.querySelector(".katex-error")).not.toBeInTheDocument()
    expect(container.querySelector(".mord.mtight")).toBeInTheDocument()
  })

  it("highlights fenced code and copies its original source", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MarkdownDocument
        title="코드 문서"
        source={`\`\`\`javascript\nconst ready = true\n\`\`\``}
      />,
    )

    expect(container.querySelector(".hljs-keyword")).toHaveTextContent("const")
    const copy = screen.getByRole("button", { name: "Copy JavaScript code" })
    await user.click(copy)
    expect(copy).toHaveTextContent("COPIED")
    await expect(navigator.clipboard.readText()).resolves.toBe("const ready = true")
  })

  it("turns Mermaid fences into an accessible diagram surface", () => {
    render(
      <MarkdownDocument
        title="다이어그램 문서"
        source={`\`\`\`mermaid\ngraph TD\n  A[시작] --> B[종료]\n\`\`\``}
      />,
    )

    const diagram = screen.getByRole("figure", { name: "Mermaid diagram" })
    expect(within(diagram).getByText("DIAGRAM / MERMAID")).toBeInTheDocument()
  })
})
