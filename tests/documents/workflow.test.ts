import { beforeEach, describe, expect, it } from "vitest"

import type { AdminActor } from "@/lib/auth/admin-api"
import { createDocumentService } from "@/lib/documents/service"
import type {
  AdminDocumentFilter,
  AuditAction,
  DocumentDraftInput,
  DocumentRepository,
  DocumentRevision,
  Locale,
  PublishedDocument,
  PublishedDocumentFilter,
  PublishedLookup,
  PublishDueResult,
} from "@/lib/documents/types"

const actor: AdminActor = { githubId: "github:42", name: "Laf Admin" }
const now = new Date("2026-08-23T12:00:00.000Z")
const input: DocumentDraftInput = {
  kind: "notice",
  locale: "ko",
  slug: "service-update",
  category: "service",
  pinned: false,
  title: "서비스 업데이트",
  summary: "변경 사항을 안내합니다.",
  bodyMarkdown: "## 변경 사항\n본문",
  effectiveAt: null,
}

class MemoryDocumentRepository implements DocumentRepository {
  revisions: DocumentRevision[] = []
  audits: AuditAction[] = []
  readFailure: Error | null = null
  replaceBeforeArchive = false
  private nextId = 1

  seed(values: Partial<DocumentRevision> & Pick<DocumentRevision, "seriesId" | "locale" | "status">): DocumentRevision {
    const { seriesId, locale, status, ...overrides } = values
    const revision: DocumentRevision = {
      id: `revision-${this.nextId++}`,
      seriesId,
      kind: "notice",
      locale,
      slug: "service-update",
      category: "service",
      pinned: false,
      revision: 1,
      title: "원래 제목",
      summary: "원래 요약",
      bodyMarkdown: "원래 본문",
      status,
      effectiveAt: null,
      scheduledAt: null,
      publishedAt: status === "published" ? new Date("2026-08-20T00:00:00.000Z") : null,
      createdBy: actor.githubId,
      updatedBy: actor.githubId,
      publishedBy: status === "published" ? actor.githubId : null,
      createdAt: new Date("2026-08-20T00:00:00.000Z"),
      updatedAt: new Date("2026-08-20T00:00:00.000Z"),
      ...overrides,
    }
    this.revisions.push(revision)
    return revision
  }

  async createDraft(values: DocumentDraftInput, admin: AdminActor): Promise<DocumentRevision> {
    return this.seed({
      ...values,
      seriesId: `series-${this.nextId}`,
      locale: values.locale,
      status: "draft",
      title: values.title,
      summary: values.summary,
      bodyMarkdown: values.bodyMarkdown,
      createdBy: admin.githubId,
      updatedBy: admin.githubId,
    })
  }

  async getRevision(revisionId: string): Promise<DocumentRevision | null> {
    if (this.readFailure) throw this.readFailure
    return this.revisions.find(({ id }) => id === revisionId) ?? null
  }

  async updateDraft(revisionId: string, values: DocumentDraftInput, admin: AdminActor): Promise<DocumentRevision> {
    const revision = await this.required(revisionId)
    if (revision.status !== "draft") throw new Error("immutable")
    Object.assign(revision, values, { updatedBy: admin.githubId, updatedAt: now })
    return revision
  }

  async deleteDraft(revisionId: string, admin: AdminActor): Promise<void> {
    const revision = await this.required(revisionId)
    if (revision.status !== "draft") throw new Error("immutable")
    const hasEnglish = this.revisions.some((item) => item.seriesId === revision.seriesId && item.locale === "en")
    const hasKoreanHistory = this.revisions.some((item) => (
      item.id !== revision.id
      && item.seriesId === revision.seriesId
      && item.locale === "ko"
      && item.status !== "draft"
    ))
    if (revision.locale === "ko" && hasEnglish && !hasKoreanHistory) {
      throw Object.assign(new Error("korean required"), { code: "conflict" })
    }
    this.revisions = this.revisions.filter(({ id }) => id !== revisionId)
    this.audits.push({ action: "document.delete", targetType: "document_revision", targetId: revisionId, actor: admin })
  }

  async createNextDraft(seriesId: string, values: DocumentDraftInput, admin: AdminActor): Promise<DocumentRevision> {
    const revisions = this.revisions.filter((revision) => revision.seriesId === seriesId && revision.locale === values.locale)
    return this.seed({
      ...values,
      seriesId,
      locale: values.locale,
      status: "draft",
      revision: Math.max(0, ...revisions.map(({ revision }) => revision)) + 1,
      title: values.title,
      summary: values.summary,
      bodyMarkdown: values.bodyMarkdown,
      createdBy: admin.githubId,
      updatedBy: admin.githubId,
    })
  }

  async scheduleRevision(revisionId: string, scheduledAt: Date, admin: AdminActor): Promise<DocumentRevision> {
    const revision = await this.required(revisionId)
    if (revision.status !== "draft") throw new Error("immutable")
    Object.assign(revision, { status: "scheduled", scheduledAt, updatedBy: admin.githubId, updatedAt: now })
    return revision
  }

