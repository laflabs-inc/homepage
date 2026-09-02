import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))

import {
  handleCreateCategory,
  handleListCategories,
} from "@/app/api/admin/document-categories/route"
import { handleUpdateCategory } from "@/app/api/admin/document-categories/[id]/route"
import { handleReorderCategories } from "@/app/api/admin/document-categories/reorder/route"
import { CategoryServiceError } from "@/lib/document-categories/service"

const actor = { githubId: "42", name: "Laf Admin" }
const category = {
  id: "00000000-0000-4000-8000-000000000001",
  kind: "notice" as const,
  slug: "general",
  labelKo: "일반",
  labelEn: "General",
  sortOrder: 0,
  active: true,
  version: 1,
  createdBy: "42",
  updatedBy: "42",
  createdAt: new Date("2026-08-31T00:00:00Z"),
  updatedAt: new Date("2026-08-31T00:00:00Z"),
}

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    authorize: vi.fn().mockResolvedValue({ ok: true, actor }),
    sameOrigin: vi.fn().mockReturnValue(true),
    service: {
      list: vi.fn().mockResolvedValue([category]),
      create: vi.fn().mockResolvedValue(category),
      update: vi.fn().mockResolvedValue({ ...category, version: 2 }),
      reorder: vi.fn().mockResolvedValue([{ ...category, version: 2 }]),
    },
    revalidate: vi.fn(),
    ...overrides,
  }
}

function jsonRequest(path: string, body: unknown, method = "POST") {
  return new Request(`https://laflabs.co${path}`, {
    method,
    headers: { "content-type": "application/json", origin: "https://laflabs.co" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.restoreAllMocks())

describe("document category admin API", () => {
  it("lists filtered categories after authorization with no-store", async () => {
    const deps = dependencies()
    const response = await handleListCategories(
      new Request("https://laflabs.co/api/admin/document-categories?kind=notice&active=true"),
      deps,
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(deps.service.list).toHaveBeenCalledWith({ kind: "notice", active: true })
    await expect(response.json()).resolves.toEqual({
      categories: [{ ...category, createdAt: category.createdAt.toISOString(), updatedAt: category.updatedAt.toISOString() }],
    })
  })

  it("rejects duplicate and unknown list parameters", async () => {
    const deps = dependencies()
    const response = await handleListCategories(
      new Request("https://laflabs.co/api/admin/document-categories?kind=notice&kind=legal&unknown=x"),
      deps,
    )

    expect(response.status).toBe(400)
    expect(deps.service.list).not.toHaveBeenCalled()
  })

  it("rejects cross-origin create before reading the body", async () => {
    const deps = dependencies({ sameOrigin: vi.fn().mockReturnValue(false) })
    const request = jsonRequest("/api/admin/document-categories", {
      kind: "notice", slug: "updates", labelKo: "업데이트", labelEn: "Updates", sortOrder: 4,
    })
    const text = vi.spyOn(request, "text")

    const response = await handleCreateCategory(request, deps)

    expect(response.status).toBe(403)
    expect(text).not.toHaveBeenCalled()
    expect(deps.service.create).not.toHaveBeenCalled()
  })

  it("creates a bounded validated category and invalidates category caches", async () => {
    const deps = dependencies()
    const input = {
      kind: "notice", slug: "updates", labelKo: "업데이트", labelEn: "Updates", sortOrder: 4,
    }
    const response = await handleCreateCategory(
      jsonRequest("/api/admin/document-categories", input),
      deps,
    )

    expect(response.status).toBe(201)
    expect(deps.service.create).toHaveBeenCalledWith(input, actor)
    expect(deps.revalidate.mock.calls).toEqual([
      ["document-categories", "max"],
      ["document-categories:notice", "max"],
      ["documents:index:notice", "max"],
    ])
  })

  it("validates the path ID and maps version conflicts", async () => {
    const deps = dependencies()
    const input = { labelKo: "일반", labelEn: "General", sortOrder: 0, active: false, version: 1 }
    const invalid = await handleUpdateCategory(
      jsonRequest("/api/admin/document-categories/not-a-uuid", input, "PATCH"),
      "not-a-uuid",
      deps,
    )
    expect(invalid.status).toBe(400)
    expect(deps.service.update).not.toHaveBeenCalled()

    deps.service.update.mockRejectedValueOnce(
      new CategoryServiceError("version_conflict", "stale"),
    )
    const conflict = await handleUpdateCategory(
      jsonRequest(`/api/admin/document-categories/${category.id}`, input, "PATCH"),
      category.id,
      deps,
    )
    expect(conflict.status).toBe(409)
    await expect(conflict.json()).resolves.toEqual({ error: "version_conflict" })
  })

  it("reorders the complete versioned set", async () => {
    const deps = dependencies()
    const input = { kind: "notice", items: [{ id: category.id, version: 1 }] }
    const response = await handleReorderCategories(
      jsonRequest("/api/admin/document-categories/reorder", input),
      deps,
    )

    expect(response.status).toBe(200)
    expect(deps.service.reorder).toHaveBeenCalledWith(input, actor)
    expect(deps.revalidate.mock.calls).toEqual([
      ["document-categories", "max"],
      ["document-categories:notice", "max"],
      ["documents:index:notice", "max"],
    ])
  })

  it("returns authorization decisions without exposing storage errors", async () => {
    const unauthorized = dependencies({
      authorize: vi.fn().mockResolvedValue({
        ok: false,
        response: Response.json({ error: "unauthenticated" }, { status: 401 }),
      }),
    })
    const denied = await handleListCategories(
      new Request("https://laflabs.co/api/admin/document-categories"),
      unauthorized,
    )
    expect(denied.status).toBe(401)
    expect(denied.headers.get("cache-control")).toBe("no-store")

    const unavailable = dependencies()
    unavailable.service.list.mockRejectedValueOnce(new Error("DATABASE_URL=secret"))
    const failed = await handleListCategories(
      new Request("https://laflabs.co/api/admin/document-categories"),
      unavailable,
    )
    expect(failed.status).toBe(503)
    await expect(failed.json()).resolves.toEqual({ error: "unavailable" })
  })
})
