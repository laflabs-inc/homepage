export const componentCategories = [
  "brand",
  "action",
  "form",
  "selection",
  "navigation",
  "disclosure",
  "overlay",
  "feedback",
  "content",
  "structure",
] as const

export type ComponentCategory = typeof componentCategories[number]

export const componentDemoKeys = [
  "logo",
  "action",
  "button",
  "button-group",
  "field",
  "label",
  "input",
  "textarea",
  "native-select",
  "select",
  "checkbox",
  "radio-group",
  "switch",
  "alert",
  "skeleton",
  "empty-state",
  "separator",
  "segmented-toggle",
  "icon-control",
  "text-link",
  "dropdown-menu",
  "tabs",
  "accordion",
  "dialog",
  "tooltip",
  "code-block",
] as const

export type DemoKey = typeof componentDemoKeys[number]
