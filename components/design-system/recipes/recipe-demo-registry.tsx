import type { ComponentType } from "react"

import type { RecipeDemoKey } from "@/lib/design-system/recipe-options"
import type { Locale } from "@/lib/i18n"
import { CollectionStateSurfaceDemo } from "./collection-state-surface-demo"
import { DocumentPublishingToolbarDemo } from "./document-publishing-toolbar-demo"
import { DocumentSettingsFormDemo } from "./document-settings-form-demo"
import { SearchFilterFieldDemo } from "./search-filter-field-demo"

export type RecipeDemoProps = Readonly<{
  locale: Locale
  state?: string
}>

export const recipeDemos = {
  "document-publishing-toolbar": DocumentPublishingToolbarDemo,
  "search-filter-field": SearchFilterFieldDemo,
  "document-settings-form": DocumentSettingsFormDemo,
  "collection-state-surface": CollectionStateSurfaceDemo,
} satisfies Record<RecipeDemoKey, ComponentType<RecipeDemoProps>>
