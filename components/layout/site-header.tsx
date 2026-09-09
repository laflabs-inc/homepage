"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { usePathname, useRouter } from "next/navigation"

import { useConsent } from "@/components/analytics/consent-provider"
import { useLocale, useSetLocale } from "@/components/i18n/locale-provider"
import { SITE_SEARCH_OVERLAY_ID, SiteSearchOverlay } from "@/components/search/site-search-overlay"
import searchStyles from "@/components/search/site-search-overlay.module.css"
import { Logo } from "@/components/ui/logo"
import { contactEmail, copy, githubOrg } from "@/lib/content"
import { locales } from "@/lib/i18n"

function LanguageToggle({ navigateDocumentLocale = false }: { navigateDocumentLocale?: boolean }) {
  const locale = useLocale()
  const setLocale = useSetLocale()
  const reduced = useReducedMotion()
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <motion.span
        className="lang-thumb"
        aria-hidden="true"
        initial={false}
        animate={{ x: locale === "ko" ? 0 : 34 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38 }}
      />
      {locales.map((value) => {
        const active = value === locale
        return (
          <button
            key={value}
            type="button"
            data-analytics-event={active ? undefined : "locale_change"}
            data-analytics-target={active ? undefined : value}
            data-active={active}
            aria-pressed={active}
            onClick={() => {
              if (!active) {
                setLocale(value)
                if (navigateDocumentLocale) {
                  const params = new URLSearchParams(window.location.search)
                  params.set("locale", value)
                  params.delete("cursor")
                  const query = params.toString()
                  router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false })
                }
              }
            }}
          >
            <span>{value.toUpperCase()}</span>
          </button>
        )
      })}
    </div>
  )
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return true
  return target.isContentEditable || Boolean(target.closest('[contenteditable="true"], [contenteditable=""]'))
}

export function SiteHeader({ homeHref }: { homeHref?: string } = {}) {
  const locale = useLocale()
  const t = copy[locale].nav
  const searchCopy = copy[locale].search
  const { panelOpen, track } = useConsent()
  const [stuck, setStuck] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchTriggerRef = useRef<HTMLButtonElement>(null)

  const openSearch = useCallback(() => {
    if (panelOpen || searchOpen) return
    track("search_open", null)
    setSearchOpen(true)
  }, [panelOpen, searchOpen, track])

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k" || isEditableTarget(event.target)) return
      event.preventDefault()
      openSearch()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [openSearch])

  const toggleSearch = () => {
    if (searchOpen) setSearchOpen(false)
    else openSearch()
  }

  return (
    <>
      <header className="site-header" data-stuck={stuck || searchOpen}>
      <div className="header-inner">
        <a href={homeHref ?? "#top"} aria-label="LafLabs">
          <Logo />
        </a>

        <nav className="header-nav">
          <a href={homeHref ? `${homeHref}#company` : "#company"}>{t.principles}</a>
          <a href={homeHref ? `${homeHref}#work` : "#work"}>{t.products}</a>
          <a href={homeHref ? `${homeHref}#open-source` : "#open-source"}>{t.open}</a>
          <a
            href={`mailto:${contactEmail}`}
            data-analytics-event="contact_click"
            data-analytics-target="email"
          >{t.contact}</a>
        </nav>

        <div className="header-actions">
          <LanguageToggle navigateDocumentLocale={Boolean(homeHref)} />
          <button
            ref={searchTriggerRef}
            className={searchStyles.trigger}
            type="button"
            aria-label={searchOpen ? searchCopy.close : searchCopy.open}
            aria-expanded={searchOpen}
            aria-controls={SITE_SEARCH_OVERLAY_ID}
            disabled={panelOpen}
            onClick={toggleSearch}
          >
            {searchOpen ? <CloseGlyph /> : <SearchGlyph />}
          </button>
          <a
            href={githubOrg}
            target="_blank"
            rel="noreferrer noopener"
            className="icon-toggle"
            aria-label="LafLabs on GitHub"
            data-analytics-event="github_click"
            data-analytics-target="laflabs-inc"
          >
            <GithubGlyph />
          </a>
        </div>
      </div>
      </header>
      <SiteSearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        triggerRef={searchTriggerRef}
      />
    </>
  )
}

function SearchGlyph() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="m12.2 12.2 4.1 4.1" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
}

function CloseGlyph() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4.5 4.5 11 11m0-11-11 11" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
}

export function GithubGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}
