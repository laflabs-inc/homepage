"use client"

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import Link from "next/link"

import { useAnalytics } from "@/components/analytics/consent-provider"
import { useLocale } from "@/components/i18n/locale-provider"
import { copy, githubOrg } from "@/lib/content"
import type {
  SiteSearchGroup,
  SiteSearchResponse,
  SiteSearchResult,
} from "@/lib/search/types"

import styles from "./site-search-overlay.module.css"

export const SITE_SEARCH_OVERLAY_ID = "site-search-overlay"

type SiteSearchOverlayProps = {
  open: boolean
  onClose: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
}

type SearchState<T> = {
  locale: "ko" | "en"
  value: T
}

const resultGroups: ReadonlyArray<{
  key: "pages" | "products" | "documents"
  groups: readonly SiteSearchGroup[]
}> = [
  { key: "pages", groups: ["page"] },
  { key: "products", groups: ["product", "open-source"] },
  { key: "documents", groups: ["notice", "legal", "disclosure"] },
]

function unicodeLength(value: string): number {
  return Array.from(value).length
}

function ArrowGlyph() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" fill="none" stroke="currentColor" strokeLinecap="square" strokeWidth="1.5" />
    </svg>
  )
}

function SearchDialog({
  onClose,
  triggerRef,
}: Omit<SiteSearchOverlayProps, "open">) {
  const locale = useLocale()
  const t = copy[locale].search
  const { track } = useAnalytics()
  const reducedMotion = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const [stateLocale, setStateLocale] = useState(locale)
  const [query, setQuery] = useState("")
  const [response, setResponse] = useState<SearchState<SiteSearchResponse> | null>(null)
  const [error, setError] = useState<SearchState<"invalid" | "unavailable"> | null>(null)
  const [pending, setPending] = useState(false)
  if (stateLocale !== locale) {
    setStateLocale(locale)
    setResponse(null)
    setError(null)
    setPending(false)
  }

  const visibleResponse = response?.locale === locale ? response.value : null
  const visibleError = error?.locale === locale ? error.value : null

  useEffect(() => {
    inputRef.current?.focus()

    const bodyOverflow = document.body.style.overflow
    const coveredRegions = Array.from(document.querySelectorAll<HTMLElement>("main, footer")).map((element) => ({
      element,
      inert: element.hasAttribute("inert"),
      value: element.getAttribute("inert"),
    }))

    document.body.style.overflow = "hidden"
    coveredRegions.forEach(({ element }) => element.setAttribute("inert", ""))

    return () => {
      controllerRef.current?.abort()
      document.body.style.overflow = bodyOverflow
      coveredRegions.forEach(({ element, inert, value }) => {
        if (!inert) {
          element.removeAttribute("inert")
        } else if (value === null) {
          element.setAttribute("inert", "")
        } else {
          element.setAttribute("inert", value)
        }
      })
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      onClose()
      triggerRef.current?.focus()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose, triggerRef])

  useEffect(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
  }, [locale])

  const submit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const trimmedQuery = query.trim()
    const queryLength = unicodeLength(trimmedQuery)

    controllerRef.current?.abort()
    controllerRef.current = null
    setPending(false)

    if (queryLength < 2 || queryLength > 100) {
      setResponse(null)
      setError({ locale, value: "invalid" })
      return
    }

    const controller = new AbortController()
    controllerRef.current = controller
    setError(null)
    setPending(true)

    try {
      const params = new URLSearchParams({ q: trimmedQuery, locale })
      const request = await fetch(`/api/search?${params.toString()}`, {
        signal: controller.signal,
      })
      if (!request.ok) throw new Error("Search unavailable")

      const payload = await request.json() as SiteSearchResponse
      if (controller.signal.aborted || controllerRef.current !== controller) return

      setResponse({ locale, value: payload })
      track("search_submit", `q${queryLength}:r${payload.results.length}`)
    } catch (cause) {
      if (controller.signal.aborted || (cause instanceof DOMException && cause.name === "AbortError")) return
      if (controllerRef.current === controller) {
        setResponse(null)
        setError({ locale, value: "unavailable" })
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setPending(false)
      }
    }
  }

  const groupedResults = resultGroups.map((group) => ({
    ...group,
    results: visibleResponse?.results.filter((result) => group.groups.includes(result.group)) ?? [],
  }))
  const groupLabels = {
    pages: t.groupPages,
    products: t.groupProducts,
    documents: t.groupDocuments,
  }

  return (
    <motion.div
      id={SITE_SEARCH_OVERLAY_ID}
      className={styles.overlay}
      role="dialog"
      aria-labelledby={`${SITE_SEARCH_OVERLAY_ID}-heading`}
      initial={reducedMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.inner}>
        <div className={styles.intro}>
          <h1 id={`${SITE_SEARCH_OVERLAY_ID}-heading`}>{t.heading}</h1>
          <p>{t.prompt}</p>
        </div>

        <form className={styles.form} role="search" onSubmit={submit}>
          <label className={styles.srOnly} htmlFor={`${SITE_SEARCH_OVERLAY_ID}-input`}>{t.input}</label>
          <input
            ref={inputRef}
            id={`${SITE_SEARCH_OVERLAY_ID}-input`}
            className={styles.input}
            type="search"
            name="q"
            value={query}
            autoComplete="off"
            spellCheck="false"
            aria-describedby={`${SITE_SEARCH_OVERLAY_ID}-status`}
            onChange={(event) => {
              setQuery(event.target.value)
              if (visibleError === "invalid") setError(null)
            }}
          />
          <button
            className={styles.submit}
            type="submit"
            aria-label={t.submit}
            aria-busy={pending}
          >
            <ArrowGlyph />
          </button>
        </form>

        <div id={`${SITE_SEARCH_OVERLAY_ID}-status`} className={styles.status} role="status" aria-live="polite">
          {visibleError === "invalid" ? t.invalid : null}
          {visibleError === "unavailable" ? (
            <span className={styles.errorMessage}>
              {t.unavailable}
              <button type="button" onClick={() => void submit()}>{t.retry}</button>
            </span>
          ) : null}
          {pending ? t.loading : null}
          {!pending && !visibleError && visibleResponse ? t.resultCount(visibleResponse.results.length) : null}
        </div>

        <div className={styles.results} data-loading={pending || undefined}>
          {visibleResponse?.partial ? <p className={styles.notice}>{t.partialResult}</p> : null}

          {visibleResponse && visibleResponse.results.length > 0 ? groupedResults.map((group) => group.results.length > 0 ? (
            <section className={styles.group} key={group.key}>
              <h2>{groupLabels[group.key]}</h2>
              <div className={styles.rows}>
                {group.results.map((result) => (
                  <ResultRow
                    key={`${result.group}:${result.id}`}
                    result={result}
                    label={groupLabels[group.key]}
                    onSelect={() => {
                      track("search_result_click", result.group)
                      onClose()
                    }}
                  />
                ))}
              </div>
            </section>
          ) : null) : null}

          {visibleResponse && visibleResponse.results.length === 0 ? (
            <div className={styles.empty}>
              <p>{t.noResult}</p>
              <nav aria-label={t.noResult}>
                <Link href="/notices">{t.fallbackNotices}</Link>
                <Link href="/design">{t.fallbackDesign}</Link>
                <a href={githubOrg} target="_blank" rel="noreferrer noopener">{t.fallbackGithub}</a>
              </nav>
            </div>
          ) : null}

          {!visibleResponse && !visibleError ? (
            <div className={styles.idle} aria-hidden={pending || undefined}>
              {resultGroups.map((group) => <span key={group.key}>{groupLabels[group.key]}</span>)}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}

function ResultRow({
  result,
  label,
  onSelect,
}: {
  result: SiteSearchResult
  label: string
  onSelect: () => void
}) {
  return (
    <a className={styles.result} href={result.href} onClick={onSelect}>
      <span className={styles.resultLabel}>{label}</span>
      <span className={styles.resultCopy}>
        <strong>{result.title}</strong>
        <span>{result.description}</span>
      </span>
      <ArrowGlyph />
    </a>
  )
}

export function SiteSearchOverlay({ open, onClose, triggerRef }: SiteSearchOverlayProps) {
  return (
    <AnimatePresence>
      {open ? <SearchDialog onClose={onClose} triggerRef={triggerRef} /> : null}
    </AnimatePresence>
  )
}