  async returnScheduledToDraft(revisionId: string, admin: AdminActor): Promise<DocumentRevision> {
    const revision = await this.required(revisionId)
    if (revision.status !== "scheduled") throw new Error("conflict")
    Object.assign(revision, { status: "draft", scheduledAt: null, updatedBy: admin.githubId, updatedAt: now })
    return revision
  }

  async publishRevision(revisionId: string, admin: AdminActor, publishedAt: Date): Promise<DocumentRevision> {
    const revision = await this.required(revisionId)
    if (revision.status !== "draft" && revision.status !== "scheduled") throw new Error("immutable")

    for (const prior of this.revisions) {
      if (prior.seriesId === revision.seriesId && prior.locale === revision.locale && prior.status === "published") {
        prior.status = "archived"
      }
    }
    Object.assign(revision, {
      status: "published",
      scheduledAt: null,
      publishedAt,
      publishedBy: admin.githubId,
      updatedBy: admin.githubId,
      updatedAt: publishedAt,
    })
    this.audits.push({
      action: "document.publish",
      targetType: "document_revision",
      targetId: revision.id,
      actor: admin,
      metadata: { seriesId: revision.seriesId, locale: revision.locale, revision: revision.revision },
    })
    return revision
  }

  async archiveCurrent(
    seriesId: string,
    locale: Locale,
    expectedRevisionId: string,
    admin: AdminActor,
    archivedAt: Date,
  ): Promise<DocumentRevision | null> {
    if (this.replaceBeforeArchive) {
      this.replaceBeforeArchive = false
      const prior = this.revisions.find((item) => item.seriesId === seriesId && item.locale === locale && item.status === "published")
      if (prior) prior.status = "archived"
      this.seed({ seriesId, locale, status: "published", revision: (prior?.revision ?? 0) + 1 })
    }
    const revision = this.revisions.find((item) => (
      item.id === expectedRevisionId
      && item.seriesId === seriesId
      && item.locale === locale
      && item.status === "published"
    )) ?? null
    if (revision) Object.assign(revision, { status: "archived", updatedBy: admin.githubId, updatedAt: archivedAt })
    return revision
  }

  async listAdmin(filter: AdminDocumentFilter = {}): Promise<DocumentRevision[]> {
    return this.revisions.filter((revision) => Object.entries(filter).every(([key, value]) => revision[key as keyof DocumentRevision] === value))
  }

  async listPublished(filter: PublishedDocumentFilter): Promise<PublishedDocument[]> {
    return this.revisions
      .filter((revision) => revision.status === "published" && revision.kind === filter.kind && revision.locale === filter.locale)
      .map(toPublished)
  }

  async getPublished(kind: DocumentRevision["kind"], slug: string, locale: Locale): Promise<PublishedLookup> {
    const matches = this.revisions.filter((revision) => revision.kind === kind && revision.slug === slug && revision.status === "published")
    const revision = matches.find((item) => item.locale === locale)
    return {
      document: revision ? toPublished(revision) : null,
      availableLocales: [...new Set(matches.map((item) => item.locale))],
    }
  }

  async publishDue(): Promise<PublishDueResult> {
    return { publishedRevisions: [], failedIds: [] }
  }

  private async required(revisionId: string): Promise<DocumentRevision> {
    const revision = await this.getRevision(revisionId)
    if (!revision) throw new Error("missing")
    return revision
  }
}

function toPublished(revision: DocumentRevision): PublishedDocument {
  const {
    id, seriesId, kind, locale, slug, category, pinned, title, summary,
    bodyMarkdown, effectiveAt, publishedAt,
  } = revision
  if (!publishedAt) throw new Error("Published fixture requires a publication date")
  return { id, seriesId, kind, locale, slug, category, pinned, revision: revision.revision, title, summary, bodyMarkdown, effectiveAt, publishedAt }
}

let repository: MemoryDocumentRepository
let service: ReturnType<typeof createDocumentService>

beforeEach(() => {
  repository = new MemoryDocumentRepository()
  service = createDocumentService(repository)
})

