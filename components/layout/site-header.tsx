"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"

import { useLocale, useSetLocale } from "@/components/i18n/locale-provider"
import { Logo } from "@/components/ui/logo"
import { contactEmail, copy, githubOrg } from "@/lib/content"
import { locales } from "@/lib/i18n"

function LanguageToggle() {
  const locale = useLocale()
  const setLocale = useSetLocale()
  const reduced = useReducedMotion()

  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <motion.span
        className="lang-thumb"
        aria-hidden="true"
        initial={false}
        animate={{ x: locale === "ko" ? 0 : 34 }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38 }}
      />
      {locales.map((value) => (
        <button
          key={value}
          type="button"
          data-active={value === locale}
          aria-pressed={value === locale}
          onClick={() => setLocale(value)}
        >
          <span>{value.toUpperCase()}</span>
        </button>
      ))}
    </div>
  )
}

export function SiteHeader() {
  const locale = useLocale()
  const t = copy[locale].nav
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="site-header" data-stuck={stuck}>
      <div className="header-inner">
        <a href="#top" aria-label="LafLabs">
          <Logo />
        </a>

        <nav className="header-nav">
          <a href="#products">{t.products}</a>
          <a href="#open-source">{t.open}</a>
          <a href="#principles">{t.principles}</a>
          <a href={`mailto:${contactEmail}`}>{t.contact}</a>
        </nav>

        <div className="header-actions">
          <LanguageToggle />
          <a
            href={githubOrg}
            target="_blank"
            rel="noreferrer noopener"
            className="icon-toggle"
            aria-label="LafLabs on GitHub"
          >
            <GithubGlyph />
          </a>
        </div>
      </div>
    </header>
  )
}

export function GithubGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}
