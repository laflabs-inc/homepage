export const designRecipeSlugs = [
  "document-publishing-toolbar",
  "search-filter-field",
  "document-settings-form",
  "collection-state-surface",
] as const

export type DesignRecipeSlug = (typeof designRecipeSlugs)[number]
