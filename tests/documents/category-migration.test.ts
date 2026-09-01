import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PGlite } from "@electric-sql/pglite"
import { describe, expect, it } from "vitest"

const migrationPath = join(process.cwd(), "drizzle/0010_busy_typhoid_mary.sql")

describe("document category migration", () => {
  it("seeds categories before constraining existing document series", async () => {
    const migration = readFileSync(migrationPath, "utf8")
    const createTableAt = migration.indexOf('CREATE TABLE "document_categories"')
    const seedAt = migration.indexOf('INSERT INTO "document_categories"')
    const foreignKeyAt = migration.indexOf(
      'ALTER TABLE "document_series" ADD CONSTRAINT "document_series_kind_category_fk"',
    )

    expect(createTableAt).toBeGreaterThanOrEqual(0)
    expect(seedAt).toBeGreaterThan(createTableAt)
    expect(foreignKeyAt).toBeGreaterThan(seedAt)

    const database = new PGlite()
    try {
      await database.exec(`
        CREATE TYPE "public"."document_kind" AS ENUM('notice', 'legal', 'disclosure');
        CREATE TABLE "document_series" (
          "id" uuid PRIMARY KEY,
          "kind" "public"."document_kind" NOT NULL,
          "category" text
        );
        INSERT INTO "document_series" ("id", "kind", "category") VALUES
          ('00000000-0000-0000-0000-000000000001', 'notice', 'service'),
          ('00000000-0000-0000-0000-000000000002', 'legal', 'privacy'),
          ('00000000-0000-0000-0000-000000000003', 'disclosure', 'financial'),
          ('00000000-0000-0000-0000-000000000004', 'notice', NULL);
      `)

      await database.exec(migration)

      const categories = await database.query<{
        kind: string
        slug: string
        labelKo: string
        labelEn: string
        sortOrder: number
      }>(`
        SELECT
          "kind"::text AS "kind",
          "slug",
          "label_ko" AS "labelKo",
          "label_en" AS "labelEn",
          "sort_order" AS "sortOrder"
        FROM "document_categories"
        ORDER BY "kind", "sort_order"
      `)
      const series = await database.query<{ count: number }>(
        'SELECT count(*)::integer AS "count" FROM "document_series"',
      )

      expect(categories.rows).toHaveLength(12)
      expect(categories.rows).toContainEqual({
        kind: "notice",
        slug: "service",
        labelKo: "서비스",
        labelEn: "Service",
        sortOrder: 1,
      })
      expect(categories.rows).toContainEqual({
        kind: "disclosure",
        slug: "financial",
        labelKo: "재무",
        labelEn: "Financial",
        sortOrder: 1,
      })
      expect(series.rows).toEqual([{ count: 4 }])
    } finally {
      await database.close()
    }
  })
})
