import "server-only"

import { unstable_cache } from "next/cache"

import { documentStore } from "@/lib/documents/store"
import type {
  DocumentKind,
  DocumentRepository,
  Locale,
  PublishedDocument,
  PublishedDocumentFilter,
} from "@/lib/documents/types"

export type PublishedDocumentReader = Pick<DocumentRepository, "listPublished" | "getPublished">

function restorePublishedDates(document: PublishedDocument): PublishedDocument {
  return {
    ...document,
    effectiveAt: document.effectiveAt ? new Date(document.effectiveAt) : null,
    publishedAt: new Date(document.publishedAt),
  }
}

export const documentCacheTags = {
  index(kind: DocumentKind, locale: Locale) {
    return ["documents", "documents:sitemap", `documents:index:${kind}`, `documents:index:${kind}:${locale}`]
  },
  detail(kind: DocumentKind, slug: string, locale: Locale) {
    return ["documents", "documents:sitemap", `documents:detail:${kind}:${slug}`, `documents:detail:${kind}:${slug}:${locale}`]
  },
}

export async function listPublishedDocuments(
  filter: PublishedDocumentFilter,
  repository: PublishedDocumentReader = documentStore,
) {
  if (repository !== documentStore) return repository.listPublished(filter)

  const before = filter.before
  const documents = await unstable_cache(
    () => documentStore.listPublished(filter),
    [
      "published-documents",
      filter.kind,
      filter.locale,
      filter.category ?? "",
      String(filter.limit ?? 20),
      before ? String(before.pinned) : "",
      before?.publishedAt.toISOString() ?? "",
      before?.id ?? "",
    ],
    { revalidate: 60, tags: documentCacheTags.index(filter.kind, filter.locale) },
  )()
  return documents.map(restorePublishedDates)
}

export async function getPublishedDocument(
  kind: DocumentKind,
  slug: string,
  locale: Locale,
  repository: PublishedDocumentReader = documentStore,
) {
  if (repository !== documentStore) return repository.getPublished(kind, slug, locale)

  const lookup = await unstable_cache(
    () => documentStore.getPublished(kind, slug, locale),
    ["published-document", kind, slug, locale],
    { revalidate: 60, tags: documentCacheTags.detail(kind, slug, locale) },
  )()
  return {
    ...lookup,
    document: lookup.document ? restorePublishedDates(lookup.document) : null,
  }
}
