import type { AdminActor } from "@/lib/auth/admin-api"

export const documentKinds = ["notice", "legal", "disclosure", "design"] as const
export type DocumentKind = (typeof documentKinds)[number]

export const documentLocales = ["ko", "en"] as const
export type Locale = (typeof documentLocales)[number]

export const documentStatuses = ["draft", "scheduled", "published", "archived"] as const
export type DocumentStatus = (typeof documentStatuses)[number]

export type DocumentDraftInput = {
  kind: DocumentKind
  locale: Locale
  slug: string
  category?: string | null
  pinned?: boolean
  title: string
  summary: string
  bodyMarkdown: string
  effectiveAt?: Date | null
}

export type DocumentRevision = {
  id: string
  seriesId: string
  kind: DocumentKind
  locale: Locale
  slug: string
  category: string | null
  pinned: boolean
  revision: number
  title: string
  summary: string
  bodyMarkdown: string
  status: DocumentStatus
  effectiveAt: Date | null
  scheduledAt: Date | null
  publishedAt: Date | null
  createdBy: string
  updatedBy: string
  publishedBy: string | null
  createdAt: Date
  updatedAt: Date
}

export type PublishedDocument = Omit<Pick<
  DocumentRevision,
  | "id"
  | "seriesId"
  | "kind"
  | "locale"
  | "slug"
  | "category"
  | "pinned"
  | "revision"
  | "title"
  | "summary"
  | "bodyMarkdown"
  | "effectiveAt"
  | "publishedAt"
>, "publishedAt"> & { publishedAt: Date }

export type PublishedLookup = {
  document: PublishedDocument | null
  availableLocales: Locale[]
}

export type AdminDocumentFilter = {
  seriesId?: string
  kind?: DocumentKind
  locale?: Locale
  status?: DocumentStatus
}

export type AdminDocumentSummary = Pick<
  DocumentRevision,
  | "id"
  | "kind"
  | "locale"
  | "revision"
  | "title"
  | "status"
  | "scheduledAt"
  | "publishedAt"
  | "updatedAt"
  | "updatedBy"
  | "publishedBy"
>

export type AdminDocumentSummaryFilter = AdminDocumentFilter & {
  search?: string
  limit?: number
  before?: { updatedAt: Date; id: string }
}

export type AdminDocumentSummaryPage = {
  items: AdminDocumentSummary[]
  nextCursor: { updatedAt: Date; id: string } | null
}

export type PublishedDocumentFilter = {
  kind: DocumentKind
  locale: Locale
  category?: string
  limit?: number
  before?: { pinned: boolean; publishedAt: Date; id: string }
}

export type AuditAction = {
  action: string
  targetType: string
  targetId: string
  actor: AdminActor
  metadata?: Record<string, unknown>
}

export type PublishedRevisionReference = Pick<DocumentRevision, "id" | "kind" | "locale" | "slug">

export type PublishDueResult = {
  publishedRevisions: PublishedRevisionReference[]
  failedIds: string[]
}

export type PublicationTransitionSnapshot = Pick<
  DocumentRevision,
  | "kind"
  | "locale"
  | "slug"
  | "category"
  | "pinned"
  | "title"
  | "summary"
  | "bodyMarkdown"
  | "effectiveAt"
> & {
  normalizedSummary: string
}

export type DocumentSeriesState = {
  id: string
  metadataLocked: boolean
}

export interface DocumentRepository {
  createDraft(input: DocumentDraftInput, actor: AdminActor): Promise<DocumentRevision>
  getRevision(revisionId: string): Promise<DocumentRevision | null>
  getSeriesState(seriesId: string): Promise<DocumentSeriesState | null>
  updateDraft(revisionId: string, input: DocumentDraftInput, actor: AdminActor): Promise<DocumentRevision>
  deleteDraft(revisionId: string, actor: AdminActor): Promise<void>
  createNextDraft(seriesId: string, input: DocumentDraftInput, actor: AdminActor): Promise<DocumentRevision>
  scheduleRevision(revisionId: string, scheduledAt: Date, snapshot: PublicationTransitionSnapshot, actor: AdminActor): Promise<DocumentRevision>
  returnScheduledToDraft(revisionId: string, actor: AdminActor): Promise<DocumentRevision>
  publishRevision(revisionId: string, snapshot: PublicationTransitionSnapshot, actor: AdminActor, now: Date): Promise<DocumentRevision>
  archiveCurrent(seriesId: string, locale: Locale, expectedRevisionId: string, actor: AdminActor, now: Date): Promise<DocumentRevision | null>
  listAdmin(filter?: AdminDocumentFilter): Promise<DocumentRevision[]>
  listAdminSummaries(filter?: AdminDocumentSummaryFilter): Promise<AdminDocumentSummaryPage>
  listPublished(filter: PublishedDocumentFilter): Promise<PublishedDocument[]>
  getPublished(kind: DocumentKind, slug: string, locale: Locale): Promise<PublishedLookup>
  publishDue(now: Date, actor: AdminActor): Promise<PublishDueResult>
}
