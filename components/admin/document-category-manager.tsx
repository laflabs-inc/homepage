"use client"

import Link from "next/link"
import { useState } from "react"

import styles from "@/app/admin/admin.module.css"
import { useLocale } from "@/components/i18n/locale-provider"
import { adminCopy, type AdminCopy } from "@/lib/admin/i18n"
import type { DocumentCategorySnapshot } from "@/lib/document-categories/types"
import { documentKinds, type DocumentKind } from "@/lib/documents/types"

type CategoryDraft = {
  labelKo: string
  labelEn: string
}

type CreateDraft = {
  kind: DocumentKind
  slug: string
  labelKo: string
  labelEn: string
}

type CategoryPayload = {
  category?: DocumentCategorySnapshot
  categories?: DocumentCategorySnapshot[]
  error?: string
}

function sortCategories(categories: DocumentCategorySnapshot[]) {
  return [...categories].sort((left, right) => (
    documentKinds.indexOf(left.kind) - documentKinds.indexOf(right.kind)
    || left.sortOrder - right.sortOrder
    || left.slug.localeCompare(right.slug)
  ))
}

function draftsFrom(categories: DocumentCategorySnapshot[]): Record<string, CategoryDraft> {
  return Object.fromEntries(categories.map((category) => [
    category.id,
    { labelKo: category.labelKo, labelEn: category.labelEn },
  ]))
}

function categoryError(
  copy: AdminCopy["documents"]["categoryManager"],
  code: string | undefined,
): string {
  if (code === "slug_conflict") return copy.errors.slugConflict
  if (code === "invalid_category") return copy.errors.invalid
  if (code === "unavailable") return copy.errors.unavailable
  return copy.errors.generic
}

