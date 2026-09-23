import { actionComponents } from "./component-catalog/actions"
import { existingComponents } from "./component-catalog/existing"
import { feedbackComponents } from "./component-catalog/feedback"
import { formComponents } from "./component-catalog/forms"
import { disclosureComponents } from "./component-catalog/disclosure"
import { navigationComponents } from "./component-catalog/navigation"
import { overlayComponents } from "./component-catalog/overlays"
import { selectionComponents } from "./component-catalog/selection"
import type { ComponentEntry } from "./schema"

function existing(id: string): ComponentEntry {
  const component = existingComponents.find((entry) => entry.id === id)
  if (!component) throw new Error(`Missing existing component metadata: ${id}`)
  return component
}

export const components = [
  existing("logo"),
  existing("action"),
  ...actionComponents,
  ...formComponents,
  ...selectionComponents,
  existing("segmented-toggle"),
  existing("icon-control"),
  existing("text-link"),
  ...navigationComponents,
  ...disclosureComponents,
  ...overlayComponents,
  ...feedbackComponents,
  existing("code-block"),
] as const satisfies readonly ComponentEntry[]
