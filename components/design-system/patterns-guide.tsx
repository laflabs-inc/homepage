import Link from "next/link"

import { designCatalog, designPageEntries, getComponentEntry } from "@/lib/design-system/catalog"
import type { PatternEntry } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import { getDesignPageHref } from "./design-shell"
import styles from "./design-system.module.css"

const pageEntry = designPageEntries.find((entry) => entry.id === "patterns")
const foundationsEntry = designPageEntries.find((entry) => entry.id === "foundations")
const colorFoundation = designCatalog.foundations.find((foundation) => foundation.id === "color")

const structuralPatternIds = [
  "editorial-heading",
  "collection-row",
  "selected-work",
  "system-states",
  "responsive-collapse",
] as const

const copy = {
  ko: {
    shellSpecimen: "주석이 있는 페이지 shell",
    structuralPatterns: "구조 패턴",
    documentExcerpt: "문서 화면 실제 발췌",
    rules: "구성 규칙",
    related: "관련 컴포넌트",
    siteHeader: "기존 Site Header",
    localNavigation: "콘텐츠 shell 안의 로컬 탐색",
    pageContent: "페이지 본문",
    siteFooter: "기존 Footer",
    documentLabel: "FOUNDATIONS / COLOR",
    readDocument: "기초 원칙에서 이어서 읽기",
  },
  en: {
    shellSpecimen: "Annotated page shell",
    structuralPatterns: "Structural patterns",
    documentExcerpt: "Document surface excerpt",
    rules: "Composition rules",
    related: "Related components",
    siteHeader: "Existing Site Header",
    localNavigation: "Local navigation inside the content shell",
    pageContent: "Page content",
    siteFooter: "Existing Footer",
    documentLabel: "FOUNDATIONS / COLOR",
    readDocument: "Continue in Foundations",
  },
} as const

function getPattern(id: string): PatternEntry | undefined {
  return designCatalog.patterns.find((pattern) => pattern.id === id)
}

function PatternRules({ pattern, locale }: { pattern: PatternEntry; locale: Locale }) {
  return (
    <div className={styles.patternRules}>
      <h3>{copy[locale].rules}</h3>
      <ul>
        {pattern.guidance.map((guidance) => (
          <li key={guidance.en}>{guidance[locale]}</li>
        ))}
      </ul>
    </div>
  )
}

function RelatedComponents({ pattern, locale }: { pattern: PatternEntry; locale: Locale }) {
  return (
    <div className={styles.patternRelated}>
      <h3>{copy[locale].related}</h3>
      <ul>
        {pattern.relatedComponents.map((componentId) => {
          const component = getComponentEntry(componentId)
          if (!component) return null

          return (
            <li key={component.id}>
              <Link href={getDesignPageHref(`/design/components/${component.id}`, locale)}>
                {component.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PatternHeading({ pattern, locale }: { pattern: PatternEntry; locale: Locale }) {
  return (
    <header className={styles.patternHeading}>
      <h2 id={`pattern-${pattern.id}`}>{pattern.title[locale]}</h2>
      <p>{pattern.summary[locale]}</p>
    </header>
  )
}

function SiteChromePattern({ pattern, locale }: { pattern: PatternEntry; locale: Locale }) {
  const text = copy[locale]

  return (
    <section className={styles.patternFeature} aria-labelledby={`pattern-${pattern.id}`}>
      <PatternHeading pattern={pattern} locale={locale} />
      <figure className={styles.shellSpecimen} aria-label={text.shellSpecimen}>
        <div className={styles.shellSpecimenHeader}>{text.siteHeader}</div>
        <div className={styles.shellSpecimenBody}>
          <div>{text.localNavigation}</div>
          <div>{text.pageContent}</div>
        </div>
        <div className={styles.shellSpecimenFooter}>{text.siteFooter}</div>
      </figure>
      <div className={styles.patternGuidanceColumns}>
        <PatternRules pattern={pattern} locale={locale} />
        <RelatedComponents pattern={pattern} locale={locale} />
      </div>
    </section>
  )
}

function StructuralPatternRow({ pattern, locale }: { pattern: PatternEntry; locale: Locale }) {
  return (
    <li>
      <section className={styles.patternRow} aria-labelledby={`pattern-${pattern.id}`}>
        <PatternHeading pattern={pattern} locale={locale} />
        <PatternRules pattern={pattern} locale={locale} />
        <RelatedComponents pattern={pattern} locale={locale} />
      </section>
    </li>
  )
}

function DocumentPattern({ pattern, locale }: { pattern: PatternEntry; locale: Locale }) {
  const text = copy[locale]

  return (
    <section className={styles.patternFeature} aria-labelledby={`pattern-${pattern.id}`}>
      <PatternHeading pattern={pattern} locale={locale} />
      {colorFoundation && foundationsEntry ? (
        <article className={styles.documentExcerpt} aria-label={text.documentExcerpt}>
          <header>
            <span>{text.documentLabel}</span>
            <h3>{colorFoundation.title[locale]}</h3>
            <p>{colorFoundation.summary[locale]}</p>
          </header>
          <ul>
            {colorFoundation.guidance.slice(0, 2).map((guidance) => (
              <li key={guidance.en}>{guidance[locale]}</li>
            ))}
          </ul>
          <Link href={getDesignPageHref(foundationsEntry.href, locale)}>
            {text.readDocument}
            <span aria-hidden="true">→</span>
          </Link>
        </article>
      ) : null}
      <div className={styles.patternGuidanceColumns}>
        <PatternRules pattern={pattern} locale={locale} />
        <RelatedComponents pattern={pattern} locale={locale} />
      </div>
    </section>
  )
}

function ContrastBandPattern({ pattern, locale }: { pattern: PatternEntry; locale: Locale }) {
  return (
    <section className={styles.contrastBandPattern} aria-labelledby={`pattern-${pattern.id}`}>
      <PatternHeading pattern={pattern} locale={locale} />
      <div className={styles.patternGuidanceColumns}>
        <PatternRules pattern={pattern} locale={locale} />
        <RelatedComponents pattern={pattern} locale={locale} />
      </div>
    </section>
  )
}

export function PatternsGuide({ locale }: { locale: Locale }) {
  if (!pageEntry) return null

  const siteChrome = getPattern("site-chrome")
  const documentSurface = getPattern("document-surface")
  const contrastBand = getPattern("contrast-band")
  const structuralPatterns = structuralPatternIds.flatMap((id) => {
    const pattern = getPattern(id)
    return pattern ? [pattern] : []
  })

  return (
    <article>
      <header className={styles.masthead}>
        <h1>{pageEntry.title[locale]}</h1>
        <p>{pageEntry.description[locale]}</p>
      </header>

      {siteChrome ? <SiteChromePattern pattern={siteChrome} locale={locale} /> : null}

      <ul className={styles.patternList} aria-label={copy[locale].structuralPatterns}>
        {structuralPatterns.map((pattern) => (
          <StructuralPatternRow pattern={pattern} locale={locale} key={pattern.id} />
        ))}
      </ul>

      {documentSurface ? <DocumentPattern pattern={documentSurface} locale={locale} /> : null}
      {contrastBand ? <ContrastBandPattern pattern={contrastBand} locale={locale} /> : null}
    </article>
  )
}
