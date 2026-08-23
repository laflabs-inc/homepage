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
})
