import { actionComponents } from "./component-catalog/actions"
import { coreExpansionComponents } from "./component-catalog/core-expansion"
import { coreExpansionC2Components } from "./component-catalog/core-expansion-c2"
import { coreUiC3CComponents } from "./component-catalog/c3c"
import { existingComponents } from "./component-catalog/existing"
import { feedbackComponents } from "./component-catalog/feedback"
import { formComponents } from "./component-catalog/forms"
import { disclosureComponents } from "./component-catalog/disclosure"
import { navigationComponents } from "./component-catalog/navigation"
import { overlayComponents } from "./component-catalog/overlays"
import { selectionComponents } from "./component-catalog/selection"
import { structureComponents } from "./component-catalog/structure"
import type { ComponentEntry } from "./schema"

function existing(id: string): ComponentEntry {
  const component = existingComponents.find((entry) => entry.id === id)
  if (!component) throw new Error(`Missing existing component metadata: ${id}`)
  return component
}

export const components = [
  existing("logo"),
  ...actionComponents,
  ...formComponents,
  ...selectionComponents,
  existing("text-link"),
  ...navigationComponents,
  ...disclosureComponents,
  ...overlayComponents,
  ...coreExpansionComponents,
  ...coreExpansionC2Components,
  ...coreUiC3CComponents,
  ...feedbackComponents,
  ...structureComponents,
  existing("code-block"),
] as const satisfies readonly ComponentEntry[]
