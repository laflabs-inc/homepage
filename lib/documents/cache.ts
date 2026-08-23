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
import { documentKinds } from "@/lib/documents/types"

export type PublishedDocumentReader = Pick<DocumentRepository, "listPublished" | "getPublished">

function restorePublishedDates(document: PublishedDocument): PublishedDocument {
  return {
    ...document,
    effectiveAt: document.effectiveAt ? new Date(document.effectiveAt) : null,
    publishedAt: new Date(document.publishedAt),
  }
}

export const documentCacheTags = {
  sitemap: "documents:sitemap",
  index(kind: DocumentKind, locale: Locale) {
    return [`documents:index:${kind}`, `documents:index:${kind}:${locale}`]
  },
  detail(kind: DocumentKind, slug: string, locale: Locale) {
    return [`documents:detail:${kind}:${slug}`, `documents:detail:${kind}:${slug}:${locale}`]
  },
}

async function readPublishedSitemapDocuments(repository: PublishedDocumentReader) {
  const documents: PublishedDocument[] = []
  for (const kind of documentKinds) {
    let before: PublishedDocumentFilter["before"]
    do {
      const page = await repository.listPublished({ kind, locale: "ko", limit: 50, before })
      documents.push(...page)
      const last = page.at(-1)
      before = page.length === 50 && last
        ? { pinned: last.pinned, publishedAt: last.publishedAt, id: last.id }
        : undefined
    } while (before)
  }
  return documents
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

export async function listPublishedSitemapDocuments(
  repository: PublishedDocumentReader = documentStore,
) {
  if (repository !== documentStore) return readPublishedSitemapDocuments(repository)

  const documents = await unstable_cache(
    () => readPublishedSitemapDocuments(documentStore),
    ["published-document-sitemap"],
    { revalidate: 60, tags: [documentCacheTags.sitemap] },
  )()
  return documents.map(restorePublishedDates)
}
