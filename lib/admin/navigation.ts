export type AdminNavItemId = "documents" | "categories" | "assets" | "analytics" | "agent"
export type AdminNavGroupId = "content" | "operations" | "system"

export type AdminNavItem = Readonly<{
  id: AdminNavItemId
  href: string
  parentId?: AdminNavItemId
}>

export type AdminNavGroup = Readonly<{
  id: AdminNavGroupId
  items: readonly AdminNavItem[]
}>

export const adminNavigation = [
  {
    id: "content",
    items: [
      { id: "documents", href: "/admin/documents" },
      {
        id: "categories",
        href: "/admin/documents/categories",
        parentId: "documents",
      },
      { id: "assets", href: "/admin/assets" },
    ],
  },
  {
    id: "operations",
    items: [{ id: "analytics", href: "/admin/analytics" }],
  },
  {
    id: "system",
    items: [{ id: "agent", href: "/admin/agent" }],
  },
] as const satisfies readonly AdminNavGroup[]

export function activeAdminNavItem(pathname: string): AdminNavItemId | null {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname

  if (normalizedPath === "/admin/documents/categories") return "categories"
  if (
    normalizedPath === "/admin/documents"
    || normalizedPath.startsWith("/admin/documents/")
  ) return "documents"
  if (normalizedPath === "/admin/assets") return "assets"
  if (normalizedPath === "/admin/analytics") return "analytics"
  if (normalizedPath === "/admin/agent") return "agent"

  return null
}
