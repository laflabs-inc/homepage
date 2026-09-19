import Link from "next/link"

import type { ComponentEntry } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import { ComponentCode } from "./component-code"
import { getComponentMaturityLabel } from "./component-maturity"
import { ComponentPreview } from "./component-preview"
import { getDesignPageHref } from "./design-shell"
import styles from "./design-system.module.css"

const githubSourceRoot = "https://github.com/laflabs-inc/homepage/blob/main/"

const copy = {
  ko: {
    maturity: "성숙도",
    sourcePath: "소스 경로",
    source: "소스",
    preview: "실제 미리보기",
    previewLabel: "미리보기",
    when: "사용할 때",
    use: "사용 기준",
    avoid: "사용하지 않을 때",
    states: "변형과 상태",
    accessibility: "접근성",
    api: "API",
    prop: "속성",
    type: "타입",
    required: "필수",
    description: "설명",
    yes: "예",
    no: "아니요",
    usage: "사용 예시",
    import: "지원 import",
    related: "관련 문서",
    back: "모든 컴포넌트 보기",
  },
  en: {
    maturity: "Maturity",
    sourcePath: "Source path",
    source: "Source",
    preview: "Live preview",
    previewLabel: "preview",
    when: "When to use",
    use: "Use it for",
    avoid: "Avoid when",
    states: "Variants and states",
    accessibility: "Accessibility",
    api: "API",
    prop: "Prop",
    type: "Type",
    required: "Required",
    description: "Description",
    yes: "Yes",
    no: "No",
    usage: "Usage",
    import: "Supported import",
    related: "Related documentation",
    back: "View all components",
  },
} as const

export function ComponentDetail({ component, locale }: { component: ComponentEntry; locale: Locale }) {
  const text = copy[locale]

  return (
    <article>
      <header className={`${styles.masthead} ${styles.componentMasthead}`}>
        <h1>{component.name}</h1>
        <p>{component.summary[locale]}</p>
        <dl className={styles.componentMetadata}>
          <div>
            <dt>{text.maturity}</dt>
            <dd>{getComponentMaturityLabel(component.maturity, locale)}</dd>
          </div>
          <div>
            <dt>{text.sourcePath}</dt>
            <dd><code>{component.sourcePath}</code></dd>
          </div>
          <div>
            <dt>{text.source}</dt>
            <dd>
              <a
                href={`${githubSourceRoot}${component.sourcePath}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                {text.source}
              </a>
            </dd>
          </div>
        </dl>
      </header>

      <section className={styles.section} aria-labelledby="component-preview-title">
        <h2 id="component-preview-title">{text.preview}</h2>
        <ComponentPreview
          demoKey={component.demoKey}
          label={`${component.name} ${text.previewLabel}`}
          locale={locale}
        />
      </section>

      <section className={styles.section} aria-labelledby="component-when-title">
        <h2 id="component-when-title">{text.when}</h2>
        <div className={styles.usageGuidance}>
          <div>
            <h3>{text.use}</h3>
            <p>{component.whenToUse[locale]}</p>
          </div>
          <div>
            <h3>{text.avoid}</h3>
            <p>{component.whenNotToUse[locale]}</p>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="component-states-title">
        <h2 id="component-states-title">{text.states}</h2>
        <ul className={styles.stateList}>
          {component.states.map((state) => <li key={state}><code>{state}</code></li>)}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="component-accessibility-title">
        <h2 id="component-accessibility-title">{text.accessibility}</h2>
        <p className={styles.componentProse}>{component.accessibility[locale]}</p>
      </section>

      <section className={styles.section} aria-labelledby="component-api-title">
        <h2 id="component-api-title">{text.api}</h2>
        <div
          className={styles.apiTableRegion}
          role="region"
          aria-labelledby="component-api-title"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">{text.prop}</th>
                <th scope="col">{text.type}</th>
                <th scope="col">{text.required}</th>
                <th scope="col">{text.description}</th>
              </tr>
            </thead>
            <tbody>
              {component.props.map((prop) => (
                <tr key={prop.name}>
                  <th scope="row"><code>{prop.name}</code></th>
                  <td><code>{prop.type}</code></td>
                  <td>{prop.required ? text.yes : text.no}</td>
                  <td>{prop.description[locale]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="component-usage-title">
        <h2 id="component-usage-title">{text.usage}</h2>
        {component.importExample ? (
          <p className={styles.componentImport}>
            <span>{text.import}</span>
            <code>{component.importExample}</code>
          </p>
        ) : null}
        <ComponentCode component={component} locale={locale} />
      </section>

      <section className={styles.section} aria-labelledby="component-related-title">
        <h2 id="component-related-title">{text.related}</h2>
        <Link
          className={styles.componentDetailLink}
          href={getDesignPageHref("/design/components", locale)}
        >
          {text.back}
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </article>
  )
}
