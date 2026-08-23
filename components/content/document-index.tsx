import { listPublishedDocuments, type PublishedDocumentReader } from "@/lib/documents/cache"
import { documentStore } from "@/lib/documents/store"
import type { DocumentKind, Locale } from "@/lib/documents/types"
import { decodePublishedCursor, encodePublishedCursor } from "@/lib/http/cursor"
import type { DocumentSectionCopy } from "@/lib/content"
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
  const before = cursor ? decodePublishedCursor(cursor) ?? undefined : undefined
  const documents = await listPublishedDocuments({
    kind,
    locale,
    category,
    before,
    limit: 21,
  }, repository)
  const visible = documents.slice(0, 20)
  const last = visible.at(-1)
  const nextCursor = documents.length > 20 && last
    ? encodePublishedCursor({ pinned: last.pinned, publishedAt: last.publishedAt, id: last.id })
    : null

  return (
    <section className={styles.page} aria-labelledby="document-index-title">
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 id="document-index-title">{copy.title}</h1>
        <p>{copy.description}</p>
      </header>

      {visible.length === 0 ? (
        <div className={styles.emptyState}><span aria-hidden="true">□</span><p>{copy.empty}</p></div>
      ) : (
        <div className={styles.documentList}>
          {visible.map((document) => (
            <article key={document.id} className={styles.documentCard}>
              <a href={`${section.path}/${document.slug}?locale=${locale}`}>
                <div className={styles.cardMeta}>
                  {document.pinned ? <span>{locale === "ko" ? "고정" : "Pinned"}</span> : null}
                  {document.category ? <span>{document.category}</span> : null}
                  <time dateTime={document.publishedAt.toISOString()}>{formatDate(document.publishedAt, locale)}</time>
                </div>
                <h2>{document.title}</h2>
                <p>{document.summary}</p>
              </a>
            </article>
          ))}
        </div>
      )}

      {nextCursor ? (
        <a className={styles.nextPage} href={`${section.path}?locale=${locale}&cursor=${encodeURIComponent(nextCursor)}${category ? `&category=${encodeURIComponent(category)}` : ""}`}>
          {locale === "ko" ? "다음 문서" : "More documents"}
        </a>
      ) : null}
    </section>
  )
}
