import { designComponentSlugs } from "@/lib/design-system/component-slugs"
import { designRecipeSlugs } from "@/lib/design-system/recipe-slugs"

export const publicAnalyticsPaths = new Set<string>([
  "/",
  ...designComponentSlugs.map((slug) => `/design/components/${slug}`),
  "/design/recipes",
  ...designRecipeSlugs.map((slug) => `/design/recipes/${slug}`),
])

export function supportsPublicAnalytics(pathname: string): boolean {
  return publicAnalyticsPaths.has(pathname)
}
