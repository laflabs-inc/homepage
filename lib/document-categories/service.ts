import type { AdminActor } from "@/lib/auth/admin-api"
import type {
  DocumentCategoryInput,
  DocumentCategoryListFilter,
  DocumentCategoryRepository,
  DocumentCategoryReorderInput,
  DocumentCategoryUpdate,
} from "@/lib/document-categories/types"
import {
  categoryCreateSchema,
  categoryReorderSchema,
  categoryUpdateSchema,
} from "@/lib/document-categories/validation"
import type { DocumentKind } from "@/lib/documents/types"

export type CategoryServiceErrorCode =
  | "invalid_category"
  | "category_inactive"
  | "slug_conflict"
  | "not_found"
  | "version_conflict"
  | "category_set_changed"
  | "unavailable"

export class CategoryServiceError extends Error {
  constructor(
    public readonly code: CategoryServiceErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = "CategoryServiceError"
  }
}

function invalidInput(): never {
  throw new CategoryServiceError("invalid_category", "Document category input is invalid")
}

export function createDocumentCategoryService(repository: DocumentCategoryRepository) {
  async function stored<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (error instanceof CategoryServiceError) throw error
      throw new CategoryServiceError(
        "unavailable",
        "Document category storage is unavailable",
        { cause: error },
      )
    }
  }

  return {
    async list(filter?: DocumentCategoryListFilter) {
      return stored(() => repository.list(filter))
    },
    async create(input: DocumentCategoryInput, actor: AdminActor) {
      const parsed = categoryCreateSchema.safeParse(input)
      if (!parsed.success) return invalidInput()
      return stored(async () => {
        const result = await repository.create(parsed.data, actor)
        if (result.status === "slug_conflict") {
          throw new CategoryServiceError("slug_conflict", "That category slug already exists")
        }
        return result.category
      })
    },
    async update(id: string, input: DocumentCategoryUpdate, actor: AdminActor) {
      const parsed = categoryUpdateSchema.safeParse(input)
      if (!parsed.success) return invalidInput()
      return stored(async () => {
        const result = await repository.update(id, parsed.data, actor)
        if (result.status === "not_found") {
          throw new CategoryServiceError("not_found", "Document category was not found")
        }
        if (result.status === "version_conflict") {
          throw new CategoryServiceError(
            "version_conflict",
            "Document category changed before it could be updated",
          )
        }
        return result.category
      })
    },
    async reorder(input: DocumentCategoryReorderInput, actor: AdminActor) {
      const parsed = categoryReorderSchema.safeParse(input)
      if (!parsed.success) return invalidInput()
      return stored(async () => {
        const result = await repository.reorder(parsed.data, actor)
        if (result.status === "version_conflict") {
          throw new CategoryServiceError(
            "version_conflict",
            "A category changed before the order could be updated",
          )
        }
        if (result.status === "category_set_changed") {
          throw new CategoryServiceError(
            "category_set_changed",
            "The category set changed before the order could be updated",
          )
        }
        return result.categories
      })
    },
    async requireAssignable(
      kind: DocumentKind,
      category: string | null | undefined,
      currentCategory: string | null,
    ) {
      if (category == null) return
      const categories = await stored(() => repository.list({ kind }))
      const match = categories.find((candidate) => (
        candidate.kind === kind && candidate.slug === category
      ))
      if (!match) {
        throw new CategoryServiceError(
          "invalid_category",
          "Category is not available for this document kind",
        )
      }
      if (!match.active && currentCategory !== category) {
        throw new CategoryServiceError(
          "category_inactive",
          "Inactive categories cannot be newly assigned",
        )
      }
    },
  }
}
