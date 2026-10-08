import Link from "next/link"

import { designCatalog } from "@/lib/design-system/catalog"
import type { RecipeEntry } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import { RecipeCode } from "./recipe-code"
import { RecipePreview } from "./recipes/recipe-preview"
import { getDesignPageHref } from "./design-shell"
import { stateInspectionCopy } from "./state-inspection-copy"
import styles from "./design-system.module.css"

const githubSourceRoot = "https://github.com/laflabs-inc/homepage/blob/main/"

const categoryCopy = {
  ko: {
    action: "동작",
    form: "폼",
    collection: "컬렉션",
    "system-state": "시스템 상태",
  },
  en: {
    action: "Action",
    form: "Form",
    collection: "Collection",
    "system-state": "System state",
  },
} as const

const copy = {
  ko: {
    category: "카테고리",
    components: "사용 컴포넌트",
    preview: "실제 미리보기",
    previewLabel: "미리보기",
    when: "사용할 때",
    use: "사용 기준",
    avoid: "사용하지 않을 때",
    anatomy: "구조",
    states: "상태",
    stateInspections: "상태 살펴보기",
    statePreview: "상태 미리보기",
    responsive: "반응형 동작",
    accessibility: "접근성",
    usage: "사용 예시",
    related: "관련 문서",
    relatedComponents: "관련 컴포넌트",
    relatedPatterns: "관련 패턴",
    sourcePaths: "소스 경로",
    source: "소스 보기",
    back: "모든 레시피 보기",
  },
  en: {
    category: "Category",
    components: "Components",
    preview: "Live preview",
    previewLabel: "preview",
    when: "When to use",
    use: "Use it for",
    avoid: "Avoid when",
    anatomy: "Anatomy",
    states: "States",
    stateInspections: "state inspections",
    statePreview: "state preview",
    responsive: "Responsive behavior",
    accessibility: "Accessibility",
    usage: "Usage",
    related: "Related documentation",
    relatedComponents: "Related components",
    relatedPatterns: "Related Patterns",
    sourcePaths: "Source paths",
    source: "View source",
    back: "View all Recipes",
  },
} as const

export function RecipeDetail({ recipe, locale }: { recipe: RecipeEntry; locale: Locale }) {
  const text = copy[locale]
  const relatedComponents = designCatalog.components.filter(({ id }) =>
    recipe.components.includes(id),
  )
  const relatedPatterns = designCatalog.patterns.filter(({ id }) =>
    recipe.relatedPatterns.includes(id),
  )
  const patternsHref = getDesignPageHref("/design/patterns", locale)

  return (
    <article>
      <header className={`${styles.masthead} ${styles.recipeMasthead}`}>
        <h1>{recipe.title[locale]}</h1>
        <p>{recipe.summary[locale]}</p>
        <dl className={styles.recipeMetadata}>
          <div>
            <dt>{text.category}</dt>
            <dd>{categoryCopy[locale][recipe.category]}</dd>
          </div>
          <div>
            <dt>{text.components}</dt>
            <dd>{recipe.components.map((componentId) => <code key={componentId}>{componentId}</code>)}</dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="recipe-preview-title" className={styles.section}>
        <h2 id="recipe-preview-title">{text.preview}</h2>
        <RecipePreview
          demoKey={recipe.demoKey}
          label={`${recipe.title[locale]} ${text.previewLabel}`}
          locale={locale}
        />
      </section>

      <section aria-labelledby="recipe-when-title" className={styles.section}>
        <h2 id="recipe-when-title">{text.when}</h2>
        <div className={styles.usageGuidance}>
          <div>
            <h3>{text.use}</h3>
            <p>{recipe.whenToUse[locale]}</p>
          </div>
          <div>
            <h3>{text.avoid}</h3>
            <p>{recipe.whenNotToUse[locale]}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="recipe-anatomy-title" className={styles.section}>
        <h2 id="recipe-anatomy-title">{text.anatomy}</h2>
        <ol className={styles.recipeRuleList}>
          {recipe.anatomy.map((item, index) => (
            <li key={item.en}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <p>{item[locale]}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="recipe-states-title" className={styles.section}>
        <h2 id="recipe-states-title">{text.states}</h2>
        <ul
          aria-label={`${recipe.title[locale]} ${text.stateInspections}`}
          className={`${styles.stateList} ${styles.recipeStateList}`}
        >
          {recipe.states.map((state) => (
            <li data-testid={`recipe-state-${state.id}`} key={state.id}>
              <div className={styles.stateGuidance}>
                <div className={styles.stateHeading}>
                  <code>{state.id}</code>
                  <span data-inspection-mode={state.inspection.mode}>
                    {stateInspectionCopy[locale][state.inspection.mode]}
                  </span>
                </div>
                <p>{state.guidance[locale]}</p>
                {state.inspection.instruction ? (
                  <p className={styles.stateInstruction}>{state.inspection.instruction[locale]}</p>
                ) : null}
              </div>
              <RecipePreview
                demoKey={recipe.demoKey}
                inspectionMode={state.inspection.mode}
                label={`${recipe.title[locale]} ${state.id} ${text.statePreview}`}
                locale={locale}
                state={state.id}
              />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recipe-responsive-title" className={styles.section}>
        <h2 id="recipe-responsive-title">{text.responsive}</h2>
        <ol className={styles.recipeRuleList}>
          {recipe.responsive.map((rule, index) => (
            <li key={rule.en}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <p>{rule[locale]}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="recipe-accessibility-title" className={styles.section}>
        <h2 id="recipe-accessibility-title">{text.accessibility}</h2>
        <p className={styles.componentProse}>{recipe.accessibility[locale]}</p>
      </section>

      <section aria-labelledby="recipe-usage-title" className={styles.section}>
        <h2 id="recipe-usage-title">{text.usage}</h2>
        <RecipeCode locale={locale} recipe={recipe} />
      </section>

      <section aria-labelledby="recipe-related-title" className={styles.section}>
        <h2 id="recipe-related-title">{text.related}</h2>
        <div className={styles.relatedDocumentation}>
          <div>
            <h3>{text.relatedComponents}</h3>
            <ul>
              {relatedComponents.map((component) => (
                <li key={component.id}>
                  <Link href={getDesignPageHref(`/design/components/${component.id}`, locale)}>
                    {component.id}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>{text.relatedPatterns}</h3>
            <ul>
              {relatedPatterns.map((pattern) => (
                <li key={pattern.id}>
                  <Link href={`${patternsHref}#pattern-${pattern.id}`}>
                    {pattern.title[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="recipe-source-title" className={styles.section}>
        <h2 id="recipe-source-title">{text.sourcePaths}</h2>
        <ul className={styles.recipeSourceList}>
          {recipe.sourcePaths.map((sourcePath) => (
            <li key={sourcePath}>
              <code>{sourcePath}</code>
              <a href={`${githubSourceRoot}${sourcePath}`} rel="noreferrer noopener" target="_blank">
                {text.source}
              </a>
            </li>
          ))}
        </ul>
        <Link className={styles.componentDetailLink} href={getDesignPageHref("/design/recipes", locale)}>
          {text.back}
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </article>
  )
}
