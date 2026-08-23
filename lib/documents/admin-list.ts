import type { DocumentKind, DocumentRevision, DocumentStatus, Locale } from "@/lib/documents/types"

export type AdminDocumentListRow = {
  id: string
  kind: DocumentKind
  locale: Locale
  revision: number
  title: string
  status: DocumentStatus
  publisher: string
  dateLabel: "Scheduled" | "Published" | "Updated"
  relevantAt: string
}

export function toAdminDocumentListRow(revision: DocumentRevision): AdminDocumentListRow {
  const [dateLabel, relevantAt] = revision.status === "scheduled"
    ? ["Scheduled" as const, revision.scheduledAt]
    : revision.status === "published"
      ? ["Published" as const, revision.publishedAt]
      : ["Updated" as const, revision.updatedAt]

  return {
    id: revision.id,
    kind: revision.kind,
    locale: revision.locale,
    revision: revision.revision,
    title: revision.title,
    status: revision.status,
    publisher: revision.publishedBy ?? revision.updatedBy,
    dateLabel,
    relevantAt: (relevantAt ?? revision.updatedAt).toISOString(),
  }
}
