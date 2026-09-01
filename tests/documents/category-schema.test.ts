import { getTableConfig, type PgTable } from "drizzle-orm/pg-core"
import { describe, expect, it } from "vitest"

import * as schema from "@/lib/db/schema"

const tables = schema as unknown as Record<string, PgTable>

describe("document category schema", () => {
  it("stores stable localized category records", () => {
    const categories = tables.documentCategories

    expect(categories).toBeDefined()
    if (!categories) return

    const config = getTableConfig(categories)
    expect(config.columns.map((column) => column.name)).toEqual([
      "id",
      "kind",
      "slug",
      "label_ko",
      "label_en",
      "sort_order",
      "active",
      "version",
      "created_by",
      "updated_by",
      "created_at",
      "updated_at",
    ])
    expect(config.indexes.map((index) => index.config.name)).toEqual(expect.arrayContaining([
      "document_categories_kind_slug_unique",
      "document_categories_kind_active_order_idx",
    ]))
    expect(config.checks.map((constraint) => constraint.name)).toEqual(expect.arrayContaining([
      "document_categories_sort_order_nonnegative",
      "document_categories_version_positive",
    ]))
  })

  it("relates series categories by kind and slug", () => {
    const config = getTableConfig(tables.documentSeries)
    const categoryReference = config.foreignKeys.find(
      (key) => key.reference().foreignTable === tables.documentCategories,
    )

    expect(categoryReference).toBeDefined()
    expect(categoryReference?.reference().columns.map((column) => column.name)).toEqual([
      "kind",
      "category",
    ])
    expect(categoryReference?.reference().foreignColumns.map((column) => column.name)).toEqual([
      "kind",
      "slug",
    ])
  })
})
