import { PgDialect } from "drizzle-orm/pg-core"
import { describe, expect, it, vi } from "vitest"

import { createDocumentStore } from "@/lib/documents/store"

const actor = { githubId: "github:42", name: "Laf Admin" }
const revisionId = "8ca55b3d-a4fc-4a41-b922-a0a9c32d7131"
const assetId = "11111111-1111-4111-8111-111111111111"
const row = {
  id: revisionId,
  seriesId: "c5bcf607-a48f-42b9-af99-55c70ef48640",
  kind: "notice", locale: "ko", slug: "service-update", category: "service", pinned: false,
  revision: 1, title: "제목", summary: "요약", bodyMarkdown: "본문", status: "draft",
  effectiveAt: null, scheduledAt: null, publishedAt: null, createdBy: actor.githubId,
  updatedBy: actor.githubId, publishedBy: null, createdAt: new Date(), updatedAt: new Date(),
}
const input = {
  kind: "notice" as const, locale: "ko" as const, slug: "service-update", category: "service",
  pinned: false, title: "제목", summary: "요약", bodyMarkdown: "본문", effectiveAt: null,
}

describe("document asset store boundary", () => {
  it("compiles valid empty and populated UUID arrays for atomic reference replacement", async () => {
    const execute = vi.fn().mockResolvedValue({ rows: [row] })
    const store = createDocumentStore({ execute })
    const dialect = new PgDialect()

    await store.updateDraft(revisionId, input, actor, { assetIds: [] })
    const empty = dialect.sqlToQuery(execute.mock.calls[0][0]).sql.replace(/\s+/g, " ").toLowerCase()
    expect(empty).toContain("unnest(array[]::uuid[])")
    expect(empty).not.toContain("unnest(())")

    await store.updateDraft(revisionId, input, actor, { assetIds: [assetId, assetId] })
    const populated = dialect.sqlToQuery(execute.mock.calls[1][0])
    expect(populated.sql.replace(/\s+/g, " ").toLowerCase()).toContain("reference_entries as")
    expect(populated.params).toContain(assetId)
  })
})
