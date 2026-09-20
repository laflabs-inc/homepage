import type { ComponentEntry } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import contentStyles from "@/components/content/content.module.css"
import { CodeCopyButton } from "./code-copy-button"
import styles from "./design-system.module.css"

const codeRegionLabels = {
  ko: "사용 코드",
  en: "Usage code",
} as const

export function ComponentCode({ component, locale }: { component: ComponentEntry; locale: Locale }) {
  return (
    <div className={`${contentStyles.codeBlock} ${styles.componentCode}`}>
      <div className={contentStyles.codeToolbar}>
        <span>TSX</span>
        <CodeCopyButton
          source={component.usageExample}
          componentSlug={component.id}
          locale={locale}
        />
      </div>
      <pre
        className={contentStyles.pre}
        role="region"
        aria-label={codeRegionLabels[locale]}
        tabIndex={0}
      >
        <code>{component.usageExample}</code>
      </pre>
    </div>
  )
}
