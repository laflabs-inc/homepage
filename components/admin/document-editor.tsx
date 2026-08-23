"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import styles from "@/app/admin/admin.module.css"
import { DocumentPreview } from "@/components/admin/document-preview"
import { categoriesByKind } from "@/lib/documents/validation"
import type { DocumentDraftInput, DocumentKind, DocumentRevision, Locale } from "@/lib/documents/types"

type EditorValues = {
  kind: DocumentKind
  locale: Locale
  slug: string
  category: string
  pinned: boolean
  title: string
  summary: string
  bodyMarkdown: string
  effectiveAt: string
}

type DocumentEditorProps = {
  revision?: DocumentRevision
  seriesId?: string
}

const blankValues: EditorValues = {
  kind: "notice",
  locale: "ko",
  slug: "",
  category: "general",
  pinned: false,
  title: "",
  summary: "",
  bodyMarkdown: "",
  effectiveAt: "",
}

function dateInputValue(value: Date | string | null): string {
  if (!value) return ""
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : ""
}

function valuesFromRevision(revision?: DocumentRevision): EditorValues {
  if (!revision) return blankValues
  return {
    kind: revision.kind,
    locale: revision.locale,
    slug: revision.slug,
    category: revision.category ?? "",
    pinned: revision.pinned,
    title: revision.title,
    summary: revision.summary,
    bodyMarkdown: revision.bodyMarkdown,
    effectiveAt: dateInputValue(revision.effectiveAt),
  }
}

function draftPayload(values: EditorValues): DocumentDraftInput {
  return {
    kind: values.kind,
    locale: values.locale,
    slug: values.slug,
    category: values.category || null,
    pinned: values.pinned,
    title: values.title,
    summary: values.summary,
    bodyMarkdown: values.bodyMarkdown,
    effectiveAt: values.effectiveAt ? new Date(`${values.effectiveAt}T00:00:00.000Z`) : null,
  }
}

function displayDate(value: Date | string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : "—"
}

