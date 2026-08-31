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
