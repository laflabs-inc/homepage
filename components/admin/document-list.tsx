"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import styles from "@/app/admin/admin.module.css"
import type { DocumentRevision } from "@/lib/documents/types"

export function DocumentList({ revisions }: { revisions: DocumentRevision[] }) {
  const [search, setSearch] = useState("")
  const [kind, setKind] = useState("")
  const [status, setStatus] = useState("")
  const [locale, setLocale] = useState("")
  const filtered = useMemo(() => revisions.filter((revision) => (
    (!search || revision.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    && (!kind || revision.kind === kind)
    && (!status || revision.status === status)
    && (!locale || revision.locale === locale)
  )), [kind, locale, revisions, search, status])

  function relevantDate(revision: DocumentRevision) {
    const [label, value] = revision.status === "scheduled"
      ? ["Scheduled", revision.scheduledAt]
      : revision.status === "published"
        ? ["Published", revision.publishedAt]
        : ["Updated", revision.updatedAt]
    return `${label} ${new Date(value ?? revision.updatedAt).toISOString().slice(0, 10)}`
  }

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
          <h2>{revisions.length === 0 ? "No documents yet" : "No documents match these filters."}</h2>
          {revisions.length === 0 ? <p>Create the first Korean document draft to begin a publication series.</p> : null}
        </div>
      ) : (
        <ul className={styles.documentList}>
          {filtered.map((revision) => (
            <li key={revision.id}>
              <Link href={`/admin/documents/${revision.id}`}>
                <span className={styles.documentListTitle}>{revision.title}</span>
                <span>{revision.kind} / {revision.locale} / r{revision.revision}</span>
                <span>By {revision.publishedBy ?? revision.updatedBy}</span>
                <span>{relevantDate(revision)}</span>
                <span className={styles.statusBadge}>{revision.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
