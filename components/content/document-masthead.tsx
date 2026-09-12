import { documentSections } from "@/lib/content"
import type { DocumentKind, Locale } from "@/lib/documents/types"
import styles from "./content.module.css"

export function DocumentMasthead({ kind, locale }: { kind: DocumentKind; locale: Locale }) {
  const copy = documentSections[kind].localized[locale]

  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderCopy}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 id="document-index-title">{copy.title}</h1>
        <p>{copy.description}</p>
      </div>
    </header>
  )
}
