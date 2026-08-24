import { beforeEach, describe, expect, it } from "vitest"

import type { AdminActor } from "@/lib/auth/admin-api"
import { createDocumentService } from "@/lib/documents/service"
import type {
  AdminDocumentSummary,
  AdminDocumentSummaryFilter,
  AdminDocumentSummaryPage,
  AuditAction,
  DocumentDraftInput,
  DocumentRepository,
  DocumentRevision,
  DocumentSeriesRevisionState,
  Locale,
  PublishedDocument,
  PublishedDocumentFilter,
  PublishedLookup,
  PublicationTransitionSnapshot,
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
  metadataLockedSeries = new Set<string>()
  readFailure: Error | null = null
  seriesStateReads: string[] = []
  replaceBeforeArchive = false
  transitionMutation: Partial<Pick<DocumentRevision, "title" | "summary" | "bodyMarkdown" | "effectiveAt">> | null = null
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
    if (status !== "draft") this.metadataLockedSeries.add(seriesId)
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

  async getSeriesState(seriesId: string) {
    return this.revisions.some((revision) => revision.seriesId === seriesId)
      ? { id: seriesId, metadataLocked: this.metadataLockedSeries.has(seriesId) }
      : null
  }

  async listSeriesRevisionStates(seriesId: string): Promise<DocumentSeriesRevisionState[]> {
    this.seriesStateReads.push(seriesId)
    return this.revisions
      .filter((revision) => revision.seriesId === seriesId)
      .map(({ id, seriesId: revisionSeriesId, kind, locale, slug, category, pinned, status }) => ({
        id,
        seriesId: revisionSeriesId,
        kind,
        locale,
        slug,
        category,
        pinned,
        status,
      }))
  }

  async updateDraft(revisionId: string, values: DocumentDraftInput, admin: AdminActor): Promise<DocumentRevision> {
    const revision = await this.required(revisionId)
    if (revision.status !== "draft") throw new Error("immutable")
    Object.assign(revision, values, { updatedBy: admin.githubId, updatedAt: now })
    return revision
  }

  async updateDraftSummary(
    revisionId: string,
    summary: string,
    admin: AdminActor,
    metadata: { model: string; generatedAt: Date },
  ): Promise<DocumentRevision> {
    const revision = await this.required(revisionId)
    if (revision.status !== "draft") throw new Error("immutable")
    Object.assign(revision, { summary, updatedBy: admin.githubId, updatedAt: now })
    this.audits.push({
      action: "document.summary.generate",
      targetType: "document_revision",
      targetId: revisionId,
      actor: admin,
      metadata,
    })
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

  async scheduleRevision(
    revisionId: string,
    scheduledAt: Date,
    snapshot: PublicationTransitionSnapshot,
    admin: AdminActor,
  ): Promise<DocumentRevision> {
    const revision = await this.required(revisionId)
    if (this.transitionMutation) Object.assign(revision, this.transitionMutation)
    if (revision.status !== "draft") throw new Error("immutable")
    this.requireSnapshot(revision, snapshot)
    Object.assign(revision, {
      status: "scheduled",
      summary: snapshot.normalizedSummary,
      scheduledAt,
      updatedBy: admin.githubId,
      updatedAt: now,
    })
    this.metadataLockedSeries.add(revision.seriesId)
    return revision
  }

  async returnScheduledToDraft(revisionId: string, admin: AdminActor): Promise<DocumentRevision> {
    const revision = await this.required(revisionId)
    if (revision.status !== "scheduled") throw new Error("conflict")
    Object.assign(revision, { status: "draft", scheduledAt: null, updatedBy: admin.githubId, updatedAt: now })
    return revision
  }

  async publishRevision(
    revisionId: string,
    snapshot: PublicationTransitionSnapshot,
    admin: AdminActor,
    publishedAt: Date,
  ): Promise<DocumentRevision> {
    const revision = await this.required(revisionId)
    if (this.transitionMutation) Object.assign(revision, this.transitionMutation)
    if (revision.status !== "draft" && revision.status !== "scheduled") throw new Error("immutable")
    this.requireSnapshot(revision, snapshot)

    for (const prior of this.revisions) {
      if (prior.seriesId === revision.seriesId && prior.locale === revision.locale && prior.status === "published") {
        prior.status = "archived"
      }
    }
    Object.assign(revision, {
      status: "published",
      summary: snapshot.normalizedSummary,
      scheduledAt: null,
      publishedAt,
      publishedBy: admin.githubId,
      updatedBy: admin.githubId,
      updatedAt: publishedAt,
    })
    this.metadataLockedSeries.add(revision.seriesId)
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
    if (locale === "ko" && this.revisions.some((item) => (
      item.seriesId === seriesId && item.locale === "en" && item.status === "published"
    ))) return null
    const revision = this.revisions.find((item) => (
      item.id === expectedRevisionId
      && item.seriesId === seriesId
      && item.locale === locale
      && item.status === "published"
    )) ?? null
    if (revision) Object.assign(revision, { status: "archived", updatedBy: admin.githubId, updatedAt: archivedAt })
    return revision
  }

  async listAdminSummaries(filter: AdminDocumentSummaryFilter = {}): Promise<AdminDocumentSummaryPage> {
    const limit = filter.limit ?? 50
    const { before, limit: _limit, search, ...adminFilter } = filter
    void _limit
    const revisions = this.revisions
      .filter((revision) => Object.entries(adminFilter).every(([key, value]) => revision[key as keyof DocumentRevision] === value))
      .filter((revision) => !search || revision.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
      .filter((revision) => !before || (
        revision.updatedAt.getTime() < before.updatedAt.getTime()
        || (revision.updatedAt.getTime() === before.updatedAt.getTime() && revision.id < before.id)
      ))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || b.id.localeCompare(a.id))
    const items: AdminDocumentSummary[] = revisions.slice(0, limit).map((revision) => ({
      id: revision.id,
      kind: revision.kind,
      locale: revision.locale,
      revision: revision.revision,
      title: revision.title,
      status: revision.status,
      scheduledAt: revision.scheduledAt,
      publishedAt: revision.publishedAt,
      updatedAt: revision.updatedAt,
      updatedBy: revision.updatedBy,
      publishedBy: revision.publishedBy,
    }))
    const last = items.at(-1)
    return {
      items,
      nextCursor: revisions.length > limit && last ? { updatedAt: last.updatedAt, id: last.id } : null,
    }
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


  private requireSnapshot(revision: DocumentRevision, snapshot: PublicationTransitionSnapshot): void {
    const effectiveAtMatches = revision.effectiveAt === null
      ? snapshot.effectiveAt === null
      : snapshot.effectiveAt !== null && revision.effectiveAt.getTime() === snapshot.effectiveAt.getTime()
    if (
      revision.kind !== snapshot.kind
      || revision.locale !== snapshot.locale
      || revision.slug !== snapshot.slug
      || revision.category !== snapshot.category
      || revision.pinned !== snapshot.pinned
      || revision.title !== snapshot.title
      || revision.summary !== snapshot.summary
      || revision.bodyMarkdown !== snapshot.bodyMarkdown
      || !effectiveAtMatches
    ) throw Object.assign(new Error("revision changed"), { code: "conflict" })
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
  it("updates only a draft summary and preserves safe generation audit metadata", async () => {
    const draft = repository.seed({
      seriesId: "series-1",
      locale: "ko",
      status: "draft",
      title: "Keep title",
      bodyMarkdown: "Keep body",
    })
    const metadata = { model: "gpt-summary", generatedAt: now }

    await expect(service.updateDraftSummary(draft.id, "Generated summary", actor, metadata)).resolves.toMatchObject({
      title: "Keep title",
      summary: "Generated summary",
      bodyMarkdown: "Keep body",
      updatedBy: actor.githubId,
    })
    expect(repository.audits).toContainEqual({
      action: "document.summary.generate",
      targetType: "document_revision",
      targetId: draft.id,
      actor,
      metadata,
    })
  })

  it("uses series-scoped state projections for cross-revision mutation invariants", async () => {
    const korean = repository.seed({ seriesId: "series-1", locale: "ko", status: "published" })
    await service.createEnglishDraft("series-1", { ...input, locale: "en" }, actor)
    const english = repository.revisions.find((item) => item.locale === "en")
    if (!english) expect.unreachable("English draft was not created")
    await service.publish(english.id, actor, now)
    await service.createNextDraft(korean.id, actor)
    await service.archive(english.id, actor, now)
    await service.archive(korean.id, actor, now)

    expect(repository.seriesStateReads).toEqual(["series-1", "series-1", "series-1", "series-1"])
  })

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

  it("rejects shared-series metadata changes through an existing English draft", async () => {
    repository.seed({ seriesId: "series-1", locale: "ko", status: "draft" })
    const english = repository.seed({
      seriesId: "series-1",
      locale: "en",
      status: "draft",
      title: "Service update",
      summary: "English summary",
      bodyMarkdown: "English body",
    })

    await expect(service.updateDraft(english.id, {
      ...input,
      locale: "en",
      kind: "design",
      slug: "changed-through-english",
      category: "foundation",
      pinned: true,
      title: english.title,
      summary: english.summary,
      bodyMarkdown: english.bodyMarkdown,
    }, actor)).rejects.toMatchObject({ code: "conflict" })
    expect(english).toMatchObject({
      kind: "notice",
      slug: "service-update",
      category: "service",
      pinned: false,
    })
  })

  it.each(["scheduled", "published", "archived"] as const)(
    "rejects Korean shared metadata changes when a %s sibling exists",
    async (status) => {
      const koreanDraft = repository.seed({ seriesId: "series-1", locale: "ko", status: "draft", revision: 2 })
      repository.seed({
        seriesId: "series-1",
        locale: status === "scheduled" ? "en" : "ko",
        status,
        revision: 1,
        scheduledAt: status === "scheduled" ? new Date(now.getTime() + 60_000) : null,
      })

      await expect(service.updateDraft(koreanDraft.id, {
        ...input,
        category: "maintenance",
        pinned: true,
      }, actor)).rejects.toMatchObject({ code: "conflict" })
    },
  )

  it("allows Korean shared metadata changes while every sibling remains a draft", async () => {
    const koreanDraft = repository.seed({ seriesId: "series-1", locale: "ko", status: "draft" })
    repository.seed({ seriesId: "series-1", locale: "en", status: "draft" })

    await expect(service.updateDraft(koreanDraft.id, {
      ...input,
      category: "maintenance",
      pinned: true,
    }, actor)).resolves.toMatchObject({ category: "maintenance", pinned: true })
  })

  it("allows Korean content edits without changing frozen shared metadata", async () => {
    const koreanDraft = repository.seed({ seriesId: "series-1", locale: "ko", status: "draft", revision: 2 })
    repository.seed({ seriesId: "series-1", locale: "ko", status: "published", revision: 1 })

    await expect(service.updateDraft(koreanDraft.id, {
      ...input,
      title: "수정 제목",
      summary: "수정 요약",
      bodyMarkdown: "수정 본문",
    }, actor)).resolves.toMatchObject({
      title: "수정 제목",
      summary: "수정 요약",
      bodyMarkdown: "수정 본문",
    })
  })

  it("keeps shared metadata permanently frozen after returning a schedule to draft", async () => {
    const scheduled = repository.seed({
      seriesId: "series-1",
      locale: "ko",
      status: "scheduled",
      scheduledAt: new Date(now.getTime() + 60_000),
    })
    await service.returnScheduledToDraft(scheduled.id, actor, now)

    await expect(service.updateDraft(scheduled.id, {
      ...input,
      category: "maintenance",
      pinned: true,
    }, actor)).rejects.toMatchObject({ code: "conflict" })
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

  it("persists and returns the normalized publication summary when scheduling", async () => {
    const draft = repository.seed({
      seriesId: "series-1",
      locale: "ko",
      status: "draft",
      summary: "  요약 문장  ",
    })

    await expect(service.schedule(
      draft.id,
      new Date(now.getTime() + 60_000),
      actor,
      now,
    )).resolves.toMatchObject({ summary: "요약 문장" })
    expect(repository.revisions.find(({ id }) => id === draft.id)?.summary).toBe("요약 문장")
  })

  it("persists and returns the normalized publication summary when publishing directly", async () => {
    const draft = repository.seed({
      seriesId: "series-1",
      locale: "ko",
      status: "draft",
      summary: "  즉시 공개 요약  ",
    })

    await expect(service.publish(draft.id, actor, now)).resolves.toMatchObject({ summary: "즉시 공개 요약" })
    expect(repository.revisions.find(({ id }) => id === draft.id)?.summary).toBe("즉시 공개 요약")
  })

  it.each([
    ["title", "동시에 바뀐 제목"],
    ["summary", "동시에 바뀐 요약"],
    ["bodyMarkdown", "동시에 바뀐 본문"],
    ["effectiveAt", new Date("2026-09-01T00:00:00.000Z")],
  ] as const)("rejects scheduling when %s changes after validation", async (field, value) => {
    const draft = repository.seed({ seriesId: "series-1", locale: "ko", status: "draft" })
    repository.transitionMutation = { [field]: value }

    await expect(service.schedule(
      draft.id,
      new Date(now.getTime() + 60_000),
      actor,
      now,
    )).rejects.toMatchObject({ code: "conflict" })
  })

  it.each([
    ["title", "동시에 바뀐 제목"],
    ["summary", "동시에 바뀐 요약"],
    ["bodyMarkdown", "동시에 바뀐 본문"],
    ["effectiveAt", new Date("2026-09-01T00:00:00.000Z")],
  ] as const)("rejects publication when %s changes after validation", async (field, value) => {
    const draft = repository.seed({ seriesId: "series-1", locale: "ko", status: "draft" })
    repository.transitionMutation = { [field]: value }

    await expect(service.publish(draft.id, actor, now)).rejects.toMatchObject({ code: "conflict" })
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

  it("does not archive published Korean while English is published", async () => {
    const korean = repository.seed({ seriesId: "series-1", locale: "ko", status: "published" })
    repository.seed({ seriesId: "series-1", locale: "en", status: "published" })

    await expect(service.archive(korean.id, actor, now)).rejects.toMatchObject({ code: "conflict" })
    expect(korean.status).toBe("published")
  })

  it("allows English archival while Korean remains published", async () => {
    repository.seed({ seriesId: "series-1", locale: "ko", status: "published" })
    const english = repository.seed({ seriesId: "series-1", locale: "en", status: "published" })

    await expect(service.archive(english.id, actor, now)).resolves.toMatchObject({ status: "archived" })
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

  it("loads one complete revision directly without an admin list scan", async () => {
    const revision = repository.seed({ seriesId: "series-1", locale: "ko", status: "draft" })

    await expect(service.getRevision(revision.id)).resolves.toEqual(revision)
    await expect(service.getRevision("missing")).resolves.toBeNull()
  })
})
