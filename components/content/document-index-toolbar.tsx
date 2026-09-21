"use client"

import { useState, useTransition, type FormEvent } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { documentCategoryCopy } from "@/lib/content"
import type { DocumentCategorySnapshot } from "@/lib/document-categories/types"
import type { DocumentKind, Locale } from "@/lib/documents/types"
import styles from "./content.module.css"

type DocumentIndexToolbarProps = {
  kind: DocumentKind
  locale: Locale
  categories: DocumentCategorySnapshot[]
  category?: string
  sort: "latest" | "oldest"
  q?: string
}

function boundedSearch(value: string) {
  return Array.from(value).slice(0, 100).join("")
}

export function DocumentIndexToolbar({
  kind,
  locale,
  categories,
  category,
  sort,
  q,
}: DocumentIndexToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const copy = documentCategoryCopy[locale]
  const [search, setSearch] = useState(q ?? "")
  const [isPending, startTransition] = useTransition()
  const selectedInactive = category
    ? categories.find((candidate) => candidate.slug === category && !candidate.active)
    : undefined
  const visibleCategories = categories.filter((candidate) => candidate.active)
  const hasFilters = Boolean(category || q || sort === "oldest")

  function navigate(update: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString())
    update(params)
    params.delete("cursor")
    const query = params.toString()
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }))
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = search.trim()
    navigate((params) => {
      if (value) params.set("q", value)
      else params.delete("q")
    })
  }

  return (
    <div className={styles.discoveryToolbar} role="group" aria-label={copy.toolbarLabel} aria-busy={isPending}>
      <div className={styles.discoverySelects}>
        <Field className={styles.discoveryControl}>
          <FieldLabel>{copy.categoryLabel}</FieldLabel>
          <NativeSelect
            name="category"
            value={category ?? ""}
            onChange={(event) => navigate((params) => {
              if (event.target.value) params.set("category", event.target.value)
              else params.delete("category")
            })}
          >
            <option value="">{copy.all}</option>
            {visibleCategories.map((candidate) => (
              <option key={candidate.id} value={candidate.slug}>
                {locale === "ko" ? candidate.labelKo : candidate.labelEn}
              </option>
            ))}
            {selectedInactive ? (
              <option value={selectedInactive.slug} disabled>
                {locale === "ko" ? selectedInactive.labelKo : selectedInactive.labelEn}
              </option>
            ) : null}
          </NativeSelect>
        </Field>

        <Field className={styles.discoveryControl}>
          <FieldLabel>{copy.sortLabel}</FieldLabel>
          <NativeSelect
            name="sort"
            value={sort}
            onChange={(event) => navigate((params) => {
              if (event.target.value === "oldest") params.set("sort", "oldest")
              else params.delete("sort")
            })}
          >
            <option value="latest">{copy.latest}</option>
            <option value="oldest">{copy.oldest}</option>
          </NativeSelect>
        </Field>
      </div>

      <form className={styles.discoverySearch} role="search" onSubmit={submitSearch}>
        <Field className={styles.discoveryControl}>
          <FieldLabel>{copy.searchLabel[kind]}</FieldLabel>
          <Input
            name="q"
            type="search"
            value={search}
            placeholder={copy.searchPlaceholder}
            onChange={(event) => setSearch(boundedSearch(event.target.value))}
          />
        </Field>
        <Button type="submit">{copy.searchAction}</Button>
      </form>

      {hasFilters ? (
        <Button
          type="button"
          variant="secondary"
          className={styles.discoveryClear}
          onClick={() => {
            setSearch("")
            navigate((params) => {
              params.delete("category")
              params.delete("sort")
              params.delete("q")
            })
          }}
        >
          {copy.clear}
        </Button>
      ) : null}
    </div>
  )
}
