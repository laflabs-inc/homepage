import Link from "next/link"

import { designCatalog, designPageEntries } from "@/lib/design-system/catalog"
import { componentCategories, type ComponentCategory } from "@/lib/design-system/component-options"
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

const categoryCopy: Record<ComponentCategory, { ko: { title: string; description: string }; en: { title: string; description: string } }> = {
  brand: { ko: { title: "브랜드", description: "공식 아이덴티티를 일관되게 표시합니다." }, en: { title: "Brand", description: "Present the official identity consistently." } },
  action: { ko: { title: "동작", description: "사용자가 다음 행동을 분명하게 실행하도록 돕습니다." }, en: { title: "Actions", description: "Help people run a clear next action." } },
  form: { ko: { title: "폼", description: "값을 이해하고 정확하게 입력하도록 안내합니다." }, en: { title: "Forms", description: "Help people understand and enter values accurately." } },
  selection: { ko: { title: "선택", description: "하나 또는 여러 값을 예측 가능하게 고릅니다." }, en: { title: "Selection", description: "Choose one or more values predictably." } },
  navigation: { ko: { title: "탐색", description: "다음 목적지로 이동하는 관계를 보여줍니다." }, en: { title: "Navigation", description: "Show the relationship to the next destination." } },
  disclosure: { ko: { title: "공개와 접기", description: "필요한 정보를 단계적으로 드러냅니다." }, en: { title: "Disclosure", description: "Reveal supporting information progressively." } },
  overlay: { ko: { title: "오버레이", description: "현재 맥락 위에서 짧은 작업을 처리합니다." }, en: { title: "Overlay", description: "Handle a short task above the current context." } },
  feedback: { ko: { title: "피드백", description: "상태와 가능한 다음 행동을 설명합니다." }, en: { title: "Feedback", description: "Explain state and the available next action." } },
  content: { ko: { title: "콘텐츠", description: "문서와 기술 정보를 읽기 쉽게 전달합니다." }, en: { title: "Content", description: "Present documents and technical information clearly." } },
  structure: { ko: { title: "구조", description: "콘텐츠 사이의 경계와 관계를 정리합니다." }, en: { title: "Structure", description: "Organize boundaries and relationships between content." } },
}

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
        {componentCategories.map((category) => {
          const components = designCatalog.components.filter((component) => component.category === category)
          if (components.length === 0) return null
          const categoryText = categoryCopy[category][locale]

          return (
            <section className={styles.componentGroup} key={category} aria-labelledby={`component-group-${category}`}>
              <header className={styles.componentGroupHeader}>
                <h2 id={`component-group-${category}`}>{categoryText.title}</h2>
                <p>{categoryText.description}</p>
              </header>
              {components.map((component) => (
                <section
                  className={styles.componentRow}
                  aria-labelledby={`component-${component.id}`}
                  key={component.id}
                >
                  <div className={styles.componentIdentity}>
                    <h3 id={`component-${component.id}`}>{component.name}</h3>
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
            </section>
          )
        })}
      </div>
    </article>
  )
}
