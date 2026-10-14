import { notFound } from "next/navigation"

import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page"
import { DocumentEditor } from "@/components/admin/document-editor"
import { adminCopy } from "@/lib/admin/i18n"
import { getAdminLocale } from "@/lib/admin/locale"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createDocumentCategoryService } from "@/lib/document-categories/service"
import { documentCategoryStore } from "@/lib/document-categories/store"
import { documentService } from "@/lib/documents/service"
import { revisionIdSchema } from "@/lib/documents/validation"

const categoryService = createDocumentCategoryService(documentCategoryStore)

export const dynamic = "force-dynamic"

export default async function DocumentRevisionPage({
  params,
}: {
  params: Promise<{ revisionId: string }>
}) {
  await requireAdmin()
  const { revisionId } = await params
  if (!revisionIdSchema.safeParse(revisionId).success) notFound()
  const revision = await documentService.getRevision(revisionId)
  if (!revision) notFound()
  const categories = await categoryService.list({ kind: revision.kind })
  const locale = await getAdminLocale()
  const t = adminCopy[locale].documents

  return (
    <AdminPage>
      <AdminPageHeader
        description={`${revision.locale === "ko" ? t.korean : t.english} · ${t.editor.revision} ${revision.revision}`}
        eyebrow={`${t.editor.editDocument} · ${t[revision.kind]} · ${t[revision.status]}`}
        title={revision.title}
      />
      <DocumentEditor revision={revision} categories={categories} />
    </AdminPage>
  )
}
