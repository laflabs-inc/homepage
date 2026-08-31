import { describe, expect, it, vi } from "vitest"

import {
createDocumentCategoryService,
} from "@/lib/document-categories/service"
import type {
  DocumentCategory,
  DocumentCategoryRepository,
} from "@/lib/document-categories/types"
import type { AdminActor } from "@/lib/auth/admin-api"

const actor: AdminActor = { githubId: "42", name: "Laf Admin" }
const category: DocumentCategory = {
  id: "00000000-0000-4000-8000-000000000001",
  kind: "notice",
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

function repository(
  overrides: Partial<DocumentCategoryRepository> = {},
): DocumentCategoryRepository {
  return {
    list: vi.fn().mockResolvedValue([category]),
    create: vi.fn().mockResolvedValue({ status: "created", category }),
    update: vi.fn().mockResolvedValue({ status: "updated", category }),
    reorder: vi.fn().mockResolvedValue({ status: "updated", categories: [category] }),
    ...overrides,
  }
}

describe("document category service", () => {
  it("normalizes input before creating a category", async () => {
    const repo = repository()
    const service = createDocumentCategoryService(repo)

    await service.create({
      kind: "notice",
      slug: "  Product-Updates ",
      labelKo: " 제품 소식 ",
      labelEn: " Product updates ",
      sortOrder: 4,
    }, actor)

    expect(repo.create).toHaveBeenCalledWith({
      kind: "notice",
      slug: "product-updates",
      labelKo: "제품 소식",
      labelEn: "Product updates",
      sortOrder: 4,
    }, actor)
  })

  it("maps duplicate slugs to a stable conflict", async () => {
    const service = createDocumentCategoryService(repository({
      create: vi.fn().mockResolvedValue({ status: "slug_conflict" }),
    }))

    await expect(service.create({
      kind: "notice",
      slug: "general",
      labelKo: "일반",
      labelEn: "General",
      sortOrder: 0,
    }, actor)).rejects.toMatchObject({
      code: "slug_conflict",
    })
  })

  it("maps stale updates to a version conflict", async () => {
    const service = createDocumentCategoryService(repository({
      update: vi.fn().mockResolvedValue({ status: "version_conflict" }),
    }))

    await expect(service.update(category.id, {
      labelKo: "일반",
      labelEn: "General",
      sortOrder: 0,
      active: false,
      version: 1,
    }, actor)).rejects.toMatchObject({
      code: "version_conflict",
    })
  })

  it("preserves an unchanged inactive category but rejects a new inactive selection", async () => {
    const inactive = { ...category, active: false }
    const service = createDocumentCategoryService(repository({
      list: vi.fn().mockResolvedValue([inactive]),
    }))

    await expect(service.requireAssignable("notice", "general", "general")).resolves.toBeUndefined()
    await expect(service.requireAssignable("notice", "general", null)).rejects.toMatchObject({
      code: "category_inactive",
    })
  })

  it("rejects categories belonging to another document kind", async () => {
    const service = createDocumentCategoryService(repository({
      list: vi.fn().mockResolvedValue([{ ...category, kind: "legal", slug: "privacy" }]),
    }))

    await expect(service.requireAssignable("notice", "privacy", null)).rejects.toMatchObject({
      code: "invalid_category",
    })
  })

  it("maps an incomplete reorder set to a stable conflict", async () => {
    const service = createDocumentCategoryService(repository({
      reorder: vi.fn().mockResolvedValue({ status: "category_set_changed" }),
    }))

    await expect(service.reorder({
      kind: "notice",
      items: [{ id: category.id, version: 1 }],
    }, actor)).rejects.toMatchObject({
      code: "category_set_changed",
    })
  })

  it("hides storage failures behind unavailable", async () => {
    const service = createDocumentCategoryService(repository({
      list: vi.fn().mockRejectedValue(new Error("DATABASE_URL=secret")),
    }))

    await expect(service.list()).rejects.toMatchObject({
      code: "unavailable",
      message: "Document category storage is unavailable",
    })
  })
})
