import { DocumentIndex } from "@/components/content/document-index"
import { documentSections } from "@/lib/content"
import { listPublishedDocumentCategories } from "@/lib/documents/cache"
import { resolveDocumentPageLocale } from "../locale"

export default async function DisclosuresPage({ searchParams }: { searchParams: Promise<{ locale?: string; cursor?: string; category?: string; sort?: string; q?: string }> }) {
  const query = await searchParams
  const [locale, categories] = await Promise.all([
    resolveDocumentPageLocale(Promise.resolve(query)),
    listPublishedDocumentCategories("disclosure"),
  ])
  return <DocumentIndex kind="disclosure" locale={locale} section={documentSections.disclosure} cursor={query.cursor} category={query.category} sort={query.sort} q={query.q} categories={categories} />
}
