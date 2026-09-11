import Link from "next/link"

import { documentNavigationCopy, documentSections } from "@/lib/content"
import type { DocumentKind, Locale } from "@/lib/documents/types"
import styles from "./content.module.css"

const documentKinds = ["notice", "disclosure", "legal"] as const satisfies readonly DocumentKind[]

export function DocumentMasthead({ kind, locale }: { kind: DocumentKind; locale: Locale }) {
  const copy = documentSections[kind].localized[locale]

  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderCopy}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 id="document-index-title">{copy.title}</h1>
        <p>{copy.description}</p>
      </div>

      <nav className={styles.documentKindNav} aria-label={documentNavigationCopy[locale].label}>
        {documentKinds.map((targetKind) => {
          const target = documentSections[targetKind]
          const active = targetKind === kind

          return (
            <Link
              key={targetKind}
              href={`${target.path}?locale=${locale}`}
              aria-current={active ? "page" : undefined}
            >
              <span aria-hidden="true" />
              {target.localized[locale].title}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
