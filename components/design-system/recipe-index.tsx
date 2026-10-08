import { designCatalog, designPageEntries } from "@/lib/design-system/catalog"
import type { Locale } from "@/lib/i18n"
import { RecipeIndexClient } from "./recipe-index-client"
import styles from "./design-system.module.css"

const pageEntry = designPageEntries.find((entry) => entry.id === "recipes")

export function RecipeIndex({ locale }: { locale: Locale }) {
  if (!pageEntry) return null

  return (
    <article>
      <header className={styles.masthead}>
        <h1>{pageEntry.title[locale]}</h1>
        <p>{pageEntry.description[locale]}</p>
      </header>
      <RecipeIndexClient locale={locale} recipes={designCatalog.recipes} />
    </article>
  )
}
