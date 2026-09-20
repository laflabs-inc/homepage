import Link from "next/link"

import { designCatalog, designPageEntries } from "@/lib/design-system/catalog"
import type { Locale } from "@/lib/i18n"
import { getComponentMaturityLabel } from "./component-maturity"
import { ComponentPreview } from "./component-preview"
import { getDesignPageHref } from "./design-shell"
import styles from "./design-system.module.css"

const pageEntry = designPageEntries.find((entry) => entry.id === "components")

const copy = {
  ko: {
    preview: "미리보기",
    details: (name: string) => `${name} 자세히 보기`,
    detailsVisible: "자세히 보기",
  },
  en: {
    preview: "preview",
    details: (name: string) => `${name} details`,
    detailsVisible: "View details",
  },
} as const

export function ComponentIndex({ locale }: { locale: Locale }) {
  if (!pageEntry) return null
  const text = copy[locale]

  return (
    <article>
      <header className={styles.masthead}>
        <h1>{pageEntry.title[locale]}</h1>
        <p>{pageEntry.description[locale]}</p>
      </header>

      <div className={styles.componentList}>
        {designCatalog.components.map((component) => (
          <section
            className={styles.componentRow}
            aria-labelledby={`component-${component.id}`}
            key={component.id}
          >
            <div className={styles.componentIdentity}>
              <h2 id={`component-${component.id}`}>{component.name}</h2>
              <span>{getComponentMaturityLabel(component.maturity, locale)}</span>
            </div>
            <div className={styles.componentSummary}>
              <p>{component.summary[locale]}</p>
              <Link
                className={styles.componentDetailLink}
                href={getDesignPageHref(`/design/components/${component.id}`, locale)}
                aria-label={text.details(component.name)}
              >
                {text.detailsVisible}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <ComponentPreview
              demoKey={component.demoKey}
              label={`${component.name} ${text.preview}`}
              locale={locale}
            />
          </section>
        ))}
      </div>
    </article>
  )
}
