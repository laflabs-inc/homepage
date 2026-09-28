import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PGlite } from "@electric-sql/pglite"
import type { SQL } from "drizzle-orm"
import { PgDialect } from "drizzle-orm/pg-core"
import { describe, expect, it } from "vitest"

import { createAssetStore } from "@/lib/assets/store"

const actor = { githubId: "github:42", name: "Laf Admin" }
const id = "00000000-0000-4000-8000-000000000001"
const otherId = "00000000-0000-4000-8000-000000000002"
const nonce = "00000000-0000-4000-8000-000000000003"

async function setup() {
  const database = new PGlite()
  const dialect = new PgDialect()
  await database.exec(`
    CREATE TABLE "admin_audit_log" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "action" text NOT NULL,
      "target_type" text NOT NULL,
      "target_id" text NOT NULL,
      "actor_github_id" text NOT NULL,
      "actor_name" text NOT NULL,
      "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `)
  const migration = readFileSync(join(process.cwd(), "drizzle/0011_media_platform.sql"), "utf8")
    .replaceAll("--> statement-breakpoint", "")
  await database.exec(migration)
  const store = createAssetStore({
    async execute(query: SQL) {
      const compiled = dialect.sqlToQuery(query)
      return database.query(compiled.sql, compiled.params as never[]) as Promise<{ rows: unknown[] }>
    },
  })
  return { database, store }
}

describe("media asset store integration", () => {
  it("creates a pending asset and writes its audit row atomically", async () => {
    const { database, store } = await setup()
    try {
      const asset = await store.createPending({
        id,
        familyId: id,
        originalFilename: "Hero.PNG",
        declaredMediaType: "image/png",
        stagingPathname: `staging/${id}/${nonce}`,
      }, actor)

      expect(asset).toMatchObject({ id, status: "pending", originalFilename: "Hero.PNG" })
      const audit = await database.query<{ action: string; targetId: string }>(
        `SELECT "action", "target_id" AS "targetId" FROM "admin_audit_log"`,
      )
      expect(audit.rows).toEqual([{ action: "media.intent_created", targetId: id }])
    } finally {
      await database.close()
    }
  })

  it("lets only one finalizer acquire a pending asset", async () => {
    const { database, store } = await setup()
    try {
      await store.createPending({
        id,
        familyId: id,
        originalFilename: "Hero.PNG",
        declaredMediaType: "image/png",
        stagingPathname: `staging/${id}/${nonce}`,
      }, actor)

      const attempts = await Promise.all([
        store.acquireProcessing(id, actor),
        store.acquireProcessing(id, actor),
      ])
      expect(attempts.filter((value) => value.status === "acquired")).toHaveLength(1)
      expect(attempts.filter((value) => value.status === "current")).toHaveLength(1)
    } finally {
      await database.close()
    }
  })

  it("blocks references once hard deletion is acquired", async () => {
    const { database, store } = await setup()
    try {
      await store.createPending({
        id,
        familyId: id,
        originalFilename: "Hero.PNG",
        declaredMediaType: "image/png",
        stagingPathname: `staging/${id}/${nonce}`,
      }, actor)
      await store.markFailed(id, "invalid_image", actor)
      expect(await store.acquireDeletion(id, actor)).toMatchObject({ status: "acquired" })

      await expect(store.addReference({
        assetId: id,
        ownerType: "document_revision",
        ownerId: otherId,
        field: "body_markdown",
        revisionId: null,
      }, actor)).rejects.toMatchObject({ code: "invalid_state" })
    } finally {
      await database.close()
    }
  })

  it("normalizes tags and supports case-insensitive filename search", async () => {
    const { database, store } = await setup()
    try {
      await store.createPending({
        id,
        familyId: id,
        originalFilename: "Company HERO.PNG",
        declaredMediaType: "image/png",
        stagingPathname: `staging/${id}/${nonce}`,
      }, actor)
      await store.updateMetadata(id, { altKo: null, altEn: null, tags: ["hero", "company"] }, actor)

      await expect(store.list({ search: "hero", tag: "company", limit: 10 })).resolves.toMatchObject({
        items: [{ id, tags: ["hero", "company"] }],
        nextCursor: null,
      })
    } finally {
      await database.close()
    }
  })
})
