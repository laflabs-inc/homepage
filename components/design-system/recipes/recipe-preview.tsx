import type { ComponentType } from "react"

import type { RecipeDemoKey } from "@/lib/design-system/recipe-options"
import type { ComponentStateInspectionMode } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import { recipeDemos, type RecipeDemoProps } from "./recipe-demo-registry"
import styles from "./recipe-demos.module.css"

export function RecipePreview({
  demoKey,
  label,
  locale,
  state,
  inspectionMode = "fixture",
}: {
  demoKey: RecipeDemoKey
  label: string
  locale: Locale
  state?: string
  inspectionMode?: ComponentStateInspectionMode
}) {
  const Demo = recipeDemos[demoKey as keyof typeof recipeDemos] as
    | ComponentType<RecipeDemoProps>
    | undefined

  if (!Demo) throw new Error(`Missing recipe demo: ${demoKey}`)

  return (
    <div
      aria-label={label}
      className={styles.preview}
      data-inspection-mode={inspectionMode}
      role="region"
    >
      <Demo locale={locale} state={state} />
    </div>
  )
}
