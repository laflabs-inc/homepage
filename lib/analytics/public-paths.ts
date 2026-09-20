import { designComponentSlugs } from "@/lib/design-system/component-slugs"

export const publicAnalyticsPaths = new Set<string>([
  "/",
  ...designComponentSlugs.map((slug) => `/design/components/${slug}`),
])

export function supportsPublicAnalytics(pathname: string): boolean {
  return publicAnalyticsPaths.has(pathname)
}
