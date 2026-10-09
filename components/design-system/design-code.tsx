import contentStyles from "@/components/content/content.module.css"
import type { Locale } from "@/lib/i18n"
import { CodeCopyButton } from "./code-copy-button"
import styles from "./design-system.module.css"

const codeRegionLabels = {
  ko: "사용 코드",
  en: "Usage code",
} as const

export function DesignCode({
  locale,
  source,
  targetId,
}: {
  locale: Locale
  source: string
  targetId: string
}) {
  return (
    <div className={`${contentStyles.codeBlock} ${styles.componentCode}`}>
      <div className={contentStyles.codeToolbar}>
        <span>TSX</span>
        <CodeCopyButton locale={locale} source={source} targetId={targetId} />
      </div>
      <pre
        aria-label={codeRegionLabels[locale]}
        className={contentStyles.pre}
        role="region"
        tabIndex={0}
      >
        <code>{source}</code>
      </pre>
    </div>
  )
}
