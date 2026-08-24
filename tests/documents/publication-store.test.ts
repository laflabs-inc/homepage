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
  kind: "notice" as const,
  locale: "ko" as const,
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

const publicationSnapshot = {
  kind: publishedRow.kind,
  locale: publishedRow.locale,
  slug: publishedRow.slug,
  category: publishedRow.category,
  pinned: publishedRow.pinned,
  title: publishedRow.title,
  summary: publishedRow.summary,
  normalizedSummary: publishedRow.summary.trim(),
  bodyMarkdown: publishedRow.bodyMarkdown,
  effectiveAt: publishedRow.effectiveAt,
}

beforeEach(() => {
  execute.mockReset()
})

describe("document publication store boundary", () => {
  it("returns exact cache metadata for each committed scheduled publication", async () => {
    execute
      .mockResolvedValueOnce({ rows: [{
        id: publishedRow.id,
        kind: publishedRow.kind,
        locale: publishedRow.locale,
        slug: publishedRow.slug,
        category: publishedRow.category,
        pinned: publishedRow.pinned,
        title: publishedRow.title,
        summary: publishedRow.summary,
        bodyMarkdown: publishedRow.bodyMarkdown,
        effectiveAt: publishedRow.effectiveAt,
      }] })
      .mockResolvedValueOnce({ rows: [publishedRow] })

    await expect(store.publishDue(now, actor)).resolves.toEqual({
      publishedRevisions: [{
        id: publishedRow.id,
        kind: publishedRow.kind,
        locale: publishedRow.locale,
        slug: publishedRow.slug,
      }],
      failedIds: [],
    })
  })

  it("locks, rechecks, archives, publishes, and audits in one atomic statement", async () => {
    execute.mockResolvedValue({ rows: [publishedRow] })

    await expect(store.publishRevision(publishedRow.id, publicationSnapshot, actor, now)).resolves.toEqual(publishedRow)

    expect(execute).toHaveBeenCalledTimes(1)
    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()

    expect(normalizedSql).toContain("with locked_series as")
    expect(normalizedSql).toContain("locked_revisions as")
    expect(normalizedSql.indexOf("locked_series as")).toBeLessThan(normalizedSql.indexOf("locked_revisions as"))
    expect(normalizedSql).toContain("for update")
    expect(normalizedSql).toContain("\"status\" in ('draft', 'scheduled')")
    expect(normalizedSql).toContain("char_length(btrim(locked_revision.\"summary\")) between 1 and 240")
    expect(normalizedSql).toContain("locked_revision.\"summary\" !~")
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
    expect(normalizedSql).toContain("from locked_revisions korean")
    expect(normalizedSql).toContain("\"metadata_locked\" = true")
    expect(normalizedSql).toContain("locked_revision.\"title\" =")
    expect(normalizedSql).toContain("locked_revision.\"summary\" =")
    expect(normalizedSql).toContain("locked_revision.\"body_markdown\" =")
    expect(normalizedSql).toContain("locked_revision.\"effective_at\" is not distinct from")
    expect(normalizedSql).toContain("locked_revision.\"kind\" =")
    expect(normalizedSql).toContain("locked_revision.\"locale\" =")
    expect(normalizedSql).toContain("locked_revision.\"slug\" =")
    expect(normalizedSql).toContain("locked_revision.\"category\" is not distinct from")
    expect(normalizedSql).toContain("locked_revision.\"pinned\" =")
    expect(normalizedSql).toContain("\"summary\" =")

    expect(compiled.params).toEqual(expect.arrayContaining([
      publishedRow.id,
      actor.githubId,
      actor.name,
      now,
      publishedRow.title,
      publishedRow.summary,
      publishedRow.bodyMarkdown,
    ]))
    expect(JSON.stringify(compiled.params)).toContain("document.publish")
    expect(normalizedSql).toContain("jsonb_build_object('seriesid', published_revision.\"series_id\"")
  })

  it("reports a mutation conflict when the locked revision is no longer publishable", async () => {
    execute.mockResolvedValue({ rows: [] })

    await expect(store.publishRevision(publishedRow.id, publicationSnapshot, actor, now)).rejects.toMatchObject({
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

  it("decodes Neon PostgreSQL text-array locale literals through an explicit allowlist", async () => {
    execute.mockResolvedValueOnce({
      rows: [{ ...publishedRow, availableLocales: "{en,ko}" }],
    })
    execute.mockResolvedValueOnce({
      rows: [{ ...publishedRow, availableLocales: "{ko,fr}" }],
    })

    await expect(store.getPublished("notice", "service-update", "ko")).resolves.toMatchObject({
      availableLocales: ["en", "ko"],
    })
    await expect(store.getPublished("notice", "service-update", "ko")).resolves.toMatchObject({
      availableLocales: [],
    })

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).toContain("array_agg(r.\"locale\"::text")
    expect(normalizedSql).toContain("array[]::text[]")
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
    expect(normalizedSql).toContain("with locked_series as")
    expect(normalizedSql).toContain("locked_revisions as")
    expect(normalizedSql.indexOf("locked_series as")).toBeLessThan(normalizedSql.indexOf("locked_revisions as"))
    expect(normalizedSql).toContain("korean.\"locale\" = 'ko'")
    expect(normalizedSql).toContain("exists ( select 1 from locked_revisions korean")
    expect(normalizedSql).toContain("\"category\" is not distinct from")
    expect(normalizedSql).toContain("\"pinned\" =")
  })

  it("permits shared metadata updates only while the permanently locked flag is false", async () => {
    execute.mockResolvedValue({ rows: [{ ...publishedRow, status: "draft", publishedAt: null }] })

    await store.updateDraft(publishedRow.id, {
      ...draftInput,
      category: "maintenance",
      pinned: true,
    }, actor)

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).toContain("with locked_series as")
    expect(normalizedSql).toContain("locked_series.\"metadata_locked\"")
    expect(normalizedSql.indexOf("locked_series as")).toBeLessThan(normalizedSql.indexOf("locked_revision as"))
    expect(normalizedSql).not.toContain("from \"document_revisions\" sibling")
    expect(normalizedSql).toContain("locked_revision.\"series_kind\" =")
    expect(normalizedSql).toContain("locked_revision.\"series_slug\" =")
    expect(normalizedSql).toContain("locked_revision.\"series_category\" is not distinct from")
    expect(normalizedSql).toContain("locked_revision.\"series_pinned\" =")
    expect(normalizedSql).toContain("for update of r")
  })

  it("rechecks every shared series field before updating an English draft", async () => {
    execute.mockResolvedValue({ rows: [{ ...publishedRow, locale: "en", status: "draft", publishedAt: null }] })

    await store.updateDraft(
      publishedRow.id,
      { ...draftInput, locale: "en" },
      actor,
    )

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    const lockedSql = normalizedSql.slice(
      normalizedSql.indexOf("locked_revision as"),
      normalizedSql.indexOf("), eligible as"),
    )
    expect(normalizedSql).toContain("with locked_series as")
    expect(lockedSql).toContain("from \"document_revisions\" r")
    expect(lockedSql).toContain("locked_series")
    expect(lockedSql).toContain("for update of r")
    expect(normalizedSql).toContain("locked_revision.\"locale\" = 'ko'")
    expect(normalizedSql).toContain("locked_revision.\"series_kind\" =")
    expect(normalizedSql).toContain("locked_revision.\"series_slug\" =")
    expect(normalizedSql).toContain("locked_revision.\"series_category\" is not distinct from")
    expect(normalizedSql).toContain("locked_revision.\"series_pinned\" =")
  })

  it("deletes an empty draft series and prevents deleting Korean while English exists", async () => {
    execute.mockResolvedValue({ rows: [{ id: publishedRow.id }] })

    await store.deleteDraft(publishedRow.id, actor)

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).toContain("with locked_series as")
    expect(normalizedSql).toContain("locked_revisions as")
    expect(normalizedSql.indexOf("locked_series as")).toBeLessThan(normalizedSql.indexOf("locked_revisions as"))
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
    expect(normalizedSql).toContain("not exists ( select 1 from locked_revisions other_korean")
    expect(normalizedSql).toContain("other_korean.\"id\" <> locked_revision.\"id\"")
    expect(normalizedSql).toContain("other_korean.\"status\" in ('scheduled', 'published', 'archived')")
  })

  it("rechecks complete stored content while locking a draft for scheduling", async () => {
    execute.mockResolvedValue({
      rows: [{ ...publishedRow, status: "scheduled", scheduledAt: new Date(now.getTime() + 60_000), publishedAt: null }],
    })

    await store.scheduleRevision(
      publishedRow.id,
      new Date(now.getTime() + 60_000),
      publicationSnapshot,
      actor,
    )

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).toContain("char_length(locked_revision.\"title\") between 1 and 160")
    expect(normalizedSql).toContain("char_length(btrim(locked_revision.\"summary\")) between 1 and 240")
    expect(normalizedSql).toContain("locked_revision.\"summary\" !~")
    expect(normalizedSql).toContain("char_length(locked_revision.\"body_markdown\") between 1 and 200000")
    expect(normalizedSql).toContain("locked_revision.\"category\" in ('general', 'service', 'maintenance', 'security')")
    expect(normalizedSql).toContain("with locked_series as")
    expect(normalizedSql).toContain("locked_revisions as")
    expect(normalizedSql.indexOf("locked_series as")).toBeLessThan(normalizedSql.indexOf("locked_revisions as"))
    expect(normalizedSql).toContain("locked_revision.\"title\" =")
    expect(normalizedSql).toContain("locked_revision.\"summary\" =")
    expect(normalizedSql).toContain("locked_revision.\"body_markdown\" =")
    expect(normalizedSql).toContain("locked_revision.\"effective_at\" is not distinct from")
    expect(normalizedSql).toContain("locked_revision.\"kind\" =")
    expect(normalizedSql).toContain("locked_revision.\"locale\" =")
    expect(normalizedSql).toContain("locked_revision.\"slug\" =")
    expect(normalizedSql).toContain("locked_revision.\"category\" is not distinct from")
    expect(normalizedSql).toContain("locked_revision.\"pinned\" =")
    expect(normalizedSql).toContain("\"metadata_locked\" = true")
  })

  it("locks the series before revisions when returning a schedule to draft", async () => {
    execute.mockResolvedValue({ rows: [{ ...publishedRow, status: "draft", publishedAt: null }] })

    await store.returnScheduledToDraft(publishedRow.id, actor)

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).toContain("with locked_series as")
    expect(normalizedSql).toContain("locked_revisions as")
    expect(normalizedSql.indexOf("locked_series as")).toBeLessThan(normalizedSql.indexOf("locked_revisions as"))
    expect(normalizedSql).toContain("for update of r")
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

  it("locks all series revisions and blocks Korean archival with published English", async () => {
    execute.mockResolvedValue({ rows: [] })

    await expect(store.archiveCurrent(
      publishedRow.seriesId,
      "ko",
      publishedRow.id,
      actor,
      now,
    )).resolves.toBeNull()

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).toContain("with locked_series as")
    expect(normalizedSql).toContain("locked_revisions as")
    expect(normalizedSql.indexOf("locked_series as")).toBeLessThan(normalizedSql.indexOf("locked_revisions as"))
    expect(normalizedSql).toContain("locked_series on locked_series.\"id\" = r.\"series_id\"")
    expect(normalizedSql).toContain("for update of r")
    expect(normalizedSql).toContain("from locked_revisions english")
    expect(normalizedSql).toContain("english.\"locale\" = 'en'")
    expect(normalizedSql).toContain("english.\"status\" = 'published'")
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

  it("returns cursor-paginated minimal admin summaries without scanning content", async () => {
    const firstUpdatedAt = new Date("2026-08-23T11:00:00.000Z")
    const secondUpdatedAt = new Date("2026-08-23T10:00:00.000Z")
    execute.mockResolvedValue({
      rows: [
        { ...publishedRow, id: "revision-1", updatedAt: firstUpdatedAt },
        { ...publishedRow, id: "revision-2", updatedAt: secondUpdatedAt },
        { ...publishedRow, id: "revision-3", updatedAt: new Date("2026-08-23T09:00:00.000Z") },
      ],
    })

    const page = await store.listAdminSummaries({
      kind: "notice",
      limit: 2,
      before: { updatedAt: new Date("2026-08-23T12:00:00.000Z"), id: publishedRow.id },
    })

    expect(page).toEqual({
      items: [
        {
          id: "revision-1",
          kind: "notice",
          locale: "ko",
          revision: 2,
          title: "새 제목",
          status: "published",
          scheduledAt: null,
          publishedAt: now,
          updatedAt: firstUpdatedAt,
          updatedBy: actor.githubId,
          publishedBy: actor.githubId,
        },
        {
          id: "revision-2",
          kind: "notice",
          locale: "ko",
          revision: 2,
          title: "새 제목",
          status: "published",
          scheduledAt: null,
          publishedAt: now,
          updatedAt: secondUpdatedAt,
          updatedBy: actor.githubId,
          publishedBy: actor.githubId,
        },
      ],
      nextCursor: { updatedAt: secondUpdatedAt, id: "revision-2" },
    })

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).not.toContain("body_markdown")
    expect(normalizedSql).not.toContain("\"summary\"")
    expect(normalizedSql).not.toContain("\"created_by\"")
    expect(normalizedSql).toContain("(r.\"updated_at\", r.\"id\") <")
    expect(normalizedSql).toContain("limit")
    expect(compiled.params).toContain(3)
  })

  it("loads only series-scoped invariant state without document bodies or summaries", async () => {
    execute.mockResolvedValue({ rows: [] })

    await store.listSeriesRevisionStates("c5bcf607-a48f-42b9-af99-55c70ef48640")

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).toContain('where r."series_id" =')
    expect(normalizedSql).not.toContain("body_markdown")
    expect(normalizedSql).not.toContain('r."summary"')
    expect(normalizedSql).not.toContain('r."title"')
    expect(normalizedSql).not.toContain('r."created_by"')
  })

  it("applies escaped literal title search inside the bounded admin summary query", async () => {
    execute.mockResolvedValue({ rows: [] })
    const filter = { search: String.raw`50%_off\today`, limit: 25 } as Parameters<typeof store.listAdminSummaries>[0] & {
      search: string
    }

    await store.listAdminSummaries(filter)

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalizedSql = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalizedSql).toContain('r."title" ilike')
    expect(normalizedSql).toContain("escape '\\'")
    expect(compiled.params).toContain(String.raw`%50\%\_off\\today%`)
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
