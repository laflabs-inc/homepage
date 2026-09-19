export const designComponentSlugs = [
  "logo",
  "action",
  "segmented-toggle",
  "icon-control",
  "text-link",
  "code-block",
] as const

export type DesignComponentSlug = (typeof designComponentSlugs)[number]
