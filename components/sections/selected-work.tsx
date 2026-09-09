"use client"

import { ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr"
import { useRef, useState } from "react"

import { useAnalytics } from "@/components/analytics/consent-provider"
import { useLocale } from "@/components/i18n/locale-provider"
import { homepageCopy, workItems, type WorkItem } from "@/lib/homepage"
import styles from "./selected-work.module.css"

function WorkVisual({ item, locale }: { item: WorkItem; locale: "ko" | "en" }) {
  return (
    <div className={styles.visual} data-visual-kind={item.visual.kind}>
      <div className={styles.visualHeader}>
        <span>{item.visual.label[locale]}</span>
        <span>{item.title}</span>
      </div>
      {item.visual.kind === "code" ? (
        <pre className={styles.code} aria-label={item.visual.label[locale]}>
          <code>
            {item.visual.lines.map((line, index) => (
              <span key={`${index}:${line}`}>
                <i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>
                <b>{line || " "}</b>
              </span>
            ))}
          </code>
        </pre>
      ) : (
        <ol className={styles.system}>
          {item.visual.lines.map((line, index) => (
            <li key={line}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{line}</strong>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export function SelectedWork() {
  const locale = useLocale()
  const { track } = useAnalytics()
  const t = homepageCopy[locale].work
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<"next" | "previous">("next")
  const pointerStart = useRef<number | null>(null)
  const item = workItems[index]

  const move = (nextDirection: "next" | "previous") => {
    const delta = nextDirection === "next" ? 1 : -1
    const nextIndex = (index + delta + workItems.length) % workItems.length
    setDirection(nextDirection)
    setIndex(nextIndex)
    track("work_navigate", `${nextDirection}:${workItems[nextIndex].slug}`)
  }

  return (
    <section className={styles.section} id="work">
      <div className={styles.heading}>
        <h2 id="selected-work-title">{t.title}</h2>
        <p>{t.lede}</p>
      </div>

      <div
        className={styles.carousel}
        role="region"
        aria-label={t.region}
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault()
            move("previous")
          }
          if (event.key === "ArrowRight") {
            event.preventDefault()
            move("next")
          }
        }}
        onPointerDown={(event) => {
          pointerStart.current = event.clientX
        }}
        onPointerUp={(event) => {
          if (pointerStart.current === null) return
          const distance = event.clientX - pointerStart.current
          pointerStart.current = null
          if (Math.abs(distance) < 56) return
          move(distance < 0 ? "next" : "previous")
        }}
        onPointerCancel={() => {
          pointerStart.current = null
        }}
      >
        <article
          className={styles.slide}
          data-direction={direction}
          data-work-slug={item.slug}
          key={item.slug}
        >
          <WorkVisual item={item} locale={locale} />
          <div className={styles.details}>
            <div className={styles.meta}>
              <span>{t.categories[item.category]}</span>
              <span>{t.statuses[item.status]}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.summary[locale]}</p>
            <ul className={styles.tags} aria-label={locale === "ko" ? "기술" : "Technologies"}>
              {item.tags.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
            {item.href ? (
              <a
                className={styles.destination}
                href={item.href}
                target="_blank"
                rel="noreferrer noopener"
                data-analytics-event="github_click"
                data-analytics-target={item.slug}
              >
                {t.openRepository}<ArrowUpRight size={18} aria-hidden="true" />
              </a>
            ) : (
              <span className={styles.unavailable}>{t.unavailable}</span>
            )}
          </div>
        </article>

        <div className={styles.controls}>
          <button type="button" aria-label={t.previous} onClick={() => move("previous")}>
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <span aria-live="polite" aria-atomic="true">
            {index + 1} / {workItems.length}
          </span>
          <div className={styles.position} aria-hidden="true">
            {workItems.map((work, workIndex) => (
              <i data-active={workIndex === index} key={work.slug} />
            ))}
          </div>
          <button type="button" aria-label={t.next} onClick={() => move("next")}>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
