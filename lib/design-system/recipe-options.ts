export const recipeCategories = ["action", "form", "collection", "system-state"] as const

export type RecipeCategory = typeof recipeCategories[number]

export const recipeDemoKeys = [
  "document-publishing-toolbar",
  "search-filter-field",
  "document-settings-form",
  "collection-state-surface",
] as const

export type RecipeDemoKey = typeof recipeDemoKeys[number]