export function DocumentEditor({ revision: initialRevision, seriesId }: DocumentEditorProps) {
  const router = useRouter()
  const [revision, setRevision] = useState(initialRevision)
  const [values, setValues] = useState(() => valuesFromRevision(initialRevision))
  const [dirty, setDirty] = useState(false)
  const [activeTab, setActiveTab] = useState<"source" | "preview">("source")
  const [scheduledAt, setScheduledAt] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const categoryOptions = useMemo(() => categoriesByKind[values.kind], [values.kind])
  const editable = !revision || revision.status === "draft"

  function update<K extends keyof EditorValues>(key: K, value: EditorValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setDirty(true)
    setNotice(null)
  }

  async function requestMutation(path: string, method: "POST" | "PATCH", body: unknown) {
    setPending(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(path, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error("request failed")
      const payload = await response.json() as { revision?: DocumentRevision }
      if (!payload.revision) throw new Error("invalid response")
      setRevision(payload.revision)
      setValues(valuesFromRevision(payload.revision))
      setDirty(false)
      return payload.revision
    } catch {
      setError("The document could not be updated. Please try again.")
      return null
    } finally {
      setPending(false)
    }
  }

  async function saveDraft() {
    const payload = draftPayload(values)
    const path = revision ? `/api/admin/documents/${revision.id}` : "/api/admin/documents"
    const body = !revision && seriesId ? { ...payload, seriesId } : payload
    const saved = await requestMutation(path, revision ? "PATCH" : "POST", body)
    if (!saved) return
    setNotice("Draft saved.")
    if (!revision) router.replace(`/admin/documents/${saved.id}`)
  }

  async function confirmedAction(
    label: string,
    action: string,
    body: unknown = {},
    success = "Document updated.",
  ) {
    if (!revision || !window.confirm(label)) return
    const updated = await requestMutation(`/api/admin/documents/${revision.id}/${action}`, "POST", body)
    if (!updated) return
    setNotice(success)
    if (action === "new-revision") router.replace(`/admin/documents/${updated.id}`)
  }

  if (!editable && revision) {
    return (
      <section className={styles.immutableDocument} aria-labelledby="document-title">
        <div className={styles.immutableMeta}>
          <p className={styles.eyebrow}>{revision.kind} / {revision.locale} / revision {revision.revision}</p>
          <h1 id="document-title">{revision.title}</h1>
          <dl>
            <div><dt>Status</dt><dd>{revision.status[0].toUpperCase() + revision.status.slice(1)}</dd></div>
            <div><dt>Slug</dt><dd>{revision.slug}</dd></div>
            <div><dt>Scheduled</dt><dd>{displayDate(revision.scheduledAt)}</dd></div>
            <div><dt>Published</dt><dd>{displayDate(revision.publishedAt)}</dd></div>
          </dl>
        </div>
        <div className={styles.immutablePreview}>
          <DocumentPreview title={revision.title} source={revision.bodyMarkdown} />
        </div>
        {error ? <p className={styles.formAlert} role="alert">{error}</p> : null}
        {notice ? <p className={styles.formNotice} role="status">{notice}</p> : null}
        <div className={styles.editorActions}>
          {revision.status === "scheduled" ? (
            <>
              <button disabled={pending} type="button" onClick={() => confirmedAction(
                "Return this scheduled revision to draft?",
                "unschedule",
                {},
                "Schedule removed.",
              )}>Return to draft</button>
              <button disabled={pending} type="button" onClick={() => confirmedAction(
                "Publish this document now?",
                "publish",
                {},
                "Document published.",
              )}>Publish now</button>
            </>
          ) : null}
          {revision.status === "published" ? (
            <button disabled={pending} type="button" onClick={() => confirmedAction(
              "Archive this published document?",
              "archive",
              {},
              "Document archived.",
            )}>Archive</button>
          ) : null}
          {revision.status === "published" || revision.status === "archived" ? (
            <button disabled={pending} type="button" onClick={() => confirmedAction(
              "Create a new editable revision from this content?",
              "new-revision",
              {},
              "New revision created.",
            )}>Create new revision</button>
          ) : null}
        </div>
      </section>
    )
  }

  return (
    <section className={styles.editor} aria-label={revision ? "Edit document" : "Create document"}>
      <div className={styles.editorTabs} role="tablist" aria-label="Document workspace">
        <button
          type="button"
          role="tab"
          id="source-tab"
          aria-controls="source-panel"
          aria-selected={activeTab === "source"}
          onClick={() => setActiveTab("source")}
        >Source</button>
        <button
          type="button"
          role="tab"
          id="preview-tab"
          aria-controls="preview-panel"
          aria-selected={activeTab === "preview"}
          onClick={() => setActiveTab("preview")}
        >Preview</button>
      </div>
      <div className={styles.editorGrid}>
        <form
          id="source-panel"
          className={styles.editorSource}
          role="tabpanel"
          aria-labelledby="source-tab"
          aria-label="Source"
          data-active={activeTab === "source"}
          onSubmit={(event) => { event.preventDefault(); void saveDraft() }}
        >
          <div className={styles.editorFieldGrid}>
            <label>Kind
              <select value={values.kind} onChange={(event) => {
                const kind = event.target.value as DocumentKind
                setValues((current) => ({ ...current, kind, category: categoriesByKind[kind][0] }))
                setDirty(true)
              }}>
                <option value="notice">Notice</option>
                <option value="legal">Legal</option>
                <option value="disclosure">Disclosure</option>
                <option value="design">Design</option>
              </select>
            </label>
            <label>Locale
              <select value={values.locale} onChange={(event) => update("locale", event.target.value as Locale)}>
                <option value="ko">Korean</option>
                <option value="en">English</option>
              </select>
            </label>
            <label>Slug
              <input required value={values.slug} onChange={(event) => update("slug", event.target.value)} />
            </label>
            <label>Category
              <select value={values.category} onChange={(event) => update("category", event.target.value)}>
                {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className={styles.checkboxField}>
              <input type="checkbox" checked={values.pinned} onChange={(event) => update("pinned", event.target.checked)} />
              Pinned
            </label>
            <label>Effective date
              <input type="date" value={values.effectiveAt} onChange={(event) => update("effectiveAt", event.target.value)} />
            </label>
          </div>
          <label>Title
            <input required maxLength={160} value={values.title} onChange={(event) => update("title", event.target.value)} />
          </label>
          <label>Summary
            <textarea maxLength={240} rows={3} value={values.summary} onChange={(event) => update("summary", event.target.value)} />
          </label>
          <label>Markdown body
            <textarea required maxLength={200_000} rows={24} value={values.bodyMarkdown} onChange={(event) => update("bodyMarkdown", event.target.value)} />
          </label>
          {error ? <p className={styles.formAlert} role="alert">{error}</p> : null}
          {notice ? <p className={styles.formNotice} role="status">{notice}</p> : null}
          <div className={styles.editorActions}>
            <button disabled={pending} type="submit">Save draft</button>
            {revision ? (
              <>
                <label className={styles.scheduleField}>Schedule time
                  <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
                </label>
                <button disabled={pending || !scheduledAt} type="button" onClick={() => confirmedAction(
                  "Schedule this document for publication?",
                  "schedule",
                  { scheduledAt: new Date(scheduledAt).toISOString() },
                  "Document scheduled.",
                )}>Schedule</button>
                <button disabled={pending} type="button" onClick={() => confirmedAction(
                  "Publish this document now?",
                  "publish",
                  {},
                  "Document published.",
                )}>Publish now</button>
              </>
            ) : null}
          </div>
        </form>
        <div
          id="preview-panel"
          className={styles.editorPreview}
          role="tabpanel"
          aria-labelledby="preview-tab"
          aria-label="Preview"
          data-active={activeTab === "preview"}
        >
          <DocumentPreview title={values.title} source={values.bodyMarkdown} />
        </div>
      </div>
    </section>
  )
}
