import { describe, expect, it } from "vitest"

import { buildDocumentOutline } from "@/lib/markdown/outline"

describe("buildDocumentOutline", () => {
  it("creates stable, duplicate-safe IDs for H2 and H3 headings", () => {
    expect(buildDocumentOutline("# 문서\n\n## 시작\n\n### 표\n\n## 시작\n\n#### 제외")).toEqual([
      { depth: 2, id: "시작", text: "시작" },
      { depth: 3, id: "표", text: "표" },
      { depth: 2, id: "시작-1", text: "시작" },
    ])
  })

  it("reserves slugs for headings outside the table of contents", () => {
    expect(buildDocumentOutline("# Same\n\n## Same\n\n#### Same\n\n### Same")).toEqual([
      { depth: 2, id: "same-1", text: "Same" },
      { depth: 3, id: "same-3", text: "Same" },
    ])
  })

  it("uses the renderer's GFM heading text semantics", () => {
    expect(buildDocumentOutline("## ![alt](/image.png)\n\n### ~~struck~~ text")).toEqual([
      { depth: 2, id: "", text: "" },
      { depth: 3, id: "struck-text", text: "struck text" },
    ])
  })
})
