import type { ComponentType } from "react"

import type { DemoKey } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import { componentDemos } from "./component-demo-registry"
import styles from "./design-system.module.css"

export function ComponentPreview({
  demoKey,
  label,
  locale,
  state,
}: {
  demoKey: DemoKey
  label: string
  locale: Locale
  state?: string
}) {
  const Demo = componentDemos[demoKey as keyof typeof componentDemos] as
    | ComponentType<{ locale: Locale; state?: string }>
    | undefined

  if (!Demo) throw new Error(`Missing component demo: ${demoKey}`)

  return (
    <div className={styles.componentPreview} role="region" aria-label={label}>
      <Demo locale={locale} state={state} />
    </div>
  )
}
