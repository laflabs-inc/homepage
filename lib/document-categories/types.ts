import type { AdminActor } from "@/lib/auth/admin-api"
import type { DocumentKind } from "@/lib/documents/types"

export type DocumentCategory = {
  id: string
  kind: DocumentKind
  slug: string
  labelKo: string
  labelEn: string
  sortOrder: number
  active: boolean
  version: number
  createdBy: string
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

export type DocumentCategoryInput = Pick<
  DocumentCategory,
  "kind" | "slug" | "labelKo" | "labelEn" | "sortOrder"
>

export type DocumentCategoryUpdate = Pick<
  DocumentCategory,
  "labelKo" | "labelEn" | "sortOrder" | "active" | "version"
>

export type DocumentCategorySnapshot = Pick<
  DocumentCategory,
  "id" | "kind" | "slug" | "labelKo" | "labelEn" | "sortOrder" | "active" | "version"
>

export type DocumentCategoryListFilter = {
  kind?: DocumentKind
  active?: boolean
}

export type DocumentCategoryReorderInput = {
  kind: DocumentKind
  items: Array<{ id: string; version: number }>
}

export interface DocumentCategoryRepository {
  list(filter?: DocumentCategoryListFilter): Promise<DocumentCategory[]>
  create(input: DocumentCategoryInput, actor: AdminActor): Promise<
    { status: "created"; category: DocumentCategory } | { status: "slug_conflict" }
  >
  update(id: string, input: DocumentCategoryUpdate, actor: AdminActor): Promise<
    { status: "updated"; category: DocumentCategory }
    | { status: "not_found" }
    | { status: "version_conflict" }
  >
  reorder(input: DocumentCategoryReorderInput, actor: AdminActor): Promise<
    { status: "updated"; categories: DocumentCategory[] }
    | { status: "version_conflict" }
    | { status: "category_set_changed" }
  >
}
