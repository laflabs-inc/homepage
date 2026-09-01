import { describe, expect, it } from "vitest"

import {
  categoryCreateSchema,
  categoryReorderSchema,
  categoryUpdateSchema,
} from "@/lib/document-categories/validation"

describe("document category validation", () => {
  it("normalizes a new category slug and labels", () => {
    expect(categoryCreateSchema.parse({
      kind: "notice",
      slug: "  Product-Updates ",
      labelKo: "  제품 소식 ",
      labelEn: " Product updates ",
      sortOrder: 4,
    })).toEqual({
      kind: "notice",
      slug: "product-updates",
      labelKo: "제품 소식",
      labelEn: "Product updates",
      sortOrder: 4,
    })
  })

  it.each([
    ["slug with spaces", { slug: "product updates" }],
    ["empty Korean label", { labelKo: "  " }],
    ["negative order", { sortOrder: -1 }],
  ])("rejects %s", (_name, override) => {
    expect(categoryCreateSchema.safeParse({
      kind: "notice",
      slug: "updates",
      labelKo: "업데이트",
      labelEn: "Updates",
      sortOrder: 0,
      ...override,
    }).success).toBe(false)
  })

  it("requires an optimistic version when updating", () => {
    expect(categoryUpdateSchema.safeParse({
      labelKo: "일반",
      labelEn: "General",
      sortOrder: 0,
      active: true,
    }).success).toBe(false)
  })

  it("requires a complete unique reorder payload shape", () => {
    expect(categoryReorderSchema.safeParse({
      kind: "notice",
      items: [
        { id: "00000000-0000-4000-8000-000000000001", version: 1 },
        { id: "00000000-0000-4000-8000-000000000001", version: 1 },
      ],
    }).success).toBe(false)
    expect(categoryReorderSchema.safeParse({
      kind: "notice",
      items: [
        { id: "00000000-0000-4000-8000-000000000001", version: 1 },
        { id: "00000000-0000-4000-8000-000000000002", version: 2 },
      ],
    }).success).toBe(true)
  })
})
