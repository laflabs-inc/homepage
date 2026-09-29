import { describe, expect, it } from "vitest"

import {
  buildMarkdownImage,
  extractLafMediaReferences,
  UnsupportedLafMediaMarkupError,
} from "@/lib/markdown/media-assets"

const first = "11111111-1111-4111-8111-111111111111"
const second = "22222222-2222-4222-8222-222222222222"

describe("Markdown media assets", () => {
  it("extracts direct and reference images once in source order", () => {
    const source = [
      `![첫 이미지](/media/${first}/hero.png)`,
      `![중복](/media/${first}/hero.png)`,
      `![둘째][asset]`,
      "![외부](https://example.com/image.png)",
      "",
      `[asset]: /media/${second}/detail.webp`,
    ].join("\n")

    expect(extractLafMediaReferences(source)).toEqual([
      { assetId: first, src: `/media/${first}/hero.png`, alt: "첫 이미지" },
      { assetId: second, src: `/media/${second}/detail.webp`, alt: "둘째" },
    ])
  })

  it.each([
    `/media/not-a-uuid/hero.png`,
    `/media/${first}/hero.png?size=2`,
    `/media/${first}/hero.png#detail`,
    `/media/${first}/nested/hero.png`,
  ])("rejects malformed LafLabs media path %s", (src) => {
    expect(() => extractLafMediaReferences(`![alt](${src})`)).toThrow(UnsupportedLafMediaMarkupError)
  })

  it("rejects raw HTML that could escape reference tracking", () => {
    expect(() => extractLafMediaReferences(`<img src="/media/${first}/hero.png" alt="hero">`))
      .toThrow(UnsupportedLafMediaMarkupError)
  })

  it("builds one escaped stable Markdown image", () => {
    expect(buildMarkdownImage({ src: `/media/${first}/hero.png`, alt: "대괄호 [확인] \\ 경로" }))
      .toBe(`![대괄호 \\[확인\\] \\\\ 경로](/media/${first}/hero.png)`)
  })

  it("refuses external paths when building managed image Markdown", () => {
    expect(() => buildMarkdownImage({ src: "https://example.com/hero.png", alt: "hero" }))
      .toThrow(UnsupportedLafMediaMarkupError)
  })
})
