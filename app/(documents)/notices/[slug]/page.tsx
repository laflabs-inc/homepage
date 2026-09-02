import type { Metadata } from "next"

import { DocumentDetail, buildDocumentMetadata } from "@/components/content/document-detail"
import { documentSections } from "@/lib/content"
import { listPublishedDocumentCategories } from "@/lib/documents/cache"
import { resolveDocumentPageLocale } from "../../locale"

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ locale?: string; category?: string }> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, resolveDocumentPageLocale(searchParams)])
  return buildDocumentMetadata({ kind: "notice", slug, locale, section: documentSections.notice })
}

export default async function NoticePage({ params, searchParams }: Props) {
  const [{ slug }, query, locale, categories] = await Promise.all([
    params,
    searchParams,
    resolveDocumentPageLocale(searchParams),
    listPublishedDocumentCategories("notice"),
  ])
  return <DocumentDetail kind="notice" slug={slug} locale={locale} section={documentSections.notice} category={query.category} categories={categories} />
}
