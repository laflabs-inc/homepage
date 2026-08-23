import type { Metadata } from "next"

import { DocumentDetail, buildDocumentMetadata } from "@/components/content/document-detail"
import { documentSections } from "@/lib/content"
import { resolveDocumentPageLocale } from "../../locale"

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ locale?: string }> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, resolveDocumentPageLocale(searchParams)])
  return buildDocumentMetadata({ kind: "design", slug, locale, section: documentSections.design })
}

export default async function DesignDocumentPage({ params, searchParams }: Props) {
  const [{ slug }, locale] = await Promise.all([params, resolveDocumentPageLocale(searchParams)])
  return <DocumentDetail kind="design" slug={slug} locale={locale} section={documentSections.design} />
}
