"use client"

import { ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr"
import { useCallback, useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { copy } from "@/lib/content"
import type { Locale } from "@/lib/i18n"
import {
  getLatestSignalHref,
  mergeLatestSignals,
  signalKinds,
  type LatestSignal,
  type LatestSignalKind,
  type PublicSignalPage,
} from "@/lib/latest-signals"
import styles from "./latest-signals.module.css"

type LoadState =
  | { locale: Locale; status: "loading"; items: LatestSignal[] }
  | { locale: Locale; status: "ready"; items: LatestSignal[] }
  | { locale: Locale; status: "empty"; items: LatestSignal[] }
  | { locale: Locale; status: "error"; items: LatestSignal[] }

const destinationByKind: Record<LatestSignalKind, string> = {
  notice: "/notices",
  disclosure: "/disclosures",
  design: "/design",
}

function isPublicSignalPage(value: unknown): value is PublicSignalPage {
  return typeof value === "object"
    && value !== null
    && "items" in value
    && Array.isArray(value.items)
}

function formatDate(value: string, locale: "ko" | "en") {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value))
}

function SignalGlitch() {
  const reduced = useReducedMotion()

  return (
    <div className={styles.glitchStage} aria-hidden="true">
      <span className={styles.signalStable}>SIGNAL</span>
      {!reduced ? (
        <>
          <motion.span
            className={`${styles.glitchLayer} ${styles.glitchLayerTop}`}
            initial={{ opacity: 0, x: 0 }}
            whileInView={{ opacity: [0, 0.95, 0.7, 0], x: [0, 14, -9, 0] }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.48, times: [0, 0.2, 0.66, 1], ease: "linear" }}
          >SIGNAL</motion.span>
          <motion.span
            className={`${styles.glitchLayer} ${styles.glitchLayerBottom}`}
            initial={{ opacity: 0, x: 0 }}
            whileInView={{ opacity: [0, 0.8, 0.55, 0], x: [0, -11, 7, 0] }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.54, delay: 0.04, times: [0, 0.18, 0.7, 1], ease: "linear" }}
          >SIGNAL</motion.span>
          <motion.span
            className={styles.scanBand}
            initial={{ opacity: 0, y: -90 }}
            whileInView={{ opacity: [0, 0.75, 0], y: [-90, 40, 170] }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.5, times: [0, 0.42, 1], ease: "linear" }}
          />
        </>
      ) : null}
    </div>
  )
}

export function LatestSignals() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const t = copy[locale].signals
  const rail = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<LoadState>(() => ({ locale, status: "loading", items: [] }))
  const [canScrollPrevious, setCanScrollPrevious] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const displayState: LoadState = state.locale === locale
    ? state
    : { locale, status: "loading", items: [] }

  useEffect(() => {
    const controller = new AbortController()

    Promise.all(signalKinds.map(async (kind) => {
      const response = await fetch(`/api/content?kind=${kind}&locale=${locale}&limit=3`, {
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`Content request failed with ${response.status}`)
      const body: unknown = await response.json()
      if (!isPublicSignalPage(body)) throw new Error("Content response was invalid")
      return body
    })).then((pages) => {
      if (controller.signal.aborted) return
      const items = mergeLatestSignals(pages, 3)
      setState({ locale, status: items.length > 0 ? "ready" : "empty", items })
    }).catch(() => {
      if (!controller.signal.aborted) setState({ locale, status: "error", items: [] })
    })

    return () => controller.abort()
  }, [locale])

  const updateRailControls = useCallback(() => {
    const element = rail.current
    if (!element) return
    setCanScrollPrevious(element.scrollLeft > 2)
    setCanScrollNext(element.scrollLeft + element.clientWidth < element.scrollWidth - 2)
  }, [])

  useEffect(() => {
    updateRailControls()
    window.addEventListener("resize", updateRailControls)
    return () => window.removeEventListener("resize", updateRailControls)
  }, [displayState.status, updateRailControls])

  const moveRail = (direction: -1 | 1) => {
    const element = rail.current
    if (!element) return
    element.scrollBy({
      left: element.clientWidth * 0.72 * direction,
      behavior: reduced ? "auto" : "smooth",
    })
  }

  const fallback = displayState.status === "error" ? t.error : t.empty

  return (
    <section className={styles.section} aria-labelledby="latest-signals-title">
      <div className={styles.inner}>
        <div className={styles.signalPanel}>
          <div className={styles.signalCopy}>
            <p className={`${styles.signalLabel} mono`}>{t.label}</p>
            <h2 id="latest-signals-title">{t.title}</h2>
            <p className={styles.signalLede}>{t.lede}</p>
          </div>
          <SignalGlitch />
        </div>

        <div className={styles.stories}>
          <div className={styles.storiesHeader}>
            <h3 id="latest-signal-list-title">{t.listTitle}</h3>
            <div className={styles.controls}>
              <button
                type="button"
                aria-label={t.previous}
                disabled={!canScrollPrevious}
                onClick={() => moveRail(-1)}
              ><ArrowLeft size={18} aria-hidden="true" /></button>
              <button
                type="button"
                aria-label={t.next}
                disabled={!canScrollNext}
                onClick={() => moveRail(1)}
              ><ArrowRight size={18} aria-hidden="true" /></button>
            </div>
          </div>

          <div
            className={styles.track}
            ref={rail}
            role="region"
            aria-labelledby="latest-signal-list-title"
            tabIndex={0}
            onScroll={updateRailControls}
          >
            {displayState.status === "loading" ? (
              <>
                <p className={styles.loadingStatus} role="status">{t.loading}</p>
                {[0, 1, 2].map((index) => (
                  <div className={styles.skeleton} aria-hidden="true" key={index}>
                    <span /><strong /><i />
                  </div>
                ))}
              </>
            ) : displayState.status === "ready" ? displayState.items.map((item) => (
              <article className={styles.card} key={item.id}>
                <a href={getLatestSignalHref(item, locale)}>
                  <div className={`${styles.cardMeta} mono`}>
                    <span>{t.kinds[item.kind]}</span>
                    <time dateTime={item.publishedAt}>{formatDate(item.publishedAt, locale)}</time>
                  </div>
                  <div className={styles.cardBody}>
                    <h4>{item.title}</h4>
                    <p>{item.summary}</p>
                  </div>
                  <ArrowUpRight size={22} aria-hidden="true" />
                </a>
              </article>
            )) : (
              <div className={styles.fallback}>
                <p>{fallback}</p>
                <nav aria-label={t.listTitle}>
                  {signalKinds.map((kind) => (
                    <a href={`${destinationByKind[kind]}?locale=${locale}`} key={kind}>
                      {t.kinds[kind]}<ArrowUpRight size={17} aria-hidden="true" />
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
