import { PgDialect } from "drizzle-orm/pg-core"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createDocumentStore } from "@/lib/documents/store"

const execute = vi.fn()
const store = createDocumentStore({ execute })
const actor = { githubId: "github:42", name: "Laf Admin" }
const now = new Date("2026-08-23T12:00:00.000Z")

const publishedRow = {
  id: "8ca55b3d-a4fc-4a41-b922-a0a9c32d7131",
  seriesId: "c5bcf607-a48f-42b9-af99-55c70ef48640",
  kind: "notice",
  locale: "ko",
  slug: "service-update",
  category: "service",
  pinned: false,
  revision: 2,
  title: "새 제목",
  summary: "새 요약",
  bodyMarkdown: "절대로 감사 로그에 넣지 않을 본문",
  status: "published",
  effectiveAt: null,
  scheduledAt: null,
  publishedAt: now,
  createdBy: actor.githubId,
  updatedBy: actor.githubId,
  publishedBy: actor.githubId,
  createdAt: new Date("2026-08-22T00:00:00.000Z"),
  updatedAt: now,
}

beforeEach(() => {
  execute.mockReset()
})

describe("document publication store boundary", () => {
  it("locks, rechecks, archives, publishes, and audits in one atomic statement", async () => {
    execute.mockResolvedValue({ rows: [publishedRow] })

    await expect(store.publishRevision(publishedRow.id, actor, now)).resolves.toEqual(publishedRow)

    expect(execute).toHaveBeenCalledTimes(1)
    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()

    expect(normalizedSql).toContain("with locked_revision as")
    expect(normalizedSql).toContain("for update")
    expect(normalizedSql).toContain("\"status\" in ('draft', 'scheduled')")
    expect(normalizedSql).toContain("archived_previous as")
    expect(normalizedSql).toContain("\"status\" = 'archived'")
    expect(normalizedSql).toContain("published_revision as")
    expect(normalizedSql).toContain("\"status\" = 'published'")
    expect(normalizedSql).toContain("insert into \"admin_audit_log\"")
    expect(normalizedSql.indexOf("archived_previous as")).toBeLessThan(normalizedSql.indexOf("published_revision as"))
    expect(normalizedSql.indexOf("published_revision as")).toBeLessThan(normalizedSql.indexOf("audit_entry as"))

    expect(compiled.params).toEqual(expect.arrayContaining([
      publishedRow.id,
      actor.githubId,
      actor.name,
      now,
    ]))
    expect(JSON.stringify(compiled.params)).toContain("document.publish")
    expect(normalizedSql).toContain("jsonb_build_object('seriesid', published_revision.\"series_id\"")
    expect(JSON.stringify(compiled.params)).not.toContain(publishedRow.title)
    expect(JSON.stringify(compiled.params)).not.toContain(publishedRow.bodyMarkdown)
  })

  it("reports a mutation conflict when the locked revision is no longer publishable", async () => {
    execute.mockResolvedValue({ rows: [] })

    await expect(store.publishRevision(publishedRow.id, actor, now)).rejects.toMatchObject({
      code: "conflict",
    })
  })

  it("maps public lookup rows to an explicit public DTO and available locales", async () => {
    execute.mockResolvedValue({
      rows: [{
        ...publishedRow,
        availableLocales: ["ko", "en"],
        status: "published",
        createdBy: "must-not-leak",
        updatedBy: "must-not-leak",
        publishedBy: "must-not-leak",
      }],
    })

    const result = await store.getPublished("notice", "service-update", "ko")

    expect(result).toEqual({
      document: {
        id: publishedRow.id,
        seriesId: publishedRow.seriesId,
        kind: "notice",
        locale: "ko",
        slug: "service-update",
        category: "service",
        pinned: false,
        revision: 2,
        title: "새 제목",
        summary: "새 요약",
        bodyMarkdown: publishedRow.bodyMarkdown,
        effectiveAt: null,
        publishedAt: now,
      },
      availableLocales: ["ko", "en"],
    })
    expect(result.document).not.toHaveProperty("status")
    expect(result.document).not.toHaveProperty("createdBy")
    expect(result.document).not.toHaveProperty("updatedBy")
    expect(result.document).not.toHaveProperty("publishedBy")
  })

  it("distinguishes an existing series with no requested locale from a missing series", async () => {
    execute.mockResolvedValueOnce({
      rows: [{
        id: null,
        seriesId: "c5bcf607-a48f-42b9-af99-55c70ef48640",
        availableLocales: ["ko"],
      }],
    })
    execute.mockResolvedValueOnce({ rows: [] })

    await expect(store.getPublished("notice", "service-update", "en")).resolves.toEqual({
      document: null,
      availableLocales: ["ko"],
    })
    await expect(store.getPublished("notice", "missing", "en")).resolves.toEqual({
      document: null,
      availableLocales: [],
    })
  })
})
