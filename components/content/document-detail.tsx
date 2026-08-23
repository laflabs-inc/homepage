import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { MarkdownDocument } from "@/components/content/markdown-document"
import type { DocumentSectionCopy } from "@/lib/content"
import { getPublishedDocument, type PublishedDocumentReader } from "@/lib/documents/cache"
import { documentStore } from "@/lib/documents/store"
import type { DocumentKind, Locale } from "@/lib/documents/types"
import { buildDocumentOutline } from "@/lib/markdown/outline"
import styles from "./content.module.css"

type DocumentDetailProps = {
  kind: DocumentKind
  slug: string
  locale: Locale
  section: DocumentSectionCopy
  repository?: PublishedDocumentReader
}

function formatDate(value: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(value)
}

export async function DocumentDetail({
  kind,
  slug,
  locale,
  section,
  repository = documentStore,
}: DocumentDetailProps) {
  const lookup = await getPublishedDocument(kind, slug, locale, repository)
  const copy = section.localized[locale]

  if (!lookup.document) {
    if (lookup.availableLocales.length === 0) notFound()

    return (
      <section className={styles.page}>
        <div className={styles.unavailableState}>
          <span aria-hidden="true">□</span>
          <h1>{copy.unavailableTitle}</h1>
          <p>{copy.unavailableBody}</p>
          {lookup.availableLocales.includes("ko") ? (
            <a href={`${section.path}/${slug}?locale=ko`} hrefLang="ko">{copy.koreanLink}</a>
          ) : null}
        </div>
      </section>
    )
  }

  const document = lookup.document
  const outline = buildDocumentOutline(document.bodyMarkdown)
  const publishedLabel = locale === "ko"
    ? `${formatDate(document.publishedAt, locale)} ${copy.published}`
    : `${copy.published} ${formatDate(document.publishedAt, locale)}`
  const effectiveLabel = document.effectiveAt
    ? locale === "ko"
      ? `${formatDate(document.effectiveAt, locale)} ${copy.effective}`
      : `${copy.effective} ${formatDate(document.effectiveAt, locale)}`
    : null

  return (
    <section className={styles.detailPage}>
      <a className={styles.backLink} href={`${section.path}?locale=${locale}`}>← {copy.back}</a>
      <MarkdownDocument
        source={document.bodyMarkdown}
        title={document.title}
        intro={(
          <>
            <p className={styles.summary}>{document.summary}</p>
            <div className={styles.documentMeta}>
              <time dateTime={document.publishedAt.toISOString()}>{publishedLabel}</time>
              {document.effectiveAt ? <time dateTime={document.effectiveAt.toISOString()}>{effectiveLabel}</time> : null}
            </div>
            {outline.length ? (
              <nav className={styles.contents} aria-label={copy.contents}>
                <h2>{copy.contents}</h2>
                <ol>
                  {outline.map((item) => (
                    <li key={item.id} data-depth={item.depth}><a href={`#${item.id}`}>{item.text}</a></li>
                  ))}
                </ol>
              </nav>
            ) : null}
          </>
        )}
      />
    </section>
  )
}

export async function buildDocumentMetadata({
  kind,
  slug,
  locale,
  section,
  repository = documentStore,
}: DocumentDetailProps): Promise<Metadata> {
  const lookup = await getPublishedDocument(kind, slug, locale, repository)
  const document = lookup.document
  if (!document) {
    const copy = section.localized[locale]
    return { title: copy.title, description: copy.description, robots: { index: false, follow: true } }
  }

  const canonical = `${section.path}/${slug}`
  return {
    title: document.title,
    description: document.summary,
    alternates: { canonical },
    openGraph: {
      type: "article",
      locale: locale === "ko" ? "ko_KR" : "en_US",
      title: document.title,
      description: document.summary,
      url: canonical,
      publishedTime: document.publishedAt.toISOString(),
      modifiedTime: document.publishedAt.toISOString(),
    },
  }
}
