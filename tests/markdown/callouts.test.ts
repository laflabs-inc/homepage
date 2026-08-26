import { describe, expect, it } from "vitest"
import { unified } from "unified"
import remarkParse from "remark-parse"

import { remarkLafCallouts } from "@/lib/markdown/callouts"

function parseWithCallouts(source: string) {
  const processor = unified().use(remarkParse).use(remarkLafCallouts)
  return processor.runSync(processor.parse(source))
}

describe("remarkLafCallouts", () => {
  it("turns an allowlisted warning marker into callout metadata", () => {
    const tree = parseWithCallouts("> [!WARNING] 배포 전\n> 반드시 검토하세요.")

    expect(tree.children[0]).toMatchObject({
      type: "blockquote",
      data: {
        hProperties: {
          "data-callout": "warning",
          "data-callout-title": "배포 전",
        },
      },
    })
  })

  it("leaves unknown callout markers as ordinary blockquotes", () => {
    const tree = parseWithCallouts("> [!SCRIPT] 실행\n> 일반 인용문입니다.")

    expect(tree.children[0]).toMatchObject({ type: "blockquote" })
    expect(tree.children[0]).not.toHaveProperty("data")
  })
})
