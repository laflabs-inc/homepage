import { describe, expect, it } from "vitest"

import {
  categoriesByKind,
  documentDraftSchema,
  publishDocumentSchema,
  scheduleDocumentSchema,
} from "@/lib/documents/validation"

const validDraft = {
  kind: "notice",
  locale: "ko",
  slug: "service-update",
  category: "service",
  title: "서비스 업데이트",
  summary: "변경 사항을 안내합니다.",
  bodyMarkdown: "## 변경 사항\n본문",
}

describe("document validation", () => {
  it("accepts a complete localized draft and an empty draft summary", () => {
    expect(documentDraftSchema.safeParse(validDraft).success).toBe(true)
    expect(documentDraftSchema.safeParse({ ...validDraft, summary: "" }).success).toBe(true)
  })

  it("rejects slugs outside the lowercase hyphenated contract", () => {
    expect(documentDraftSchema.safeParse({ ...validDraft, slug: "Bad Slug" }).success).toBe(false)
    expect(documentDraftSchema.safeParse({ ...validDraft, slug: "bad_slug" }).success).toBe(false)
    expect(documentDraftSchema.safeParse({ ...validDraft, slug: "-bad-slug" }).success).toBe(false)
  })

  it("requires a non-empty summary for publication", () => {
    expect(publishDocumentSchema.safeParse({ ...validDraft, summary: "" }).success).toBe(false)
    expect(publishDocumentSchema.safeParse(validDraft).success).toBe(true)
  })

  it("trims publication summaries and rejects whitespace or line breaks", () => {
    expect(publishDocumentSchema.safeParse({ ...validDraft, summary: "   " }).success).toBe(false)
    expect(publishDocumentSchema.safeParse({ ...validDraft, summary: "line one\nline two" }).success).toBe(false)
    expect(publishDocumentSchema.safeParse({ ...validDraft, summary: "line one\rline two" }).success).toBe(false)
    expect(publishDocumentSchema.parse({ ...validDraft, summary: "  visible summary  " }).summary).toBe("visible summary")
    expect(publishDocumentSchema.safeParse({ ...validDraft, summary: `  ${"가".repeat(240)}  ` }).success).toBe(true)
  })

  it("counts summary limits by Unicode code point without splitting surrogate pairs", () => {
    const boundary = `${"가".repeat(239)}😀`
    const overflow = `${"가".repeat(240)}😀`

    expect(documentDraftSchema.safeParse({ ...validDraft, summary: boundary }).success).toBe(true)
    expect(publishDocumentSchema.safeParse({ ...validDraft, summary: boundary }).success).toBe(true)
    expect(documentDraftSchema.safeParse({ ...validDraft, summary: overflow }).success).toBe(false)
    expect(publishDocumentSchema.safeParse({ ...validDraft, summary: overflow }).success).toBe(false)
  })

  it("requires meaningful alt text on Markdown images before publication", () => {
    expect(publishDocumentSchema.safeParse({
      ...validDraft,
      bodyMarkdown: "![서비스 상태 화면](https://example.com/status.png)",
    }).success).toBe(true)
    expect(publishDocumentSchema.safeParse({
      ...validDraft,
      bodyMarkdown: "![](https://example.com/decorative.png)",
    }).success).toBe(false)
    expect(publishDocumentSchema.safeParse({
      ...validDraft,
      bodyMarkdown: "![   ](https://example.com/decorative.png)",
    }).success).toBe(false)
    expect(publishDocumentSchema.safeParse({
      ...validDraft,
      bodyMarkdown: "![][logo]\n\n[logo]: https://example.com/logo.png",
    }).success).toBe(false)
  })

  it("ignores raw HTML images because raw HTML is not rendered", () => {
    expect(publishDocumentSchema.safeParse({
      ...validDraft,
      bodyMarkdown: "<img src=\"https://example.com/inert.png\">",
    }).success).toBe(true)
  })

  it.each([
    ["title", "가".repeat(160), true],
    ["title", "가".repeat(161), false],
    ["summary", "가".repeat(240), true],
    ["summary", "가".repeat(241), false],
    ["bodyMarkdown", "가".repeat(200_000), true],
    ["bodyMarkdown", "가".repeat(200_001), false],
  ] as const)("enforces the %s length boundary", (field, value, success) => {
    expect(documentDraftSchema.safeParse({ ...validDraft, [field]: value }).success).toBe(success)
  })

  it.each(["notice", "legal", "disclosure", "design"] as const)("accepts the %s kind", (kind) => {
    expect(documentDraftSchema.safeParse({
      ...validDraft,
      kind,
      category: categoriesByKind[kind][0],
    }).success).toBe(true)
  })

  it.each(["ko", "en"] as const)("accepts the %s locale", (locale) => {
    expect(documentDraftSchema.safeParse({ ...validDraft, locale }).success).toBe(true)
  })

  it("uses an explicit allowlist for every document kind", () => {
    expect(categoriesByKind).toEqual({
      notice: ["general", "service", "maintenance", "security"],
      legal: ["privacy", "terms", "cookies", "policy"],
      disclosure: ["corporate", "financial", "governance", "material"],
      design: ["foundation", "brand", "component", "resource"],
    })

    for (const kind of ["notice", "legal", "disclosure", "design"] as const) {
      for (const category of categoriesByKind[kind]) {
        expect(documentDraftSchema.safeParse({ ...validDraft, kind, category }).success).toBe(true)
      }
      expect(documentDraftSchema.safeParse({ ...validDraft, kind, category: "not-allowed" }).success).toBe(false)
    }

    expect(documentDraftSchema.safeParse({ ...validDraft, kind: "legal", category: "service" }).success).toBe(false)
  })

  it("accepts only a future scheduled publication date", () => {
    expect(scheduleDocumentSchema.safeParse({ scheduledAt: new Date(Date.now() + 60_000) }).success).toBe(true)
    expect(scheduleDocumentSchema.safeParse({ scheduledAt: new Date(Date.now() - 60_000) }).success).toBe(false)
  })
})
