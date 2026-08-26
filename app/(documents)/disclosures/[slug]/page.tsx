import type { Metadata } from "next"

import { DocumentDetail, buildDocumentMetadata } from "@/components/content/document-detail"
import { documentSections } from "@/lib/content"
import { resolveDocumentPageLocale } from "../../locale"

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ locale?: string; category?: string }> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, resolveDocumentPageLocale(searchParams)])
  return buildDocumentMetadata({ kind: "disclosure", slug, locale, section: documentSections.disclosure })
}

export default async function DisclosurePage({ params, searchParams }: Props) {
  const [{ slug }, query, locale] = await Promise.all([params, searchParams, resolveDocumentPageLocale(searchParams)])
  return <DocumentDetail kind="disclosure" slug={slug} locale={locale} section={documentSections.disclosure} category={query.category} />
}
