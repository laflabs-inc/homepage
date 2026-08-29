"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import styles from "@/app/admin/admin.module.css"
import { useLocale } from "@/components/i18n/locale-provider"
import { adminCopy } from "@/lib/admin/i18n"
import type { AdminDocumentListRow } from "@/lib/documents/admin-list"
import type { Locale } from "@/lib/i18n"

type DocumentListProps = {
  rows: AdminDocumentListRow[]
  nextCursor?: string | null
  limit?: number
  initialFilters?: { search?: string; kind?: string; status?: string; locale?: string }
}
const emptyFilters: NonNullable<DocumentListProps["initialFilters"]> = {}

function displayDocumentLocale(value: AdminDocumentListRow["locale"], locale: Locale) {
  const t = adminCopy[locale].documents
  return value === "ko" ? t.korean : t.english
}

function formatDocumentDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value))
}

export function DocumentList({
  rows,
  nextCursor = null,
  limit = 50,
  initialFilters = emptyFilters,
}: DocumentListProps) {
  const localePreference = useLocale()
  const t = adminCopy[localePreference].documents
  const [search, setSearch] = useState(initialFilters.search ?? "")
  const [kind, setKind] = useState(initialFilters.kind ?? "")
  const [status, setStatus] = useState(initialFilters.status ?? "")
  const [locale, setLocale] = useState(initialFilters.locale ?? "")
  const filtered = useMemo(() => rows.filter((revision) => (
    (!search || revision.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    && (!kind || revision.kind === kind)
    && (!status || revision.status === status)
    && (!locale || revision.locale === locale)
  )), [kind, locale, rows, search, status])

  function pageHref(
    filters: NonNullable<DocumentListProps["initialFilters"]>,
    cursor?: string,
  ): string {
    const query = new URLSearchParams()
    if (filters.search) query.set("search", filters.search)
    if (filters.kind) query.set("kind", filters.kind)
    if (filters.status) query.set("status", filters.status)
    if (filters.locale) query.set("locale", filters.locale)
    query.set("limit", String(limit))
    if (cursor) query.set("cursor", cursor)
    return `/admin/documents?${query.toString()}`
  }

  return (
    <div className={styles.documentListWorkspace}>
      <div className={styles.documentFilters}>
        <label>{t.search}
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label>{t.kindFilter}
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="">{t.allKinds}</option>
            <option value="notice">{t.notice}</option>
            <option value="legal">{t.legal}</option>
            <option value="disclosure">{t.disclosure}</option>
          </select>
        </label>
        <label>{t.statusFilter}
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">{t.allStatuses}</option>
            <option value="draft">{t.draft}</option>
            <option value="scheduled">{t.scheduled}</option>
            <option value="published">{t.published}</option>
            <option value="archived">{t.archived}</option>
          </select>
        </label>
        <label>{t.localeFilter}
          <select value={locale} onChange={(event) => setLocale(event.target.value)}>
            <option value="">{t.allLocales}</option>
            <option value="ko">{t.korean}</option>
            <option value="en">{t.english}</option>
          </select>
        </label>
      </div>
      <div className={styles.editorActions}>
        <Link href={pageHref({ search, kind, status, locale })}>{t.applyFilters}</Link>
        {nextCursor ? <Link href={pageHref(initialFilters, nextCursor)}>{t.nextPage}</Link> : null}
      </div>
      {filtered.length === 0 ? (
        <div className={styles.documentEmpty}>
          <h2>{rows.length === 0 ? t.noDocumentsYet : t.noMatchingDocuments}</h2>
          {rows.length === 0 ? <p>{t.firstDocumentDescription}</p> : null}
        </div>
      ) : (
        <ul className={styles.documentList}>
          {filtered.map((revision) => (
            <li key={revision.id}>
              <Link href={`/admin/documents/${revision.id}`}>
                <span className={styles.documentListTitle}>{revision.title}</span>
                <span>{t[revision.kind]} / {displayDocumentLocale(revision.locale, localePreference)} / r{revision.revision}</span>
                <span>{t.by} {revision.publisher}</span>
                <span>{t[revision.dateLabel === "Scheduled" ? "scheduledAt" : revision.dateLabel === "Published" ? "publishedAt" : "updatedAt"]} {formatDocumentDate(revision.relevantAt, localePreference)}</span>
                <span className={styles.statusBadge}>{t[revision.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
