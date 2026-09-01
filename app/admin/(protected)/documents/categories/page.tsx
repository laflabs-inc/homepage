import type { Metadata } from "next"

import { DocumentCategoryManager } from "@/components/admin/document-category-manager"
import { adminCopy } from "@/lib/admin/i18n"
import { getAdminLocale } from "@/lib/admin/locale"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createDocumentCategoryService } from "@/lib/document-categories/service"
import { documentCategoryStore } from "@/lib/document-categories/store"
import type { DocumentCategory, DocumentCategorySnapshot } from "@/lib/document-categories/types"

export const dynamic = "force-dynamic"

const categoryService = createDocumentCategoryService(documentCategoryStore)

function toSnapshot(category: DocumentCategory): DocumentCategorySnapshot {
  return {
    id: category.id,
    kind: category.kind,
    slug: category.slug,
    labelKo: category.labelKo,
    labelEn: category.labelEn,
    sortOrder: category.sortOrder,
    active: category.active,
    version: category.version,
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAdminLocale()
  return { title: adminCopy[locale].documents.categoryManager.heading }
}

export default async function DocumentCategoriesPage() {
  await requireAdmin()
  const categories = (await categoryService.list()).map(toSnapshot)

  return <DocumentCategoryManager initialCategories={categories} />
}
