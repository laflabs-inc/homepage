import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { PGlite } from "@electric-sql/pglite"
import { describe, expect, it } from "vitest"

const migrationPath = join(process.cwd(), "drizzle/0011_media_platform.sql")

describe("media platform migration", () => {
  it("creates immutable path constraints and restricted references", async () => {
    expect(existsSync(migrationPath)).toBe(true)
    if (!existsSync(migrationPath)) return

    const migration = readFileSync(migrationPath, "utf8")
    expect(migration).toContain("media_public_pathname_unique")
    expect(migration).toContain("media_staging_pathname_unique")
    expect(migration).toContain("ON DELETE restrict")

    const database = new PGlite()
    try {
      await database.exec(migration)
      await database.exec(`
        INSERT INTO "media_assets" (
          "id", "visibility", "status", "original_filename", "declared_media_type",
          "family_id", "created_by", "updated_by", "created_by_name", "updated_by_name"
        ) VALUES (
          '00000000-0000-4000-8000-000000000001', 'public', 'ready', 'mark.png',
          'image/png', '00000000-0000-4000-8000-000000000001', '42', '42',
          'Laf Admin', 'Laf Admin'
        );
        INSERT INTO "media_asset_references" (
          "asset_id", "owner_type", "owner_id", "field"
        ) VALUES (
          '00000000-0000-4000-8000-000000000001', 'document_revision',
          '00000000-0000-4000-8000-000000000002', 'body_markdown'
        );
      `)

      await expect(database.exec(`
        DELETE FROM "media_assets"
        WHERE "id" = '00000000-0000-4000-8000-000000000001';
      `)).rejects.toThrow()
    } finally {
      await database.close()
    }
  })
})
