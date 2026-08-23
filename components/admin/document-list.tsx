"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import styles from "@/app/admin/admin.module.css"
import type { AdminDocumentListRow } from "@/lib/documents/admin-list"

export function DocumentList({ rows }: { rows: AdminDocumentListRow[] }) {
  const [search, setSearch] = useState("")
  const [kind, setKind] = useState("")
  const [status, setStatus] = useState("")
  const [locale, setLocale] = useState("")
  const filtered = useMemo(() => rows.filter((revision) => (
    (!search || revision.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    && (!kind || revision.kind === kind)
    && (!status || revision.status === status)
    && (!locale || revision.locale === locale)
  )), [kind, locale, rows, search, status])

  return (
    <div className={styles.documentListWorkspace}>
      <div className={styles.documentFilters}>
        <label>Search documents
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label>Kind filter
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="">All kinds</option>
            <option value="notice">Notice</option>
            <option value="legal">Legal</option>
            <option value="disclosure">Disclosure</option>
            <option value="design">Design</option>
          </select>
        </label>
        <label>Status filter
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label>Locale filter
          <select value={locale} onChange={(event) => setLocale(event.target.value)}>
            <option value="">All locales</option>
            <option value="ko">Korean</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>
      {filtered.length === 0 ? (
        <div className={styles.documentEmpty}>
          <h2>{rows.length === 0 ? "No documents yet" : "No documents match these filters."}</h2>
          {rows.length === 0 ? <p>Create the first Korean document draft to begin a publication series.</p> : null}
        </div>
      ) : (
        <ul className={styles.documentList}>
          {filtered.map((revision) => (
            <li key={revision.id}>
              <Link href={`/admin/documents/${revision.id}`}>
                <span className={styles.documentListTitle}>{revision.title}</span>
                <span>{revision.kind} / {revision.locale} / r{revision.revision}</span>
                <span>By {revision.publisher}</span>
                <span>{revision.dateLabel} {revision.relevantAt.slice(0, 10)}</span>
                <span className={styles.statusBadge}>{revision.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
