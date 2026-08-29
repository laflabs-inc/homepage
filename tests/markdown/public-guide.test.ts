import { describe, expect, it } from "vitest"

import { GET } from "@/app/markdown-guide.md/route"

describe("public Markdown authoring guide", () => {
  it("serves the AI authoring contract as cacheable Markdown without authentication", async () => {
    const response = await GET()
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8")
    expect(response.headers.get("cache-control")).toContain("public")
    expect(response.headers.get("content-disposition")).toContain("laflabs-markdown-guide.md")
    expect(body).toMatch(/^# LafLabs Markdown 작성 가이드/m)
    expect(body).toContain("## 먼저 지킬 원칙")
    expect(body).toContain("~~~mermaid")
  })
})
