"use client"

import Link from "next/link"
import { MagnifyingGlass, X } from "@phosphor-icons/react"
import { useCallback, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import styles from "@/app/admin/admin.module.css"
import { useLocale } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { EmptyState } from "@/components/ui/empty-state"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
} from "@/components/ui/pagination"
import { Panel, PanelContent, PanelFooter } from "@/components/ui/panel"
import { StatusLabel } from "@/components/ui/status-label"
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
const statusVariants = {
  draft: "neutral",
  scheduled: "warning",
  published: "success",
  archived: "neutral",
} as const

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
  const router = useRouter()
  const localePreference = useLocale()
  const t = adminCopy[localePreference].documents
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(initialFilters.search ?? "")
  const [kind, setKind] = useState(initialFilters.kind ?? "")
  const [status, setStatus] = useState(initialFilters.status ?? "")
  const [locale, setLocale] = useState(initialFilters.locale ?? "")

  const pageHref = useCallback((
    filters: NonNullable<DocumentListProps["initialFilters"]>,
    cursor?: string,
  ): string => {
    const query = new URLSearchParams()
    if (filters.search) query.set("search", filters.search)
    if (filters.kind) query.set("kind", filters.kind)
    if (filters.status) query.set("status", filters.status)
    if (filters.locale) query.set("locale", filters.locale)
    query.set("limit", String(limit))
    if (cursor) query.set("cursor", cursor)
    return `/admin/documents?${query.toString()}`
  }, [limit])

  const replaceFilters = useCallback((filters: NonNullable<DocumentListProps["initialFilters"]>) => {
    startTransition(() => router.replace(pageHref(filters)))
  }, [pageHref, router])

  useEffect(() => {
    const boundedSearch = search.trim()
    if (boundedSearch === (initialFilters.search ?? "")) return
    const timeout = window.setTimeout(() => {
      replaceFilters({
        search: boundedSearch || undefined,
        kind: kind || undefined,
        status: status || undefined,
        locale: locale || undefined,
      })
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [initialFilters.search, kind, locale, replaceFilters, search, status])

  const hasActiveFilters = Boolean(search.trim() || kind || status || locale)
  const clearFilters = () => {
    setSearch("")
    setKind("")
    setStatus("")
    setLocale("")
    replaceFilters({})
  }

  return (
    <div className={styles.documentListWorkspace}>
      <div className={styles.documentFilters} data-recipe="search-filter-field">
        <Field className={styles.documentFilterField}>
          <FieldLabel>{t.search}</FieldLabel>
          <InputGroup>
            <InputGroupAddon placement="inline-start">
              <MagnifyingGlass aria-hidden size={17} weight="bold" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              maxLength={160}
              value={search}
              onChange={(event) => setSearch(event.target.value.slice(0, 160))}
            />
            {search ? (
              <InputGroupAddon placement="inline-end">
                <InputGroupButton aria-label={t.clearSearch} onClick={() => setSearch("")} size="icon">
                  <X aria-hidden size={16} weight="bold" />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </Field>
        <Field className={styles.documentFilterField}>
          <FieldLabel>{t.kindFilter}</FieldLabel>
          <Combobox
            aria-label={t.kindFilter}
            emptyText={t.noFilterOptions}
            options={[
              { value: "", label: t.allKinds },
              { value: "notice", label: t.notice },
              { value: "legal", label: t.legal },
              { value: "disclosure", label: t.disclosure },
            ]}
            value={kind}
            onValueCommit={(nextKind) => {
              setKind(nextKind)
              replaceFilters({
                search: search.trim() || undefined,
                kind: nextKind || undefined,
                status: status || undefined,
                locale: locale || undefined,
              })
            }}
          />
        </Field>
        <Field className={styles.documentFilterField}>
          <FieldLabel>{t.statusFilter}</FieldLabel>
          <Combobox
            aria-label={t.statusFilter}
            emptyText={t.noFilterOptions}
            options={[
              { value: "", label: t.allStatuses },
              { value: "draft", label: t.draft },
              { value: "scheduled", label: t.scheduled },
              { value: "published", label: t.published },
              { value: "archived", label: t.archived },
            ]}
            value={status}
            onValueCommit={(nextStatus) => {
              setStatus(nextStatus)
              replaceFilters({
                search: search.trim() || undefined,
                kind: kind || undefined,
                status: nextStatus || undefined,
                locale: locale || undefined,
              })
            }}
          />
        </Field>
        <Field className={styles.documentFilterField}>
          <FieldLabel>{t.localeFilter}</FieldLabel>
          <Combobox
            aria-label={t.localeFilter}
            emptyText={t.noFilterOptions}
            options={[
              { value: "", label: t.allLocales },
              { value: "ko", label: t.korean },
              { value: "en", label: t.english },
            ]}
            value={locale}
            onValueCommit={(nextLocale) => {
              setLocale(nextLocale)
              replaceFilters({
                search: search.trim() || undefined,
                kind: kind || undefined,
                status: status || undefined,
                locale: nextLocale || undefined,
              })
            }}
          />
        </Field>
      </div>
      <Panel
        aria-label={t.collectionLabel}
        className={styles.documentCollection}
        data-recipe="collection-state-surface"
      >
        <div className={styles.documentListMeta}>
          <p aria-live="polite">{t.resultsCount(rows.length)}</p>
          {hasActiveFilters && rows.length > 0 ? (
            <Button size="compact" variant="secondary" onClick={clearFilters}>
              {t.clearFilters}
            </Button>
          ) : null}
        </div>
        <PanelContent className={styles.documentCollectionContent} aria-busy={isPending}>
          {rows.length === 0 ? (
            <EmptyState
              aria-label={hasActiveFilters ? t.noMatchingDocuments : t.noDocumentsYet}
              className={styles.documentEmpty}
              title={hasActiveFilters ? t.noMatchingDocuments : t.noDocumentsYet}
              description={hasActiveFilters ? t.noMatchingDocumentsDescription : t.firstDocumentDescription}
              action={hasActiveFilters ? (
                <Button size="compact" variant="secondary" onClick={clearFilters}>
                  {t.clearFilters}
                </Button>
              ) : undefined}
            />
          ) : (
            <ul className={styles.documentList}>
              {rows.map((revision) => (
                <Item as="li" className={styles.documentListItem} key={revision.id}>
                  <ItemContent>
                    <ItemHeader>
                      <ItemTitle className={styles.documentListTitle}>
                        <Link
                          aria-label={`${revision.title} ${t[revision.status]}`}
                          href={`/admin/documents/${revision.id}`}
                        >
                          {revision.title}
                        </Link>
                      </ItemTitle>
                      <ItemActions>
                        <StatusLabel variant={statusVariants[revision.status]}>{t[revision.status]}</StatusLabel>
                      </ItemActions>
                    </ItemHeader>
                    <ItemDescription>
                      {t[revision.kind]} / {displayDocumentLocale(revision.locale, localePreference)} / r{revision.revision}
                    </ItemDescription>
                    <ItemFooter className={styles.documentListFooter}>
                      <span>{t.by} {revision.publisher}</span>
                      <span>{t[revision.dateLabel === "Scheduled" ? "scheduledAt" : revision.dateLabel === "Published" ? "publishedAt" : "updatedAt"]} {formatDocumentDate(revision.relevantAt, localePreference)}</span>
                    </ItemFooter>
                  </ItemContent>
                </Item>
              ))}
            </ul>
          )}
        </PanelContent>
        {nextCursor ? (
          <PanelFooter className={styles.documentCollectionFooter}>
            <Pagination aria-label={t.paginationLabel}>
              <PaginationContent>
                <PaginationItem>
                  <PaginationNext href={pageHref(initialFilters, nextCursor)} label={t.nextPage}>
                    {t.nextPage}
                  </PaginationNext>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </PanelFooter>
        ) : null}
      </Panel>
    </div>
  )
}
