import type { AdminActor } from "@/lib/auth/admin-api"
import type {
  DocumentDraftInput,
  DocumentRepository,
  DocumentRevision,
  PublicationTransitionSnapshot,
  PublishDueResult,
  SummaryGenerationMetadata,
  SummaryPromptSnapshot,
} from "@/lib/documents/types"
import { documentDraftSchema, generatedSummarySchema, publishDocumentSchema } from "@/lib/documents/validation"
import { documentStore } from "@/lib/documents/store"

export type DocumentServiceErrorCode =
  | "not_found"
  | "conflict"
  | "incomplete_document"
  | "immutable_revision"
  | "korean_required"
  | "korean_not_published"
  | "invalid_schedule"
  | "archive_dependency"
  | "revision_changed"
  | "invalid_state"
  | "confirmation_mismatch"
  | "delete_dependency"
  | "unavailable"

export class DocumentServiceError extends Error {
  public readonly fields: string[]

  constructor(
    public readonly code: DocumentServiceErrorCode,
    message: string,
    options?: ErrorOptions & { fields?: string[] },
  ) {
    super(message, options)
    this.name = "DocumentServiceError"
    this.fields = options?.fields ?? []
  }
}

function requireDraft(revision: DocumentRevision): void {
  if (revision.status !== "draft") {
    throw new DocumentServiceError("immutable_revision", "Only draft revisions may be edited")
  }
}

function publicInput(revision: DocumentRevision): DocumentDraftInput {
  return {
    kind: revision.kind,
    locale: revision.locale,
    slug: revision.slug,
    category: revision.category,
    pinned: revision.pinned,
    title: revision.title,
    summary: revision.summary,
    bodyMarkdown: revision.bodyMarkdown,
    effectiveAt: revision.effectiveAt,
  }
}

async function requireRevision(repository: DocumentRepository, revisionId: string): Promise<DocumentRevision> {
  const revision = await repository.getRevision(revisionId)
  if (!revision) throw new DocumentServiceError("not_found", "Document revision was not found")
  return revision
}

function requireValidDraft(input: DocumentDraftInput): DocumentDraftInput {
  const result = documentDraftSchema.safeParse(input)
  if (!result.success) throw new DocumentServiceError("conflict", "Draft content is invalid")
  return result.data
}

function requirePublishable(revision: DocumentRevision): PublicationTransitionSnapshot {
  const result = publishDocumentSchema.safeParse(publicInput(revision))
  if (!result.success) {
    const fields = [...new Set(result.error.issues.flatMap((issue) => (
      typeof issue.path[0] === "string" ? [issue.path[0]] : []
    )))]
    throw new DocumentServiceError(
      "incomplete_document",
      "Document is incomplete and cannot be published",
      { fields },
    )
  }
  return {
    kind: revision.kind,
    locale: revision.locale,
    slug: revision.slug,
    category: revision.category,
    pinned: revision.pinned,
    title: revision.title,
    summary: revision.summary,
    normalizedSummary: result.data.summary,
    bodyMarkdown: revision.bodyMarkdown,
    effectiveAt: revision.effectiveAt,
  }
}

function sharedMetadataChanged(revision: DocumentRevision, input: DocumentDraftInput): boolean {
  return input.kind !== revision.kind
    || input.slug !== revision.slug
    || (input.category ?? null) !== revision.category
    || (input.pinned ?? false) !== revision.pinned
}

function withStableRepositoryErrors(repository: DocumentRepository): DocumentRepository {
  return new Proxy(repository, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver)
      if (typeof value !== "function") return value

      return async (...args: unknown[]) => {
        try {
          return await Reflect.apply(value, target, args)
        } catch (error) {
          if (error instanceof DocumentServiceError) throw error
          if (typeof error === "object" && error !== null && "code" in error) {
            const code = (error as { code?: unknown }).code
            if (code === "not_found" || code === "conflict") {
              throw new DocumentServiceError(code, "The document changed before the operation completed", { cause: error })
            }
            if (code === "23505") {
              throw new DocumentServiceError("conflict", "A document with those values already exists", { cause: error })
            }
          }
          throw new DocumentServiceError("unavailable", "Document storage is unavailable", { cause: error })
        }
      }
    },
  })
}

