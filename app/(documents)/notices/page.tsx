import { DocumentIndex } from "@/components/content/document-index"
import { documentSections } from "@/lib/content"
import { resolveDocumentPageLocale } from "../locale"

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ locale?: string; cursor?: string; category?: string }> }) {
  const query = await searchParams
  const locale = await resolveDocumentPageLocale(Promise.resolve(query))
  return <DocumentIndex kind="notice" locale={locale} section={documentSections.notice} cursor={query.cursor} category={query.category} />
}
