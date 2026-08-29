import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PGlite } from "@electric-sql/pglite"
import { describe, expect, it } from "vitest"
import { documentKindEnum } from "@/lib/db/schema"

const migrationPath = join(process.cwd(), "drizzle/0009_retire_design_documents.sql")

const readMigration = () => readFileSync(migrationPath, "utf8")

describe("design document retirement migration", () => {
  it("keeps the Drizzle enum aligned with the supported document kinds", () => {
    expect(documentKindEnum.enumValues).toEqual(["notice", "legal", "disclosure"])
  })

  it("removes retired rows before replacing the enum and preserves supported documents", async () => {
    const migration = readMigration()

    expect(migration.indexOf('DELETE FROM "document_revisions"')).toBeLessThan(
      migration.indexOf('DROP TYPE "public"."document_kind"'),
    )
    expect(migration).toContain(
      'CREATE TYPE "public"."document_kind" AS ENUM(\'notice\', \'legal\', \'disclosure\')',
    )

    const database = new PGlite()

    try {
      await database.exec(`
        CREATE TYPE "public"."document_kind" AS ENUM('notice', 'legal', 'disclosure', 'design');
        CREATE TABLE "document_series" (
          "id" uuid PRIMARY KEY,
          "kind" "public"."document_kind" NOT NULL
        );
        CREATE TABLE "document_revisions" (
          "id" uuid PRIMARY KEY,
          "series_id" uuid NOT NULL REFERENCES "document_series"("id") ON DELETE RESTRICT
        );
        INSERT INTO "document_series" ("id", "kind") VALUES
          ('00000000-0000-0000-0000-000000000001', 'notice'),
          ('00000000-0000-0000-0000-000000000002', 'legal'),
          ('00000000-0000-0000-0000-000000000003', 'disclosure'),
          ('00000000-0000-0000-0000-000000000004', 'design');
        INSERT INTO "document_revisions" ("id", "series_id") VALUES
          ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
          ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'),
          ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003'),
          ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004');
      `)

      await database.exec(migration)

      const series = await database.query<{ kind: string }>(
        'SELECT "kind"::text AS "kind" FROM "document_series" ORDER BY "kind"',
      )
      const revisions = await database.query<{ count: number }>(
        'SELECT count(*)::integer AS "count" FROM "document_revisions"',
      )
      const kinds = await database.query<{ kind: string }>(
        'SELECT unnest(enum_range(NULL::"public"."document_kind"))::text AS "kind"',
      )

      expect(series.rows).toEqual([
        { kind: "disclosure" },
        { kind: "legal" },
        { kind: "notice" },
      ])
      expect(revisions.rows).toEqual([{ count: 3 }])
      expect(kinds.rows).toEqual([
        { kind: "notice" },
        { kind: "legal" },
        { kind: "disclosure" },
      ])
    } finally {
      await database.close()
    }
  })
})
