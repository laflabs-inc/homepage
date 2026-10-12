import { describe, expect, it } from "vitest"

import { activeAdminNavItem, adminNavigation } from "@/lib/admin/navigation"

describe("admin navigation", () => {
  it("keeps the workspace hierarchy and routes explicit", () => {
    expect(adminNavigation.map((group) => group.id)).toEqual([
      "content",
      "operations",
      "system",
    ])
    expect(adminNavigation).toEqual([
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
    ])
  })

  it.each([
    ["/admin/documents", "documents"],
    ["/admin/documents/", "documents"],
    ["/admin/documents/new", "documents"],
    ["/admin/documents/7d6fb96e-e399-4e5d-a740-ae8798df7e51", "documents"],
    ["/admin/documents/markdown-guide", "documents"],
    ["/admin/documents/categories", "categories"],
    ["/admin/documents/categories/", "categories"],
    ["/admin/assets", "assets"],
    ["/admin/assets/", "assets"],
    ["/admin/analytics", "analytics"],
    ["/admin/agent", "agent"],
  ] as const)("resolves %s to %s", (pathname, activeItem) => {
    expect(activeAdminNavItem(pathname)).toBe(activeItem)
  })

  it.each([
    "/admin",
    "/admin/sign-in",
    "/admin/assets/archive",
    "/admin/analytics/export",
    "/admin/agent/settings",
    "/not-admin/documents",
  ])("does not select a false match for %s", (pathname) => {
    expect(activeAdminNavItem(pathname)).toBeNull()
  })
})