describe("document workflow service", () => {
  it("rejects edits to immutable published revisions", async () => {
    const published = repository.seed({ seriesId: "series-1", locale: "ko", status: "published" })

    await expect(service.updateDraft(published.id, input, actor)).rejects.toMatchObject({ code: "immutable_revision" })
  })

  it("protects the sole Korean revision while English revisions exist", async () => {
    const korean = repository.seed({ seriesId: "series-1", locale: "ko", status: "draft" })
    repository.seed({ seriesId: "series-1", locale: "en", status: "archived" })

    await expect(service.deleteDraft(korean.id, actor)).rejects.toMatchObject({ code: "conflict" })
    expect(repository.revisions).toContainEqual(korean)
  })

  it("allows a Korean replacement draft to be deleted when Korean history remains", async () => {
    const published = repository.seed({ seriesId: "series-1", locale: "ko", status: "published" })
    repository.seed({ seriesId: "series-1", locale: "en", status: "published" })
    const replacement = repository.seed({ seriesId: "series-1", locale: "ko", status: "draft", revision: 2 })

    await expect(service.deleteDraft(replacement.id, actor)).resolves.toBeUndefined()
    expect(repository.revisions).toContainEqual(published)
    expect(repository.revisions).not.toContainEqual(replacement)
  })

  it("requires a Korean revision before creating an English draft", async () => {
    repository.seed({ seriesId: "series-without-korean", locale: "en", status: "archived" })

    await expect(service.createEnglishDraft(
      "series-without-korean",
      { ...input, locale: "en" },
      actor,
    )).rejects.toMatchObject({ code: "korean_required" })
  })

  it("rejects English draft metadata that differs from its shared series", async () => {
    repository.seed({ seriesId: "series-1", locale: "ko", status: "draft", pinned: false })

    await expect(service.createEnglishDraft(
      "series-1",
      { ...input, locale: "en", pinned: true },
      actor,
    )).rejects.toMatchObject({ code: "conflict" })
  })

  it("requires published Korean content before publishing English", async () => {
    repository.seed({ seriesId: "series-1", locale: "ko", status: "draft" })
    const english = repository.seed({
      seriesId: "series-1",
      locale: "en",
      status: "draft",
      summary: "English summary",
    })

    await expect(service.publish(english.id, actor, now)).rejects.toMatchObject({ code: "korean_not_published" })
  })

  it("rejects a schedule that is not in the future relative to service time", async () => {
    const draft = repository.seed({ seriesId: "series-1", locale: "ko", status: "draft" })

    await expect(service.schedule(
      draft.id,
      new Date(now.getTime() - 1),
      actor,
      now,
    )).rejects.toMatchObject({ code: "invalid_schedule" })
  })

  it("allows an English revision to be scheduled independently of Korean publication", async () => {
    repository.seed({ seriesId: "series-1", locale: "ko", status: "draft" })
    const english = repository.seed({
      seriesId: "series-1",
      locale: "en",
      status: "draft",
      title: "English title",
      summary: "English summary",
      bodyMarkdown: "English body",
    })
    const scheduledAt = new Date(now.getTime() + 60_000)

    await expect(service.schedule(english.id, scheduledAt, actor, now)).resolves.toMatchObject({
      id: english.id,
      status: "scheduled",
      scheduledAt,
    })
  })

  it("publishes a complete replacement atomically without changing prior content", async () => {
    const prior = repository.seed({
      seriesId: "series-1",
      locale: "ko",
      status: "published",
      title: "보존할 제목",
      bodyMarkdown: "보존할 본문",
    })
    const replacement = repository.seed({
      seriesId: "series-1",
      locale: "ko",
      status: "draft",
      revision: 2,
      title: "새 제목",
      summary: "새 요약",
      bodyMarkdown: "새 본문",
    })

    const published = await service.publish(replacement.id, actor, now)

    expect(published).toMatchObject({ id: replacement.id, status: "published", publishedAt: now })
    expect(prior).toMatchObject({ status: "archived", title: "보존할 제목", bodyMarkdown: "보존할 본문" })
    expect(repository.audits).toContainEqual({
      action: "document.publish",
      targetType: "document_revision",
      targetId: replacement.id,
      actor,
      metadata: { seriesId: "series-1", locale: "ko", revision: 2 },
    })
    expect(JSON.stringify(repository.audits)).not.toContain("새 본문")
    expect(JSON.stringify(repository.audits)).not.toContain("보존할 본문")
  })

  it("does not archive a replacement that publishes after the requested revision is read", async () => {
    const requested = repository.seed({ seriesId: "series-1", locale: "ko", status: "published" })
    repository.replaceBeforeArchive = true

    await expect(service.archive(requested.id, actor, now)).rejects.toMatchObject({ code: "conflict" })
    expect(repository.revisions.find(({ revision }) => revision === 2)).toMatchObject({ status: "published" })
  })

  it("returns a scheduled snapshot to an editable draft", async () => {
    const scheduled = repository.seed({
      seriesId: "series-1",
      locale: "ko",
      status: "scheduled",
      scheduledAt: new Date("2026-08-24T12:00:00.000Z"),
    })

    await expect(service.returnScheduledToDraft(scheduled.id, actor, now)).resolves.toMatchObject({
      status: "draft",
      scheduledAt: null,
    })
  })

  it("does not return a scheduled snapshot to draft after its publication time", async () => {
    const scheduled = repository.seed({
      seriesId: "series-1",
      locale: "ko",
      status: "scheduled",
      scheduledAt: new Date(now.getTime() - 1),
    })

    await expect(service.returnScheduledToDraft(scheduled.id, actor, now)).rejects.toMatchObject({
      code: "conflict",
    })
  })

  it("maps unexpected repository failures to the stable unavailable error", async () => {
    repository.readFailure = new Error("connection details must not escape")

    await expect(service.updateDraft("revision-1", input, actor)).rejects.toMatchObject({
      code: "unavailable",
      message: "Document storage is unavailable",
    })
  })

  it("maps PostgreSQL uniqueness races to the stable conflict error", async () => {
    repository.readFailure = Object.assign(new Error("duplicate key details"), { code: "23505" })

    await expect(service.updateDraft("revision-1", input, actor)).rejects.toMatchObject({
      code: "conflict",
    })
  })
})
