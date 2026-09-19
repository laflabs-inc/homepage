import type { DemoKey } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import { componentDemos } from "./component-demo-registry"
import styles from "./design-system.module.css"

export function ComponentPreview({
  demoKey,
  label,
  locale,
}: {
  demoKey: DemoKey
  label: string
  locale: Locale
}) {
  const Demo = componentDemos[demoKey]

  return (
    <div className={styles.componentPreview} role="region" aria-label={label}>
      <Demo locale={locale} />
    </div>
  )
}