export function DocumentCategoryManager({
  initialCategories,
}: {
  initialCategories: DocumentCategorySnapshot[]
}) {
  const locale = useLocale()
  const t = adminCopy[locale].documents.categoryManager
  const documents = adminCopy[locale].documents
  const [categories, setCategories] = useState(() => sortCategories(initialCategories))
  const [drafts, setDrafts] = useState(() => draftsFrom(initialCategories))
  const [createDraft, setCreateDraft] = useState<CreateDraft>({
    kind: "notice",
    slug: "",
    labelKo: "",
    labelEn: "",
  })
  const [pending, setPending] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  const kindLabel = (kind: DocumentKind) => (
    kind === "notice" ? documents.notice : kind === "legal" ? documents.legal : documents.disclosure
  )
  const visibleLabel = (category: DocumentCategorySnapshot) => (
    locale === "ko" ? category.labelKo : category.labelEn
  )

  const applyCategories = (next: DocumentCategorySnapshot[]) => {
    const sorted = sortCategories(next)
    setCategories(sorted)
    setDrafts(draftsFrom(sorted))
  }

  const refreshAfterConflict = async () => {
    try {
      const response = await fetch("/api/admin/document-categories", { cache: "no-store" })
      const payload = await response.json() as CategoryPayload
      if (!response.ok || !payload.categories) throw new Error("refresh_failed")
      applyCategories(payload.categories)
      setNotice(t.conflict)
    } catch {
      setError(t.errors.refresh)
    }
  }

  const patchCategory = async (
    category: DocumentCategorySnapshot,
    change: Partial<Pick<DocumentCategorySnapshot, "labelKo" | "labelEn" | "active">>,
    successMessage: string,
  ) => {
    setPending(category.id)
    setNotice("")
    setError("")
    const draft = drafts[category.id] ?? {
      labelKo: category.labelKo,
      labelEn: category.labelEn,
    }

    try {
      const response = await fetch("/api/admin/document-categories/" + category.id, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          labelKo: change.labelKo ?? draft.labelKo,
          labelEn: change.labelEn ?? draft.labelEn,
          sortOrder: category.sortOrder,
          active: change.active ?? category.active,
          version: category.version,
        }),
      })
      const payload = await response.json() as CategoryPayload
      if (response.status === 409 && payload.error === "version_conflict") {
        await refreshAfterConflict()
        return
      }
      if (!response.ok || !payload.category) {
        setError(categoryError(t, payload.error))
        return
      }
      const next = categories.map((candidate) => (
        candidate.id === category.id ? payload.category! : candidate
      ))
      applyCategories(next)
      setNotice(successMessage)
    } catch {
      setError(t.errors.generic)
    } finally {
      setPending("")
    }
  }

  const saveCategory = async (category: DocumentCategorySnapshot) => {
    const draft = drafts[category.id]
    if (!draft) return
    await patchCategory(category, draft, t.saved)
  }

  const toggleCategory = async (category: DocumentCategorySnapshot) => {
    const nextActive = !category.active
    const label = visibleLabel(category)
    const confirmation = nextActive
      ? t.confirmations.activate(label)
      : t.confirmations.deactivate(label)
    if (!window.confirm(confirmation)) return
    await patchCategory(category, { active: nextActive }, nextActive ? t.activated : t.deactivated)
  }

  const createCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const slug = createDraft.slug.trim().toLowerCase()
    const labelKo = createDraft.labelKo.trim()
    const labelEn = createDraft.labelEn.trim()
    const sortOrder = categories
      .filter(({ kind }) => kind === createDraft.kind)
      .reduce((highest, category) => Math.max(highest, category.sortOrder + 1), 0)

    setPending("create")
    setNotice("")
    setError("")
    try {
      const response = await fetch("/api/admin/document-categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: createDraft.kind,
          slug,
          labelKo,
          labelEn,
          sortOrder,
        }),
      })
      const payload = await response.json() as CategoryPayload
      if (!response.ok || !payload.category) {
        setError(categoryError(t, payload.error))
        return
      }
      applyCategories([...categories, payload.category])
      setCreateDraft((current) => ({ ...current, slug: "", labelKo: "", labelEn: "" }))
      setNotice(t.created)
    } catch {
      setError(t.errors.generic)
    } finally {
      setPending("")
    }
  }

  const moveCategory = async (category: DocumentCategorySnapshot, offset: -1 | 1) => {
    const ordered = categories.filter(({ kind }) => kind === category.kind)
    const currentIndex = ordered.findIndex(({ id }) => id === category.id)
    const nextIndex = currentIndex + offset
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= ordered.length) return
    const nextOrder = [...ordered]
    ;[nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]]

    setPending("reorder-" + category.kind)
    setNotice("")
    setError("")
    try {
      const response = await fetch("/api/admin/document-categories/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: category.kind,
          items: nextOrder.map(({ id, version }) => ({ id, version })),
        }),
      })
      const payload = await response.json() as CategoryPayload
      if (response.status === 409
        && (payload.error === "version_conflict" || payload.error === "category_set_changed")) {
        await refreshAfterConflict()
        return
      }
      if (!response.ok || !payload.categories) {
        setError(categoryError(t, payload.error))
        return
      }
      applyCategories([
        ...categories.filter(({ kind }) => kind !== category.kind),
        ...payload.categories,
      ])
      setNotice(t.reordered)
    } catch {
      setError(t.errors.generic)
    } finally {
      setPending("")
    }
  }

  return (
    <section className={styles.categoryWorkspace}>
      <header className={styles.categoryHeading}>
        <div>
          <h1>{t.heading}</h1>
          <p>{t.description}</p>
        </div>
        <Link className={styles.secondaryLink} href="/admin/documents">{t.backToDocuments}</Link>
      </header>

      <section className={styles.categoryCreatePanel} aria-labelledby="category-create-heading">
        <div className={styles.categorySectionIntro}>
          <h2 id="category-create-heading">{t.createHeading}</h2>
          <p>{t.createDescription}</p>
        </div>
        <form className={styles.categoryCreateForm} onSubmit={createCategory}>
          <label>
            <span>{t.kind}</span>
            <select
              value={createDraft.kind}
              onChange={(event) => setCreateDraft((current) => ({
                ...current,
                kind: event.target.value as DocumentKind,
              }))}
              disabled={Boolean(pending)}
            >
              {documentKinds.map((kind) => (
                <option value={kind} key={kind}>{kindLabel(kind)}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{t.slug}</span>
            <input
              value={createDraft.slug}
              onChange={(event) => setCreateDraft((current) => ({
                ...current,
                slug: event.target.value,
              }))}
              maxLength={40}
              pattern="[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*"
              autoComplete="off"
              required
              disabled={Boolean(pending)}
            />
          </label>
          <label>
            <span>{t.labelKo}</span>
            <input
              value={createDraft.labelKo}
              onChange={(event) => setCreateDraft((current) => ({
                ...current,
                labelKo: event.target.value,
              }))}
              maxLength={80}
              autoComplete="off"
              required
              disabled={Boolean(pending)}
            />
          </label>
          <label>
            <span>{t.labelEn}</span>
            <input
              value={createDraft.labelEn}
              onChange={(event) => setCreateDraft((current) => ({
                ...current,
                labelEn: event.target.value,
              }))}
              maxLength={80}
              autoComplete="off"
              required
              disabled={Boolean(pending)}
            />
          </label>
          <button type="submit" disabled={Boolean(pending)}>
            {pending === "create" ? t.creating : t.create}
          </button>
        </form>
      </section>

      {error ? <p className={styles.formAlert} role="alert">{error}</p> : null}
      {notice ? <p className={styles.formNotice} role="status">{notice}</p> : null}

      <div className={styles.categoryGroups}>
        {documentKinds.map((kind) => {
          const kindCategories = categories.filter((category) => category.kind === kind)
          const orderPending = pending === "reorder-" + kind
          return (
            <section className={styles.categoryGroup} key={kind}>
              <header className={styles.categoryGroupHeading}>
                <div>
                  <h2>{kindLabel(kind)}</h2>
                  <p>{t.kindDescription(kindLabel(kind))}</p>
                </div>
                <span>{t.categoryCount(kindCategories.length)}</span>
              </header>
              <ol
                className={styles.categoryList}
                aria-label={t.orderList(kindLabel(kind))}
              >
                {kindCategories.length === 0 ? (
                  <li className={styles.categoryEmpty}>{t.emptyKind}</li>
                ) : kindCategories.map((category, index) => {
                  const draft = drafts[category.id] ?? {
                    labelKo: category.labelKo,
                    labelEn: category.labelEn,
                  }
                  const label = visibleLabel(category)
                  const isPending = pending === category.id || orderPending
                  return (
                    <li
                      className={styles.categoryRow}
                      data-inactive={String(!category.active)}
                      key={category.id}
                    >
                      <div className={styles.categoryIdentity}>
                        <code>{category.slug}</code>
                        <span>{category.active ? t.active : t.inactive}</span>
                      </div>
                      <div className={styles.categoryLabelFields}>
                        <label>
                          <span>{t.labelKo}</span>
                          <input
                            aria-label={t.rowLabelKo(category.slug)}
                            value={draft.labelKo}
                            onChange={(event) => setDrafts((current) => ({
                              ...current,
                              [category.id]: { ...draft, labelKo: event.target.value },
                            }))}
                            maxLength={80}
                            required
                            disabled={isPending}
                          />
                        </label>
                        <label>
                          <span>{t.labelEn}</span>
                          <input
                            aria-label={t.rowLabelEn(category.slug)}
                            value={draft.labelEn}
                            onChange={(event) => setDrafts((current) => ({
                              ...current,
                              [category.id]: { ...draft, labelEn: event.target.value },
                            }))}
                            maxLength={80}
                            required
                            disabled={isPending}
                          />
                        </label>
                      </div>
                      <div className={styles.categoryRowActions}>
                        <button
                          type="button"
                          aria-label={t.moveUp(label)}
                          onClick={() => moveCategory(category, -1)}
                          disabled={Boolean(pending) || index === 0}
                        >
                          {t.up}
                        </button>
                        <button
                          type="button"
                          aria-label={t.moveDown(label)}
                          onClick={() => moveCategory(category, 1)}
                          disabled={Boolean(pending) || index === kindCategories.length - 1}
                        >
                          {t.down}
                        </button>
                        <button
                          type="button"
                          aria-label={t.saveCategory(label)}
                          onClick={() => saveCategory(category)}
                          disabled={Boolean(pending)}
                        >
                          {t.save}
                        </button>
                        <button
                          className={styles.categoryStateButton}
                          type="button"
                          aria-label={category.active ? t.deactivate(label) : t.activate(label)}
                          onClick={() => toggleCategory(category)}
                          disabled={Boolean(pending)}
                        >
                          {category.active ? t.deactivateAction : t.activateAction}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
      </div>
    </section>
  )
}
