"use client"

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr"
import { useState, useSyncExternalStore } from "react"

import { useLocale } from "@/components/i18n/locale-provider"
import { GithubGlyph } from "@/components/layout/site-header"
import { LatestSignals } from "@/components/sections/latest-signals"
import {
  BuildScene,
  IdentityArtifact,
  LafetchArtifact,
  LafwallArtifact,
  MethodScene,
} from "@/components/home-experiment/evidence-scenes"
import {
  homeExperimentCopy,
  homeExperimentWork,
  type HomeExperimentWorkItem,
} from "@/lib/home-experiment"
import type { Locale } from "@/lib/i18n"

import styles from "./evidence-home.module.css"

const subscribeToHydration = () => () => undefined

function EmphasisLine({ line, highlight }: { line: string; highlight?: string }) {
  const start = highlight ? line.indexOf(highlight) : -1
  if (!highlight || start < 0) return line

  return (
    <>
      {line.slice(0, start)}
      <em>{highlight}</em>
      {line.slice(start + highlight.length)}
    </>
  )
}

function EditorialTitle({
  highlight,
  lines,
}: {
  highlight?: string
  lines: readonly string[]
}) {
  return lines.map((line) => (
    <span className={styles.titleLine} key={line}>
      <EmphasisLine highlight={highlight} line={line} />
    </span>
  ))
}

function WorkArtifact({ item, locale }: { item: HomeExperimentWorkItem; locale: Locale }) {
  const props = { artifact: item.artifact, locale }

  if (item.id === "laf-id") return <IdentityArtifact {...props} />
  if (item.id === "lafetch") return <LafetchArtifact {...props} />
  return <LafwallArtifact {...props} />
}

export function EvidenceHome() {
  const locale = useLocale()
  const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false)
  const t = homeExperimentCopy[locale]
  const [activeWork, setActiveWork] = useState(0)

  const moveWork = (direction: -1 | 1) => {
    setActiveWork((current) => (
      (current + direction + homeExperimentWork.length) % homeExperimentWork.length
    ))
  }

  return (
    <main className={styles.root} data-home-experiment="true" id="top">
      <section className={styles.hero} data-home-section="hero" aria-labelledby="home-hero-title">
        <div className={styles.heroCopy}>
          <div className={styles.heroMeta}>
            <span>{t.hero.companyType}</span>
            <span>{t.hero.location}</span>
          </div>
          <h1 id="home-hero-title" aria-label={t.hero.title}>
            <EditorialTitle lines={t.hero.titleLines} highlight={t.hero.highlight} />
          </h1>
          <p>{t.hero.lede}</p>
        </div>

        <div className={styles.heroEvidence}>
          <BuildScene label={t.hero.artifactLabel} />
        </div>

        <a className={styles.scrollCue} href="#company">
          <ArrowDown aria-hidden size={16} />
          COMPANY
        </a>
      </section>

      <section className={styles.company} data-home-section="company" id="company" aria-labelledby="home-company-title">
        <div className={styles.companyInner}>
          <h2 id="home-company-title" aria-label={t.company.title}>
            <EditorialTitle lines={t.company.titleLines} highlight={t.company.highlight} />
          </h2>
          <div className={styles.companyStatement}>
            <p>{t.company.lede}</p>
            <span>BUILD QUIETLY.<br />WORK RELIABLY.</span>
          </div>

          <div className={styles.companyProof}>
            <div className={styles.companyProofCopy}>
              <strong>{t.company.proofTitle}</strong>
              <p>{t.company.proofBody}</p>
            </div>
            <ol className={styles.companyRoute} aria-label={t.company.proofTitle}>
              {[
                ["PRODUCT", locale === "ko" ? "제품" : "Product"],
                ["CODE", locale === "ko" ? "기반" : "Foundation"],
                ["OPERATE", locale === "ko" ? "운영" : "Operation"],
                ["REUSE", locale === "ko" ? "다음 작업" : "Next work"],
              ].map(([code, label], index) => (
                <li key={code}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{code}</strong>
                  <small>{label}</small>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className={styles.method} data-home-section="method" id="work-method" aria-labelledby="home-method-title">
        <div className={styles.sectionIntro}>
          <h2 id="home-method-title" aria-label={t.method.title}>
            <EditorialTitle lines={t.method.titleLines} />
          </h2>
          <p>{t.method.lede}</p>
        </div>

        <ol className={styles.methodList}>
          {t.method.items.map((item, index) => (
            <li className={styles.methodItem} data-reverse={index % 2 === 1 || undefined} key={item.mark}>
              <div className={styles.methodCopy}>
                <span>{item.mark}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
              <MethodScene item={item} />
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.work} data-home-section="work" id="work" aria-labelledby="home-work-title">
        <div className={styles.workInner}>
          <div className={styles.workHeading}>
            <h2 id="home-work-title">{t.work.title}</h2>
            <p>{t.work.lede}</p>
          </div>

          <div className={styles.workStage} aria-live={isHydrated ? "polite" : undefined}>
            {homeExperimentWork.map((item, index) => (
              <article
                className={styles.workItem}
                data-work-item={item.id}
                hidden={isHydrated && index !== activeWork}
                key={item.id}
              >
                <div className={styles.workVisual}>
                  <WorkArtifact item={item} locale={locale} />
                </div>
                <div className={styles.workCopy}>
                  <div className={styles.workMeta}>
                    <span>{item.category[locale]}</span>
                    <span>{item.status[locale]}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.summary[locale]}</p>
                  <ul aria-label={`${item.title} technologies`}>
                    {item.tags.map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      data-analytics-event="github_click"
                      data-analytics-target={item.id}
                    >
                      {t.work.open}<ArrowUpRight aria-hidden size={17} />
                    </a>
                  ) : (
                    <span className={styles.unavailable}>{t.work.unavailable}</span>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className={styles.workControls} data-work-controls hidden={!isHydrated}>
            <button type="button" aria-label={t.work.previous} onClick={() => moveWork(-1)}>
              <ArrowLeft aria-hidden size={18} />
            </button>
            <div className={styles.workPosition} aria-hidden="true">
              {homeExperimentWork.map((item, index) => (
                <span data-active={index === activeWork || undefined} key={item.id} />
              ))}
            </div>
            <button type="button" aria-label={t.work.next} onClick={() => moveWork(1)}>
              <ArrowRight aria-hidden size={18} />
            </button>
          </div>
        </div>
      </section>

      <section className={styles.openSource} data-home-section="open-source" id="open-source" aria-labelledby="home-open-title">
        <div className={styles.openCopy}>
          <h2 id="home-open-title" aria-label={t.open.title}>
            <EditorialTitle lines={t.open.titleLines} />
          </h2>
          <p>{t.open.lede}</p>
          <span className={styles.sourceLabel}>{t.open.sourceLabel}</span>
          <a
            href={homeExperimentWork[1].href}
            target="_blank"
            rel="noreferrer noopener"
            data-analytics-event="github_click"
            data-analytics-target={homeExperimentWork[1].id}
          >
            <GithubGlyph />
            {t.open.repository}
            <ArrowUpRight aria-hidden size={17} />
          </a>
        </div>
        <div className={styles.openEvidence}>
          <LafetchArtifact artifact={homeExperimentWork[1].artifact} locale={locale} />
        </div>
      </section>

      <div className={styles.signals} data-home-section="signals">
        <LatestSignals />
      </div>
    </main>
  )
}
