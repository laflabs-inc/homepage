"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import styles from "@/app/admin/admin.module.css"
import { DocumentPreview } from "@/components/admin/document-preview"
import { useDirtyNavigationGuard } from "@/components/admin/use-dirty-navigation-guard"
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
  templateRevision?: DocumentRevision
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
  if (!revision) return { ...blankValues }
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

function initialValues(
  revision?: DocumentRevision,
  seriesId?: string,
  templateRevision?: DocumentRevision,
): EditorValues {
  if (revision) return valuesFromRevision(revision)
  if (!seriesId || !templateRevision) return { ...blankValues }
  return {
    ...valuesFromRevision(templateRevision),
    locale: "en",
    title: "",
    summary: "",
    bodyMarkdown: "",
    effectiveAt: "",
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

function editorValuesEqual(left: EditorValues, right: EditorValues): boolean {
  return left.kind === right.kind
    && left.locale === right.locale
    && left.slug === right.slug
    && left.category === right.category
    && left.pinned === right.pinned
    && left.title === right.title
    && left.summary === right.summary
    && left.bodyMarkdown === right.bodyMarkdown
    && left.effectiveAt === right.effectiveAt
}

function mutationErrorMessage(path: string, payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "The document could not be updated. Please try again."
  }

  const error = "error" in payload ? payload.error : null
  const fields = "fields" in payload && Array.isArray(payload.fields)
    ? payload.fields.filter((field): field is string => typeof field === "string")
    : []
  const isPublish = path.endsWith("/publish")

  if (error === "incomplete_document") {
    if (fields.includes("summary")) {
      return isPublish
        ? "Add a one-line summary of 1–240 characters, save the draft, and publish again."
        : "Add a one-line summary of 1–240 characters, save the draft, and try again."
    }
    if (fields.includes("bodyMarkdown")) {
      return isPublish
        ? "Add meaningful alt text to every Markdown image, save the draft, and publish again."
        : "Add meaningful alt text to every Markdown image, save the draft, and try again."
    }
    return "Complete the required publication fields, save the draft, and try again."
  }
  if (error === "provider_unavailable") {
    return "AI summary is unavailable. Enter a one-line summary manually, save the draft, and publish again."
  }
  if (error === "monthly_limit") {
    return "The AI monthly limit has been reached. Enter a one-line summary manually, save the draft, and publish again."
  }
  return "The document could not be updated. Please try again."
}

export function DocumentEditor({ revision: initialRevision, seriesId, templateRevision }: DocumentEditorProps) {
  const router = useRouter()
  const [revision, setRevision] = useState(initialRevision)
  const [values, setValues] = useState(() => initialValues(initialRevision, seriesId, templateRevision))
  const valuesRef = useRef(values)
  const [dirty, setDirty] = useState(false)
  const [activeTab, setActiveTab] = useState<"source" | "preview">("source")
  const [scheduledAt, setScheduledAt] = useState("")
  const [pending, setPending] = useState(false)
  const [summaryPending, setSummaryPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const discardChanges = useCallback(() => setDirty(false), [])
  const retireDirtyNavigationGuard = useDirtyNavigationGuard(dirty, discardChanges)

  const categoryOptions = useMemo(() => categoriesByKind[values.kind], [values.kind])
  const editable = !revision || revision.status === "draft"
  const englishSeriesFieldsLocked = values.locale === "en"

  function update<K extends keyof EditorValues>(key: K, value: EditorValues[K]) {
    const next = { ...valuesRef.current, [key]: value }
    valuesRef.current = next
    setValues(next)
    setDirty(true)
    setNotice(null)
  }

  async function requestMutation(
    path: string,
    method: "POST" | "PATCH",
    body: unknown,
    submittedValues?: EditorValues,
  ) {
    setPending(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(path, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      const payload = await response.json().catch(() => null) as { revision?: DocumentRevision } | null
      if (!response.ok) {
        setError(mutationErrorMessage(path, payload))
        return null
      }
      if (!payload?.revision) throw new Error("invalid response")
      const newerEdits = submittedValues !== undefined && !editorValuesEqual(valuesRef.current, submittedValues)
      setRevision(payload.revision)
      if (!newerEdits) {
        const serverValues = valuesFromRevision(payload.revision)
        valuesRef.current = serverValues
        setValues(serverValues)
        setDirty(false)
      } else {
        setDirty(true)
      }
      return { revision: payload.revision, newerEdits }
    } catch {
      setError("The document could not be updated. Please try again.")
      return null
    } finally {
      setPending(false)
    }
  }

  async function saveDraft() {
    const submittedValues = { ...valuesRef.current }
    const payload = draftPayload(submittedValues)
    const path = revision ? `/api/admin/documents/${revision.id}` : "/api/admin/documents"
    const body = !revision && seriesId ? { ...payload, seriesId } : payload
    const saved = await requestMutation(path, revision ? "PATCH" : "POST", body, submittedValues)
    if (!saved) return
    setNotice(saved.newerEdits ? "Draft saved. Newer edits are not saved." : "Draft saved.")
    if (!revision && !saved.newerEdits) {
      await retireDirtyNavigationGuard()
      router.replace(`/admin/documents/${saved.revision.id}`)
    }
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
    if (action === "new-revision") router.replace(`/admin/documents/${updated.revision.id}`)
  }

  async function deleteDraft() {
    if (!revision || !window.confirm("Delete this draft permanently?")) return
    setPending(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(`/api/admin/documents/${revision.id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: "{}",
      })
      if (!response.ok) throw new Error("request failed")
      const payload = await response.json() as { ok?: boolean }
      if (payload.ok !== true) throw new Error("invalid response")
      await retireDirtyNavigationGuard()
      setDirty(false)
      router.replace("/admin/documents")
    } catch {
      setError("The document could not be updated. Please try again.")
    } finally {
      setPending(false)
    }
  }

  async function generateSummary() {
    if (!revision || dirty) return
    const submittedValues = { ...valuesRef.current }
    setPending(true)
    setSummaryPending(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(`/api/admin/documents/${revision.id}/summary`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      })
      if (!response.ok) throw new Error("request failed")
      const payload = await response.json() as {
        summary?: unknown
        remainingMonthlyBudget?: { remainingMicrousd?: unknown } | null
      }
      if (
        typeof payload.summary !== "string"
        || (payload.remainingMonthlyBudget !== null
          && typeof payload.remainingMonthlyBudget?.remainingMicrousd !== "number")
      ) throw new Error("invalid response")

      const newerEdits = !editorValuesEqual(valuesRef.current, submittedValues)
      setRevision((current) => current ? { ...current, summary: payload.summary as string } : current)
      if (!newerEdits) {
        const next = { ...valuesRef.current, summary: payload.summary }
        valuesRef.current = next
        setValues(next)
        setDirty(false)
      } else {
        setDirty(true)
      }
      if (payload.remainingMonthlyBudget === null) {
        setNotice(newerEdits
          ? "Summary generated and saved. Newer edits are not saved. Estimated monthly budget is temporarily unavailable."
          : "Summary generated and saved. Estimated monthly budget is temporarily unavailable.")
      } else {
        const remainingUsd = payload.remainingMonthlyBudget.remainingMicrousd as number / 1_000_000
        setNotice(newerEdits
          ? `Summary generated and saved. Newer edits are not saved. Estimated monthly budget remaining: $${remainingUsd.toFixed(3)}.`
          : `Summary generated and saved. Estimated monthly budget remaining: $${remainingUsd.toFixed(3)}.`)
      }
    } catch {
      setError("The summary could not be generated. Save the draft and try again.")
    } finally {
      setSummaryPending(false)
      setPending(false)
    }
  }

  const englishCreationLink = revision?.locale === "ko"
    ? `/admin/documents/new?seriesId=${revision.seriesId}&sourceRevisionId=${revision.id}`
    : null

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
        {revision.locale === "en" && revision.status === "scheduled" ? (
          <p className={styles.editorGuidance}>English publication requires a published Korean counterpart.</p>
        ) : null}
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
                revision.locale === "en"
                  ? "Publish this English document now? A published Korean counterpart is required."
                  : "Publish this document now?",
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
          {englishCreationLink ? <Link href={englishCreationLink}>Create English revision</Link> : null}
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
              <select disabled={englishSeriesFieldsLocked} value={values.kind} onChange={(event) => {
                const kind = event.target.value as DocumentKind
                const next = { ...valuesRef.current, kind, category: categoriesByKind[kind][0] }
                valuesRef.current = next
                setValues(next)
                setDirty(true)
              }}>
                <option value="notice">Notice</option>
                <option value="legal">Legal</option>
                <option value="disclosure">Disclosure</option>
                <option value="design">Design</option>
              </select>
            </label>
            <label>Locale
              <select disabled value={values.locale} onChange={(event) => update("locale", event.target.value as Locale)}>
                <option value={values.locale}>{values.locale === "ko" ? "Korean" : "English"}</option>
              </select>
            </label>
            <label>Slug
              <input disabled={englishSeriesFieldsLocked} required value={values.slug} onChange={(event) => update("slug", event.target.value)} />
            </label>
            <label>Category
              <select disabled={englishSeriesFieldsLocked} value={values.category} onChange={(event) => update("category", event.target.value)}>
                {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className={styles.checkboxField}>
              <input disabled={englishSeriesFieldsLocked} type="checkbox" checked={values.pinned} onChange={(event) => update("pinned", event.target.checked)} />
              Pinned
            </label>
            <label>Effective date
              <input type="date" value={values.effectiveAt} onChange={(event) => update("effectiveAt", event.target.value)} />
            </label>
          </div>
          <label>Title
            <input required maxLength={160} value={values.title} onChange={(event) => update("title", event.target.value)} />
          </label>
          <div>
            <label>Summary
              <input
                aria-describedby="summary-requirements"
                maxLength={240}
                value={values.summary}
                onChange={(event) => update("summary", event.target.value)}
              />
            </label>
            <p id="summary-requirements" className={styles.editorGuidance}>
              Required for publication · one line · 1–240 characters
            </p>
            {revision ? (
              <button
                aria-busy={summaryPending}
                disabled={pending || dirty}
                type="button"
                onClick={() => void generateSummary()}
              >
                {summaryPending ? "Generating…" : "Generate with AI"}
              </button>
            ) : null}
          </div>
          <label>Markdown body
            <textarea required maxLength={200_000} rows={24} value={values.bodyMarkdown} onChange={(event) => update("bodyMarkdown", event.target.value)} />
          </label>
          {error ? <p className={styles.formAlert} role="alert">{error}</p> : null}
          {notice ? <p className={styles.formNotice} role="status">{notice}</p> : null}
          {revision?.locale === "en" ? (
            <p className={styles.editorGuidance}>English publication requires a published Korean counterpart.</p>
          ) : null}
          {dirty && revision ? (
            <p className={styles.editorGuidance}>Save the draft before generating a summary, scheduling, or publishing.</p>
          ) : null}
          <div className={styles.editorActions}>
            <button disabled={pending} type="submit">Save draft</button>
            {revision ? (
              <>
                <label className={styles.scheduleField}>Schedule time
                  <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
                </label>
                <button disabled={pending || dirty || !scheduledAt} type="button" onClick={() => confirmedAction(
                  "Schedule this document for publication?",
                  "schedule",
                  { scheduledAt: new Date(scheduledAt).toISOString() },
                  "Document scheduled.",
                )}>Schedule</button>
                <button disabled={pending || dirty} type="button" onClick={() => confirmedAction(
                  revision.locale === "en"
                    ? "Publish this English document now? A published Korean counterpart is required."
                    : "Publish this document now?",
                  "publish",
                  {},
                  "Document published.",
                )}>Publish now</button>
                <button className={styles.dangerButton} disabled={pending} type="button" onClick={() => void deleteDraft()}>
                  Delete draft
                </button>
                {englishCreationLink ? <Link href={englishCreationLink}>Create English revision</Link> : null}
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
