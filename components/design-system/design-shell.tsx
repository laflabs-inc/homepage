import Link from "next/link"
import type { ReactNode } from "react"

import { designPageEntries } from "@/lib/design-system/catalog"
import type { Locale } from "@/lib/i18n"
import styles from "./design-system.module.css"

export function getDesignPageHref(href: string, locale: Locale): string {
  return locale === "en" ? `${href}?locale=en` : href
}

export function DesignShell({
  locale,
  currentPath,
  children,
}: {
  locale: Locale
  currentPath: string
  children: ReactNode
}) {
  const navigationLabel = locale === "ko" ? "디자인 시스템" : "Design system"
  const menuLabel = locale === "ko" ? "디자인 시스템 문서" : "Design system documentation"

  return (
    <div className={styles.page} lang={locale}>
      <div className={styles.shell}>
        <nav className={styles.localNav} aria-label={navigationLabel}>
          <details open>
            <summary>{menuLabel}</summary>
            <p className={styles.navTitle} aria-hidden="true">
              {menuLabel}
            </p>
            <ul>
              {designPageEntries.map((entry) => {
                const isCurrent = entry.href === currentPath
                const title = entry.title[locale]
                const accessibleTitle = isCurrent
                  ? locale === "ko"
                    ? `${title}, 현재 페이지`
                    : `${title}, current page`
                  : locale === "ko"
                    ? `${title}, 문서 탐색`
                    : `${title}, documentation navigation`

                return (
                  <li key={entry.id}>
                    <Link
                      aria-current={isCurrent ? "page" : undefined}
                      aria-label={accessibleTitle}
                      href={getDesignPageHref(entry.href, locale)}
                    >
                      {title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </details>
        </nav>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
