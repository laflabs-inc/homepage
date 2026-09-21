export const designComponentSlugs = [
  "logo",
  "action",
  "button",
  "button-group",
  "field",
  "label",
  "input",
  "textarea",
  "native-select",
  "checkbox",
  "radio-group",
  "switch",
  "segmented-toggle",
  "icon-control",
  "text-link",
  "alert",
  "skeleton",
  "empty-state",
  "separator",
  "code-block",
] as const

export type DesignComponentSlug = (typeof designComponentSlugs)[number]
