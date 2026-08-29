"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import styles from "@/app/admin/admin.module.css"
import { DocumentPreview } from "@/components/admin/document-preview"
import { useDirtyNavigationGuard } from "@/components/admin/use-dirty-navigation-guard"
import { useLocale } from "@/components/i18n/locale-provider"
import { adminCopy, type AdminCopy } from "@/lib/admin/i18n"
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

function displayDate(
  locale: Locale,
  empty: string,
  value: Date | string | null,
): string {
  if (!value) return empty
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return empty
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
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

function mutationErrorMessage(
  t: AdminCopy["documents"]["editor"]["errors"],
  path: string,
  payload: unknown,
): string {
  if (!payload || typeof payload !== "object") {
    return t.generic
  }

  const error = "error" in payload ? payload.error : null
  const fields = "fields" in payload && Array.isArray(payload.fields)
    ? payload.fields.filter((field): field is string => typeof field === "string")
    : []
  const isPublish = path.endsWith("/publish")

  if (error === "incomplete_document") {
    if (fields.includes("summary")) {
      return t.incompleteSummary(isPublish)
    }
    if (fields.includes("bodyMarkdown")) {
      return t.incompleteMarkdown(isPublish)
    }
    return t.incompleteDocument
  }
  if (error === "provider_unavailable") {
    return t.providerUnavailable
  }
  if (error === "monthly_limit") {
    return t.monthlyLimit
  }
  if (error === "archive_dependency") {
    return t.archiveDependency
  }
  if (error === "revision_changed") {
    return t.revisionChanged
  }
  if (error === "invalid_state") {
    return path.endsWith("/archive") ? t.invalidArchiveState : t.invalidDeleteState
  }
  if (error === "confirmation_mismatch") {
    return t.confirmationMismatch
  }
  if (error === "delete_dependency") {
    return t.deleteDependency
  }
  return t.generic
}

export function DocumentEditor({ revision: initialRevision, seriesId, templateRevision }: DocumentEditorProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = adminCopy[locale].documents.editor
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
  const errorRef = useRef<HTMLParagraphElement>(null)

  const discardChanges = useCallback(() => setDirty(false), [])
  const retireDirtyNavigationGuard = useDirtyNavigationGuard(dirty, discardChanges, t.dirtyNavigation)

  const categoryOptions = useMemo(() => categoriesByKind[values.kind], [values.kind])
  const editable = !revision || revision.status === "draft"
  const englishSeriesFieldsLocked = values.locale === "en"

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

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
        setError(mutationErrorMessage(t.errors, path, payload))
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
      setError(t.errors.generic)
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
    setNotice(saved.newerEdits ? t.notices.draftSavedWithNewerEdits : t.notices.draftSaved)
    if (!revision && !saved.newerEdits) {
      await retireDirtyNavigationGuard()
      router.replace(`/admin/documents/${saved.revision.id}`)
    }
  }

  async function confirmedAction(
    label: string,
    action: string,
    body: unknown = {},
    success = t.notices.documentUpdated,
  ) {
    if (!revision || !window.confirm(label)) return
    const updated = await requestMutation(`/api/admin/documents/${revision.id}/${action}`, "POST", body)
    if (!updated) return
    setNotice(success)
    if (action === "new-revision") router.replace(`/admin/documents/${updated.revision.id}`)
  }

  async function deleteDraft() {
    if (!revision || !window.confirm(t.confirmations.deleteDraft)) return
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
      setError(t.errors.generic)
    } finally {
      setPending(false)
    }
  }

  async function deleteArchived() {
    if (!revision) return
    const confirmation = window.prompt(t.confirmations.deleteArchived, "")
    if (confirmation === null) return
    const path = `/api/admin/documents/${revision.id}`
    setPending(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(path, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ permanent: true, confirmation }),
      })
      const payload = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null
      if (!response.ok) {
        setError(mutationErrorMessage(t.errors, path, payload))
        return
      }
      if (payload?.ok !== true) throw new Error("invalid response")
      await retireDirtyNavigationGuard()
      setDirty(false)
      router.replace("/admin/documents")
    } catch {
      setError(t.errors.generic)
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
        setNotice(t.notices.summaryGeneratedWithoutBudget(newerEdits))
      } else {
        const remainingUsd = payload.remainingMonthlyBudget.remainingMicrousd as number / 1_000_000
        setNotice(t.notices.summaryGeneratedWithBudget(newerEdits, remainingUsd.toFixed(3)))
      }
    } catch {
      setError(t.errors.summaryFailure)
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
          <p className={styles.eyebrow}>
            {adminCopy[locale].documents[revision.kind]} / {revision.locale === "ko"
              ? adminCopy[locale].documents.korean
              : adminCopy[locale].documents.english} / {t.revision} {revision.revision}
          </p>
          <h1 id="document-title">{revision.title}</h1>
          <dl>
            <div><dt>{t.status}</dt><dd>{adminCopy[locale].documents[revision.status]}</dd></div>
            <div><dt>{t.slug}</dt><dd>{revision.slug}</dd></div>
            <div><dt>{t.scheduled}</dt><dd>{displayDate(locale, t.noDate, revision.scheduledAt)}</dd></div>
            <div><dt>{t.published}</dt><dd>{displayDate(locale, t.noDate, revision.publishedAt)}</dd></div>
          </dl>
        </div>
        <div className={styles.immutablePreview}>
          <DocumentPreview title={revision.title} source={revision.bodyMarkdown} />
        </div>
        {revision.locale === "en" && revision.status === "scheduled" ? (
          <p className={styles.editorGuidance}>{t.englishPublicationGuidance}</p>
        ) : null}
        {error ? <p ref={errorRef} className={styles.formAlert} role="alert" tabIndex={-1}>{error}</p> : null}
        {notice ? <p className={styles.formNotice} role="status">{notice}</p> : null}
        <div className={styles.editorActions}>
          {revision.status === "scheduled" ? (
            <>
              <button disabled={pending} type="button" onClick={() => confirmedAction(
                t.confirmations.unschedule,
                "unschedule",
                {},
                t.notices.scheduleRemoved,
              )}>{t.returnToDraft}</button>
              <button disabled={pending} type="button" onClick={() => confirmedAction(
                revision.locale === "en"
                  ? t.confirmations.publishEnglish
                  : t.confirmations.publish,
                "publish",
                {},
                t.notices.documentPublished,
              )}>{t.publishNow}</button>
            </>
          ) : null}
          {revision.status === "published" ? (
            <button disabled={pending} type="button" onClick={() => confirmedAction(
              t.confirmations.archive,
              "archive",
              {},
              t.notices.documentArchived,
            )}>{t.archive}</button>
          ) : null}
          {revision.status === "published" || revision.status === "archived" ? (
            <button disabled={pending} type="button" onClick={() => confirmedAction(
              t.confirmations.createRevision,
              "new-revision",
              {},
              t.notices.revisionCreated,
            )}>{t.createRevision}</button>
          ) : null}
          {revision.status === "archived" ? (
            <button
              className={styles.dangerButton}
              disabled={pending}
              type="button"
              onClick={() => void deleteArchived()}
            >{t.deletePermanently}</button>
          ) : null}
          {englishCreationLink ? <Link href={englishCreationLink}>{t.createEnglishRevision}</Link> : null}
        </div>
      </section>
    )
  }

  return (
    <section className={styles.editor} aria-label={revision ? t.editDocument : t.createDocument}>
      <div className={styles.editorTabs} role="tablist" aria-label={t.workspace}>
        <button
          type="button"
          role="tab"
          id="source-tab"
          aria-controls="source-panel"
          aria-selected={activeTab === "source"}
          onClick={() => setActiveTab("source")}
        >{t.source}</button>
        <button
          type="button"
          role="tab"
          id="preview-tab"
          aria-controls="preview-panel"
          aria-selected={activeTab === "preview"}
          onClick={() => setActiveTab("preview")}
        >{t.preview}</button>
      </div>
      <div className={styles.editorGrid}>
        <form
          id="source-panel"
          className={styles.editorSource}
          role="tabpanel"
          aria-labelledby="source-tab"
          aria-label={t.source}
          data-active={activeTab === "source"}
          onSubmit={(event) => { event.preventDefault(); void saveDraft() }}
        >
          <div className={styles.editorFieldGrid}>
            <label>{t.kind}
              <select disabled={englishSeriesFieldsLocked} value={values.kind} onChange={(event) => {
                const kind = event.target.value as DocumentKind
                const next = { ...valuesRef.current, kind, category: categoriesByKind[kind][0] }
                valuesRef.current = next
                setValues(next)
                setDirty(true)
              }}>
                <option value="notice">{adminCopy[locale].documents.notice}</option>
                <option value="legal">{adminCopy[locale].documents.legal}</option>
                <option value="disclosure">{adminCopy[locale].documents.disclosure}</option>
              </select>
            </label>
            <label>{t.locale}
              <select disabled value={values.locale} onChange={(event) => update("locale", event.target.value as Locale)}>
                <option value={values.locale}>{values.locale === "ko" ? adminCopy[locale].documents.korean : adminCopy[locale].documents.english}</option>
              </select>
            </label>
            <label>{t.slug}
              <input disabled={englishSeriesFieldsLocked} required value={values.slug} onChange={(event) => update("slug", event.target.value)} />
            </label>
            <label>{t.category}
              <select disabled={englishSeriesFieldsLocked} value={values.category} onChange={(event) => update("category", event.target.value)}>
                {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className={styles.checkboxField}>
              <input disabled={englishSeriesFieldsLocked} type="checkbox" checked={values.pinned} onChange={(event) => update("pinned", event.target.checked)} />
              {t.pinned}
            </label>
            <label>{t.effectiveDate}
              <input type="date" value={values.effectiveAt} onChange={(event) => update("effectiveAt", event.target.value)} />
            </label>
          </div>
          <label>{t.title}
            <input required maxLength={160} value={values.title} onChange={(event) => update("title", event.target.value)} />
          </label>
          <div>
            <label>{t.summary}
              <input
                aria-describedby="summary-requirements"
                maxLength={240}
                value={values.summary}
                onChange={(event) => update("summary", event.target.value)}
              />
            </label>
            <p id="summary-requirements" className={styles.editorGuidance}>
              {t.summaryRequirements}
            </p>
            {revision ? (
              <button
                aria-busy={summaryPending}
                disabled={pending || dirty}
                type="button"
                onClick={() => void generateSummary()}
              >
                {summaryPending ? t.generatingSummary : t.generateSummary}
              </button>
            ) : null}
          </div>
          <div className={styles.markdownField}>
            <div className={styles.markdownFieldHeader}>
              <label htmlFor="document-markdown-body">{t.markdownBody}</label>
              <Link
                href="/admin/documents/markdown-guide"
                target="_blank"
                rel="noreferrer"
                aria-label={t.markdownGuide}
              >{t.writingGuide}</Link>
            </div>
            <textarea
              id="document-markdown-body"
              required
              maxLength={200_000}
              rows={24}
              value={values.bodyMarkdown}
              onChange={(event) => update("bodyMarkdown", event.target.value)}
            />
          </div>
          {error ? <p ref={errorRef} className={styles.formAlert} role="alert" tabIndex={-1}>{error}</p> : null}
          {notice ? <p className={styles.formNotice} role="status">{notice}</p> : null}
          {revision?.locale === "en" ? (
            <p className={styles.editorGuidance}>{t.englishPublicationGuidance}</p>
          ) : null}
          {dirty && revision ? (
            <p className={styles.editorGuidance}>{t.dirtyGuidance}</p>
          ) : null}
          <div className={styles.editorActions}>
            <button disabled={pending} type="submit">{t.saveDraft}</button>
            {revision ? (
              <>
                <label className={styles.scheduleField}>{t.scheduleTime}
                  <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
                </label>
                <button disabled={pending || dirty || !scheduledAt} type="button" onClick={() => confirmedAction(
                  t.confirmations.schedule,
                  "schedule",
                  { scheduledAt: new Date(scheduledAt).toISOString() },
                  t.notices.documentScheduled,
                )}>{t.schedule}</button>
                <button disabled={pending || dirty} type="button" onClick={() => confirmedAction(
                  revision.locale === "en"
                    ? t.confirmations.publishEnglish
                    : t.confirmations.publish,
                  "publish",
                  {},
                  t.notices.documentPublished,
                )}>{t.publishNow}</button>
                <button className={styles.dangerButton} disabled={pending} type="button" onClick={() => void deleteDraft()}>
                  {t.deleteDraft}
                </button>
                {englishCreationLink ? <Link href={englishCreationLink}>{t.createEnglishRevision}</Link> : null}
              </>
            ) : null}
          </div>
        </form>
        <div
          id="preview-panel"
          className={styles.editorPreview}
          role="tabpanel"
          aria-labelledby="preview-tab"
          aria-label={t.preview}
          data-active={activeTab === "preview"}
        >
          <DocumentPreview title={values.title} source={values.bodyMarkdown} />
        </div>
      </div>
    </section>
  )
}