export function createDocumentService(repository: DocumentRepository) {
  repository = withStableRepositoryErrors(repository)

  async function publishRevision(
    revisionId: string,
    actor: AdminActor,
    now: Date,
    expectedSummary?: SummaryPromptSnapshot,
  ): Promise<DocumentRevision> {
    const revision = await requireRevision(repository, revisionId)
    if (revision.status !== "draft" && revision.status !== "scheduled") {
      throw new DocumentServiceError("immutable_revision", "Only draft or scheduled revisions may publish")
    }
    if (expectedSummary && (
      revision.title !== expectedSummary.title
      || revision.summary !== expectedSummary.summary
      || revision.bodyMarkdown !== expectedSummary.bodyMarkdown
    )) {
      throw new DocumentServiceError("conflict", "The document changed before publication")
    }
    const snapshot = requirePublishable(revision)
    if (revision.locale === "en") await requirePublishedKorean(repository, revision.seriesId)
    return repository.publishRevision(revisionId, snapshot, actor, now)
  }

  return {
    async createDraft(input: DocumentDraftInput, actor: AdminActor): Promise<DocumentRevision> {
      const validInput = requireValidDraft(input)
      if (validInput.locale !== "ko") {
        throw new DocumentServiceError("korean_required", "Create the Korean revision first")
      }
      return repository.createDraft(validInput, actor)
    },

    async createEnglishDraft(seriesId: string, input: DocumentDraftInput, actor: AdminActor): Promise<DocumentRevision> {
      const validInput = requireValidDraft(input)
      const series = await repository.listSeriesRevisionStates(seriesId)
      const korean = series.find(({ locale }) => locale === "ko")
      if (!korean) {
        throw new DocumentServiceError("korean_required", "Create the Korean revision first")
      }
      if (validInput.locale !== "en") {
        throw new DocumentServiceError("conflict", "An English draft must use the English locale")
      }
      if (
        validInput.kind !== korean.kind
        || validInput.slug !== korean.slug
        || (validInput.category ?? null) !== korean.category
        || (validInput.pinned ?? false) !== korean.pinned
      ) {
        throw new DocumentServiceError("conflict", "Localized revisions must share their series metadata")
      }
      if (series.some(({ locale, status }) => locale === "en" && (status === "draft" || status === "scheduled"))) {
        throw new DocumentServiceError("conflict", "An editable English revision already exists")
      }
      return repository.createNextDraft(seriesId, validInput, actor)
    },

    async updateDraft(revisionId: string, input: DocumentDraftInput, actor: AdminActor): Promise<DocumentRevision> {
      const revision = await requireRevision(repository, revisionId)
      requireDraft(revision)
      const validInput = requireValidDraft(input)
      if (validInput.locale !== revision.locale) {
        throw new DocumentServiceError("conflict", "A revision locale cannot be changed")
      }
      const seriesState = await repository.getSeriesState(revision.seriesId)
      if (!seriesState) throw new DocumentServiceError("conflict", "The document series changed")
      if (sharedMetadataChanged(revision, validInput) && (revision.locale === "en" || seriesState.metadataLocked)) {
        throw new DocumentServiceError("conflict", "Shared series metadata cannot be changed")
      }
      return repository.updateDraft(revisionId, validInput, actor)
    },

    async updateDraftSummary(
      revisionId: string,
      summary: string,
      expected: SummaryPromptSnapshot,
      actor: AdminActor,
      metadata: SummaryGenerationMetadata,
    ): Promise<DocumentRevision> {
      const revision = await requireRevision(repository, revisionId)
      requireDraft(revision)
      const validSummary = generatedSummarySchema.safeParse(summary)
      if (!validSummary.success) {
        throw new DocumentServiceError("conflict", "Generated summary is invalid")
      }
      return repository.updateDraftSummary(revisionId, validSummary.data, expected, actor, metadata)
    },

    async deleteDraft(revisionId: string, actor: AdminActor): Promise<void> {
      const revision = await requireRevision(repository, revisionId)
      requireDraft(revision)
      await repository.deleteDraft(revisionId, actor)
    },

    async deleteArchived(revisionId: string, confirmation: string, actor: AdminActor): Promise<void> {
      const revision = await requireRevision(repository, revisionId)
      if (revision.status !== "archived") {
        throw new DocumentServiceError("invalid_state", "Only archived revisions may be permanently deleted")
      }
      const normalizedConfirmation = confirmation.normalize("NFKC").trim()
      const normalizedTitle = revision.title.normalize("NFKC").trim()
      if (normalizedConfirmation !== normalizedTitle) {
        throw new DocumentServiceError("confirmation_mismatch", "The title confirmation did not match")
      }
      if (revision.locale === "ko") {
        const series = await repository.listSeriesRevisionStates(revision.seriesId)
        const hasEnglish = series.some(({ locale }) => locale === "en")
        const hasOtherKorean = series.some(({ id, locale }) => id !== revision.id && locale === "ko")
        if (hasEnglish && !hasOtherKorean) {
          throw new DocumentServiceError("delete_dependency", "Keep a Korean revision while English history exists")
        }
      }
      await repository.deleteArchived(revisionId, actor)
    },

    async createNextDraft(revisionId: string, actor: AdminActor): Promise<DocumentRevision> {
      const source = await requireRevision(repository, revisionId)
      if (source.status !== "published" && source.status !== "archived") {
        throw new DocumentServiceError("conflict", "A new revision must begin from immutable content")
      }
      const series = await repository.listSeriesRevisionStates(source.seriesId)
      if (series.some(({ locale, status }) => locale === source.locale && (status === "draft" || status === "scheduled"))) {
        throw new DocumentServiceError("conflict", "An editable revision already exists")
      }
      return repository.createNextDraft(source.seriesId, publicInput(source), actor)
    },

    async schedule(
      revisionId: string,
      scheduledAt: Date,
      actor: AdminActor,
      now = new Date(),
    ): Promise<DocumentRevision> {
      const revision = await requireRevision(repository, revisionId)
      requireDraft(revision)
      const snapshot = requirePublishable(revision)
      if (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() <= now.getTime()) {
        throw new DocumentServiceError("invalid_schedule", "Scheduled publication must be in the future")
      }
      return repository.scheduleRevision(revisionId, scheduledAt, snapshot, actor)
    },

    async returnScheduledToDraft(
      revisionId: string,
      actor: AdminActor,
      now = new Date(),
    ): Promise<DocumentRevision> {
      const revision = await requireRevision(repository, revisionId)
      if (revision.status !== "scheduled") {
        throw new DocumentServiceError("conflict", "Only scheduled revisions may return to draft")
      }
      if (!revision.scheduledAt || revision.scheduledAt.getTime() <= now.getTime()) {
        throw new DocumentServiceError("conflict", "The scheduled publication time has passed")
      }
      return repository.returnScheduledToDraft(revisionId, actor)
    },

    async publish(revisionId: string, actor: AdminActor, now = new Date()): Promise<DocumentRevision> {
      return publishRevision(revisionId, actor, now)
    },

    async publishWithExpectedSummary(
      revisionId: string,
      expected: SummaryPromptSnapshot,
      actor: AdminActor,
      now = new Date(),
    ): Promise<DocumentRevision> {
      return publishRevision(revisionId, actor, now, expected)
    },

    async archive(revisionId: string, actor: AdminActor, now = new Date()): Promise<DocumentRevision> {
      const revision = await requireRevision(repository, revisionId)
      if (revision.status !== "published") {
        throw new DocumentServiceError("invalid_state", "Only the current published revision may be archived")
      }
      if (revision.locale === "ko") {
        const series = await repository.listSeriesRevisionStates(revision.seriesId)
        if (series.some(({ locale, status }) => locale === "en" && status === "published")) {
          throw new DocumentServiceError("archive_dependency", "Archive the published English revision first")
        }
      }
      const archived = await repository.archiveCurrent(revision.seriesId, revision.locale, revision.id, actor, now)
      if (!archived) throw new DocumentServiceError("revision_changed", "The published revision changed")
      return archived
    },

    listAdminSummaries: repository.listAdminSummaries.bind(repository),
    getRevision: repository.getRevision.bind(repository),

    async publishDue(now = new Date()): Promise<PublishDueResult> {
      return repository.publishDue(now, { githubId: "system:scheduler", name: "Document scheduler" })
    },
  }
}

export const documentService = createDocumentService(documentStore)

async function requirePublishedKorean(repository: DocumentRepository, seriesId: string): Promise<void> {
  const series = await repository.listSeriesRevisionStates(seriesId)
  if (!series.some(({ locale, status }) => locale === "ko" && status === "published")) {
    throw new DocumentServiceError("korean_not_published", "Publish the Korean revision first")
  }
}
