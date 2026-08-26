import { readFileSync } from "node:fs"
import { join } from "node:path"
import { getTableConfig } from "drizzle-orm/pg-core"
import { describe, expect, it } from "vitest"
import { adminAuditLog, documentRevisions, documentSeries } from "@/lib/db/schema"

const metadataLockMigration = readFileSync(
  join(process.cwd(), "drizzle/0004_sad_skin.sql"),
  "utf8",
)

describe("document schema", () => {
  it("separates stable series from immutable localized revisions", () => {
    expect(getTableConfig(documentSeries).columns.map((c) => c.name)).toEqual([
      "id", "kind", "slug", "category", "pinned", "metadata_locked", "archived_at",
      "created_by", "created_at", "updated_at",
    ])
    expect(getTableConfig(documentRevisions).columns.map((c) => c.name)).toEqual([
      "id", "series_id", "locale", "revision", "title", "summary",
      "body_markdown", "status", "effective_at", "scheduled_at",
      "published_at", "created_by", "updated_by", "published_by",
      "created_at", "updated_at",
    ])
  })

  it("keeps audit metadata separate from document bodies", () => {
    expect(getTableConfig(adminAuditLog).columns.map((c) => c.name)).toEqual([
      "id", "action", "target_type", "target_id", "actor_github_id",
      "actor_name", "metadata", "created_at",
    ])
  })

  it("backfills permanent metadata locks before constraining the new column", () => {
    const addColumn = metadataLockMigration.indexOf(
      'ADD COLUMN "metadata_locked" boolean;',
    )
    const backfillImmutableSeries = metadataLockMigration.indexOf(
      'r."status" <> \'draft\'',
    )
    const fillDraftSeries = metadataLockMigration.indexOf(
      'SET "metadata_locked" = false',
    )
    const setDefault = metadataLockMigration.indexOf(
      'ALTER COLUMN "metadata_locked" SET DEFAULT false',
    )
    const setNotNull = metadataLockMigration.indexOf(
      'ALTER COLUMN "metadata_locked" SET NOT NULL',
    )

    expect(addColumn).toBeGreaterThanOrEqual(0)
    expect(backfillImmutableSeries).toBeGreaterThan(addColumn)
    expect(fillDraftSeries).toBeGreaterThan(backfillImmutableSeries)
    expect(setDefault).toBeGreaterThan(fillDraftSeries)
    expect(setNotNull).toBeGreaterThan(setDefault)
    expect(metadataLockMigration).toContain(
      'r."series_id" = s."id"',
    )
  })
})
