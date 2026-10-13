"use client"

import { useRef, useState } from "react"

import styles from "@/app/admin/admin.module.css"
import { AdminPage, AdminPageHeader, AdminSection } from "@/components/admin/admin-page"
import { useLocale } from "@/components/i18n/locale-provider"
import { Alert } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Panel, PanelContent } from "@/components/ui/panel"
import { StatusLabel } from "@/components/ui/status-label"
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
  const [stateChangeCategory, setStateChangeCategory] = useState<DocumentCategorySnapshot | null>(null)
  const stateChangeTriggerRef = useRef<HTMLButtonElement | null>(null)

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
    <AdminPage className={styles.categoryWorkspace}>
      <AdminPageHeader
        breadcrumbs={(
          <Breadcrumb aria-label={t.breadcrumbLabel}>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/documents">{t.backToDocuments}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{t.heading}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )}
        description={t.description}
        title={t.heading}
      />

      <AdminSection
        aria-label={t.createHeading}
        description={t.createDescription}
        title={t.createHeading}
      >
        <Panel>
          <PanelContent className={styles.categoryCreateContent}>
            <form className={styles.categoryCreateForm} onSubmit={createCategory}>
              <Field>
                <FieldLabel>{t.kind}</FieldLabel>
                <NativeSelect
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
                </NativeSelect>
              </Field>
              <Field required>
                <FieldLabel>{t.slug}</FieldLabel>
                <Input
                  value={createDraft.slug}
                  onChange={(event) => setCreateDraft((current) => ({
                    ...current,
                    slug: event.target.value,
                  }))}
                  maxLength={40}
                  pattern="[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*"
                  autoComplete="off"
                  disabled={Boolean(pending)}
                />
              </Field>
              <Field required>
                <FieldLabel>{t.labelKo}</FieldLabel>
                <Input
                  value={createDraft.labelKo}
                  onChange={(event) => setCreateDraft((current) => ({
                    ...current,
                    labelKo: event.target.value,
                  }))}
                  maxLength={80}
                  autoComplete="off"
                  disabled={Boolean(pending)}
                />
              </Field>
              <Field required>
                <FieldLabel>{t.labelEn}</FieldLabel>
                <Input
                  value={createDraft.labelEn}
                  onChange={(event) => setCreateDraft((current) => ({
                    ...current,
                    labelEn: event.target.value,
                  }))}
                  maxLength={80}
                  autoComplete="off"
                  disabled={Boolean(pending)}
                />
              </Field>
              <Button type="submit" loading={pending === "create"} disabled={Boolean(pending)}>
                {pending === "create" ? t.creating : t.create}
              </Button>
            </form>
          </PanelContent>
        </Panel>
      </AdminSection>

      {error ? <Alert live title={error} variant="error" /> : null}
      {notice ? <p className={styles.formNotice} role="status">{notice}</p> : null}

      <AdminSection
        aria-label={t.collectionLabel}
        description={t.collectionDescription}
        title={t.collectionHeading}
      >
        <Panel>
          <PanelContent className={styles.categoryGroups}>
            {documentKinds.map((kind) => {
              const kindCategories = categories.filter((category) => category.kind === kind)
              const orderPending = pending === "reorder-" + kind
              return (
                <section className={styles.categoryGroup} key={kind}>
                  <header className={styles.categoryGroupHeading}>
                    <div>
                      <h3>{kindLabel(kind)}</h3>
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
                            <StatusLabel tone={category.active ? "success" : "neutral"}>
                              {category.active ? t.active : t.inactive}
                            </StatusLabel>
                          </div>
                          <div className={styles.categoryLabelFields}>
                            <Field required>
                              <FieldLabel>{t.labelKo}</FieldLabel>
                              <Input
                                aria-label={t.rowLabelKo(category.slug)}
                                value={draft.labelKo}
                                onChange={(event) => setDrafts((current) => ({
                                  ...current,
                                  [category.id]: { ...draft, labelKo: event.target.value },
                                }))}
                                maxLength={80}
                                disabled={isPending}
                              />
                            </Field>
                            <Field required>
                              <FieldLabel>{t.labelEn}</FieldLabel>
                              <Input
                                aria-label={t.rowLabelEn(category.slug)}
                                value={draft.labelEn}
                                onChange={(event) => setDrafts((current) => ({
                                  ...current,
                                  [category.id]: { ...draft, labelEn: event.target.value },
                                }))}
                                maxLength={80}
                                disabled={isPending}
                              />
                            </Field>
                          </div>
                          <ButtonGroup
                            className={styles.categoryRowActions}
                            label={t.rowActions(label)}
                          >
                            <Button
                              size="compact"
                              variant="outline"
                              aria-label={t.moveUp(label)}
                              onClick={() => moveCategory(category, -1)}
                              disabled={Boolean(pending) || index === 0}
                            >
                              {t.up}
                            </Button>
                            <Button
                              size="compact"
                              variant="outline"
                              aria-label={t.moveDown(label)}
                              onClick={() => moveCategory(category, 1)}
                              disabled={Boolean(pending) || index === kindCategories.length - 1}
                            >
                              {t.down}
                            </Button>
                            <Button
                              size="compact"
                              variant="secondary"
                              aria-label={t.saveCategory(label)}
                              onClick={() => saveCategory(category)}
                              disabled={Boolean(pending)}
                            >
                              {t.save}
                            </Button>
                            <Button
                              size="compact"
                              variant={category.active ? "danger" : "primary"}
                              aria-label={category.active ? t.deactivate(label) : t.activate(label)}
                              onClick={(event) => {
                                stateChangeTriggerRef.current = event.currentTarget
                                setStateChangeCategory(category)
                              }}
                              disabled={Boolean(pending)}
                            >
                              {category.active ? t.deactivateAction : t.activateAction}
                            </Button>
                          </ButtonGroup>
                        </li>
                      )
                    })}
                  </ol>
                </section>
              )
            })}
          </PanelContent>
        </Panel>
      </AdminSection>

      <AlertDialog
        open={Boolean(stateChangeCategory)}
        onOpenChange={(open) => {
          if (!open) setStateChangeCategory(null)
        }}
      >
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            stateChangeTriggerRef.current?.focus()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {stateChangeCategory
                ? stateChangeCategory.active
                  ? t.confirmations.deactivate(visibleLabel(stateChangeCategory))
                  : t.confirmations.activate(visibleLabel(stateChangeCategory))
                : ""}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogBody>
            <AlertDialogDescription>{t.stateChangeDescription}</AlertDialogDescription>
          </AlertDialogBody>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant={stateChangeCategory?.active ? "destructive" : "primary"}
              onClick={() => {
                if (stateChangeCategory) void toggleCategory(stateChangeCategory)
              }}
            >
              {stateChangeCategory?.active ? t.deactivateAction : t.activateAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  )
}
