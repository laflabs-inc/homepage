import { PgDialect } from "drizzle-orm/pg-core"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { serializeAuditMetadata } from "@/lib/audit/store"
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

const draftInput = {
  kind: "notice" as const,
  locale: "ko" as const,
  slug: "service-update",
  category: "service",
  pinned: false,
  title: "서비스 업데이트",
  summary: "변경 사항을 안내합니다.",
  bodyMarkdown: "## 변경 사항\n본문",
  effectiveAt: null,
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
    const archiveSql = normalizedSql.slice(
      normalizedSql.indexOf("archived_previous as"),
      normalizedSql.indexOf("published_revision as"),
    )
    expect(archiveSql).toContain("\"updated_by\"")

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

  it("atomically rechecks Korean existence and shared metadata before creating English", async () => {
    execute.mockResolvedValue({ rows: [{ ...publishedRow, locale: "en", status: "draft", publishedAt: null }] })

    await store.createNextDraft(
      publishedRow.seriesId,
      { ...draftInput, locale: "en" },
      actor,
    )

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).toContain("korean.\"locale\" = 'ko'")
    expect(normalizedSql).toContain("exists ( select 1 from \"document_revisions\" korean")
    expect(normalizedSql).toContain("\"category\" is not distinct from")
    expect(normalizedSql).toContain("\"pinned\" =")
  })

  it("deletes an empty draft series and prevents deleting Korean while English exists", async () => {
    execute.mockResolvedValue({ rows: [{ id: publishedRow.id }] })

    await store.deleteDraft(publishedRow.id, actor)

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).toContain("deleted_series as")
    expect(normalizedSql).toContain("delete from \"document_series\"")
    expect(normalizedSql).toContain("english.\"locale\" = 'en'")
    expect(normalizedSql).toContain("only_revision")
  })

  it("protects only the last Korean revision when English revisions exist", async () => {
    execute.mockResolvedValue({ rows: [{ id: publishedRow.id }] })

    await store.deleteDraft(publishedRow.id, actor)

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).toContain("not exists ( select 1 from \"document_revisions\" other_korean")
    expect(normalizedSql).toContain("other_korean.\"id\" <> locked_revision.\"id\"")
    expect(normalizedSql).toContain("other_korean.\"status\" in ('scheduled', 'published', 'archived')")
  })

  it("rechecks complete stored content while locking a draft for scheduling", async () => {
    execute.mockResolvedValue({
      rows: [{ ...publishedRow, status: "scheduled", scheduledAt: new Date(now.getTime() + 60_000), publishedAt: null }],
    })

    await store.scheduleRevision(publishedRow.id, new Date(now.getTime() + 60_000), actor)

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).toContain("char_length(locked_revision.\"title\") between 1 and 160")
    expect(normalizedSql).toContain("char_length(locked_revision.\"summary\") between 1 and 240")
    expect(normalizedSql).toContain("char_length(locked_revision.\"body_markdown\") between 1 and 200000")
    expect(normalizedSql).toContain("locked_revision.\"category\" in ('general', 'service', 'maintenance', 'security')")
  })

  it("archives only the expected current revision under the same row lock", async () => {
    execute.mockResolvedValue({ rows: [publishedRow] })

    await store.archiveCurrent(
      publishedRow.seriesId,
      "ko",
      publishedRow.id,
      actor,
      now,
    )

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).toContain("\"id\" =")
    expect(compiled.params).toContain(publishedRow.id)
  })

  it("uses pinned state in both the public ordering and cursor boundary", async () => {
    execute.mockResolvedValue({ rows: [] })

    await store.listPublished({
      kind: "notice",
      locale: "ko",
      before: { pinned: true, publishedAt: now, id: publishedRow.id },
    })

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).toContain("s.\"pinned\" = false and")
    expect(normalizedSql).toContain("s.\"pinned\" =")
    expect(compiled.params).toContain(true)
    expect(normalizedSql).toContain("order by s.\"pinned\" desc, r.\"published_at\" desc, r.\"id\" desc")
  })
})

describe("audit metadata safety", () => {
  it("rejects credential metadata", () => {
    expect(() => serializeAuditMetadata({ credential: "sk-secret" })).toThrow(/sensitive audit metadata/i)
  })

  it("rejects nested prompt metadata", () => {
    expect(() => serializeAuditMetadata({ context: { prompt: "private question" } })).toThrow(/sensitive audit metadata/i)
  })
})
