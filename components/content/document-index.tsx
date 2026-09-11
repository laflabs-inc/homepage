import { listPublishedDocuments, type PublishedDocumentReader } from "@/lib/documents/cache"
import { documentStore } from "@/lib/documents/store"
import type { DocumentKind, Locale, PublishedDocument } from "@/lib/documents/types"
import type { DocumentCategorySnapshot } from "@/lib/document-categories/types"
import { decodePublishedCursor, encodePublishedCursor } from "@/lib/http/cursor"
import { documentCategoryCopy, type DocumentSectionCopy } from "@/lib/content"
import { DocumentIndexToolbar } from "./document-index-toolbar"
import { DocumentMasthead } from "./document-masthead"
import styles from "./content.module.css"

type DocumentIndexProps = {
  kind: DocumentKind
  locale: Locale
  section: DocumentSectionCopy
  cursor?: string
  category?: string
  sort?: string
  q?: string
  categories?: DocumentCategorySnapshot[]
  repository?: PublishedDocumentReader
}

function formatDate(value: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(value)
}

export async function DocumentIndex({
  kind,
  locale,
  section,
  cursor,
  category,
  sort,
  q,
  categories = [],
  repository = documentStore,
}: DocumentIndexProps) {
  const copy = section.localized[locale]
  const categoryCopy = documentCategoryCopy[locale]
  const selectedCategory = category && categories.some((candidate) => candidate.slug === category)
    ? category
    : undefined
  const selectedSort = sort === "oldest" ? "oldest" : "latest"
  const trimmedQuery = q?.trim()
  const selectedQuery = trimmedQuery && Array.from(trimmedQuery).length <= 100
    ? trimmedQuery
    : undefined
  const before = cursor ? decodePublishedCursor(cursor) ?? undefined : undefined
  const documents = await listPublishedDocuments({
    kind,
    locale,
    category: selectedCategory,
    sort: selectedSort,
    search: selectedQuery,
    before,
    limit: 21,
  }, repository)
  const visible = documents.slice(0, 20)
  const last = visible.at(-1)
  const nextCursor = documents.length > 20 && last
    ? encodePublishedCursor({ pinned: last.pinned, publishedAt: last.publishedAt, id: last.id })
    : null
  const usesGroups = kind === "legal"
  const categoryLabel = (value: string | null) => value
    ? (() => {
        const match = categories.find((candidate) => candidate.slug === value)
        return match ? (locale === "ko" ? match.labelKo : match.labelEn) : value
      })()
    : categoryCopy.uncategorized
  const detailHref = (document: PublishedDocument) => (
    `${section.path}/${document.slug}?locale=${locale}${selectedCategory ? `&category=${selectedCategory}` : ""}`
  )
  const documentCard = (document: PublishedDocument, grouped: boolean) => {
    const Heading = grouped ? "h3" : "h2"
    return (
      <article key={document.id} className={styles.documentCard}>
        <a href={detailHref(document)}>
          <div className={styles.cardMeta}>
            {document.pinned ? <span>{locale === "ko" ? "고정" : "Pinned"}</span> : null}
            {document.category ? <span>{categoryLabel(document.category)}</span> : null}
            <time dateTime={document.publishedAt.toISOString()}>{formatDate(document.publishedAt, locale)}</time>
          </div>
          <Heading>{document.title}</Heading>
          <p>{document.summary}</p>
        </a>
      </article>
    )
  }

  return (
    <section className={styles.indexPage} aria-labelledby="document-index-title">
      <DocumentMasthead kind={kind} locale={locale} />

      <DocumentIndexToolbar
        kind={kind}
        locale={locale}
        categories={categories}
        category={selectedCategory}
        sort={selectedSort}
        q={selectedQuery}
      />

      {visible.length === 0 ? (
        <div className={styles.emptyState}><span aria-hidden="true">□</span><p>{copy.empty}</p></div>
      ) : usesGroups ? (
        <div className={styles.categoryGroups}>
          {[...categories.map((candidate) => candidate.slug), null].map((groupCategory) => {
            const groupedDocuments = visible.filter((document) => document.category === groupCategory)
            if (groupedDocuments.length === 0) return null
            const id = `document-category-${groupCategory ?? "other"}`
            return (
              <section key={groupCategory ?? "other"} className={styles.categoryGroup} aria-labelledby={id}>
                <h2 id={id}>{categoryLabel(groupCategory)}</h2>
                <div className={styles.documentList}>
                  {groupedDocuments.map((document) => documentCard(document, true))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <div className={styles.documentList}>
          {visible.map((document) => documentCard(document, false))}
        </div>
      )}

      {nextCursor ? (
        <a className={styles.nextPage} href={(() => {
          const params = new URLSearchParams({ locale, cursor: nextCursor })
          if (selectedCategory) params.set("category", selectedCategory)
          if (selectedSort === "oldest") params.set("sort", selectedSort)
          if (selectedQuery) params.set("q", selectedQuery)
          return `${section.path}?${params.toString()}`
        })()}>
          {locale === "ko" ? "다음 문서" : "More documents"}
        </a>
      ) : null}
    </section>
  )
}
