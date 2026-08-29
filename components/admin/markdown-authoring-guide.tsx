import { MarkdownDocument } from "@/components/content/markdown-document"
import { useLocale } from "@/components/i18n/locale-provider"
import { adminCopy } from "@/lib/admin/i18n"
import { markdownAuthoringGuideSource, markdownGuideSections } from "@/lib/markdown/authoring-guide"
import styles from "@/app/admin/admin.module.css"

export function MarkdownAuthoringGuide() {
  const t = adminCopy[useLocale()].documents.markdownGuide

  return (
    <div className={styles.markdownGuide}>
      <MarkdownDocument
        title={t.title}
        source={markdownAuthoringGuideSource}
        intro={(
          <>
            <p className={styles.markdownGuideIntro}>
              {t.intro}
            </p>
            <nav className={styles.markdownGuideContents} aria-label={t.contentsLabel}>
              <span>{t.quickNavigation}</span>
              <div>
                {markdownGuideSections.map(([label, href]) => (
                  <a key={href} href={href}>{label}</a>
                ))}
              </div>
            </nav>
          </>
        )}
      />
    </div>
  )
}
