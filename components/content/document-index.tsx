import { listPublishedDocuments, type PublishedDocumentReader } from "@/lib/documents/cache"
import { documentStore } from "@/lib/documents/store"
import type { DocumentKind, Locale, PublishedDocument } from "@/lib/documents/types"
import { categoriesByKind } from "@/lib/documents/validation"
import { decodePublishedCursor, encodePublishedCursor } from "@/lib/http/cursor"
import { documentCategoryCopy, type DocumentSectionCopy } from "@/lib/content"
import styles from "./content.module.css"

type DocumentIndexProps = {
  kind: DocumentKind
  locale: Locale
  section: DocumentSectionCopy
  cursor?: string
  category?: string
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
  repository = documentStore,
}: DocumentIndexProps) {
  const copy = section.localized[locale]
  const categoryCopy = documentCategoryCopy[locale]
  const allowedCategories = categoriesByKind[kind] as readonly string[]
  const selectedCategory = category && allowedCategories.includes(category) ? category : undefined
  const before = cursor ? decodePublishedCursor(cursor) ?? undefined : undefined
  const documents = await listPublishedDocuments({
    kind,
    locale,
    category: selectedCategory,
    before,
    limit: 21,
  }, repository)
  const visible = documents.slice(0, 20)
  const last = visible.at(-1)
  const nextCursor = documents.length > 20 && last
    ? encodePublishedCursor({ pinned: last.pinned, publishedAt: last.publishedAt, id: last.id })
    : null
  const usesFilters = kind === "notice" || kind === "disclosure"
  const usesGroups = kind === "legal"
  const categoryLabel = (value: string | null) => value
    ? categoryCopy.labels[value as keyof typeof categoryCopy.labels] ?? value
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
    <section className={styles.page} aria-labelledby="document-index-title">
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 id="document-index-title">{copy.title}</h1>
        <p>{copy.description}</p>
      </header>

      {usesFilters ? (
        <nav className={styles.categoryFilters} aria-label={categoryCopy.filterLabel[kind]}>
          <a href={`${section.path}?locale=${locale}`} aria-current={!selectedCategory ? "page" : undefined}>
            {categoryCopy.all}
          </a>
          {allowedCategories.map((value) => (
            <a
              key={value}
              href={`${section.path}?locale=${locale}&category=${value}`}
              aria-current={selectedCategory === value ? "page" : undefined}
            >
              {categoryLabel(value)}
            </a>
          ))}
        </nav>
      ) : null}

      {visible.length === 0 ? (
        <div className={styles.emptyState}><span aria-hidden="true">□</span><p>{copy.empty}</p></div>
      ) : usesGroups ? (
        <div className={styles.categoryGroups}>
          {[...allowedCategories, null].map((groupCategory) => {
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
        <a className={styles.nextPage} href={`${section.path}?locale=${locale}&cursor=${encodeURIComponent(nextCursor)}${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ""}`}>
          {locale === "ko" ? "다음 문서" : "More documents"}
        </a>
      ) : null}
    </section>
  )
}
