import styles from "@/app/admin/admin.module.css"
import { DocumentEditor } from "@/components/admin/document-editor"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createDocumentCategoryService } from "@/lib/document-categories/service"
import { documentCategoryStore } from "@/lib/document-categories/store"
import { documentService } from "@/lib/documents/service"
import type { DocumentRevision } from "@/lib/documents/types"
import { revisionIdSchema } from "@/lib/documents/validation"
import { adminCopy } from "@/lib/admin/i18n"
import { getAdminLocale } from "@/lib/admin/locale"

const categoryService = createDocumentCategoryService(documentCategoryStore)

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ seriesId?: string | string[]; sourceRevisionId?: string | string[] }>
}) {
  await requireAdmin()
  const locale = await getAdminLocale()
  const t = adminCopy[locale].documents
  const query = await searchParams
  const seriesId = typeof query.seriesId === "string" ? query.seriesId : undefined
  const sourceRevisionId = typeof query.sourceRevisionId === "string" ? query.sourceRevisionId : undefined
  let templateRevision: DocumentRevision | undefined
  const parsedSeriesId = revisionIdSchema.safeParse(seriesId)
  const parsedSourceRevisionId = revisionIdSchema.safeParse(sourceRevisionId)
  if (parsedSeriesId.success && parsedSourceRevisionId.success) {
    const candidate = await documentService.getRevision(parsedSourceRevisionId.data)
    templateRevision = candidate?.seriesId === parsedSeriesId.data && candidate.locale === "ko"
      ? candidate
      : undefined
  }
  const categories = await categoryService.list(
    templateRevision ? { kind: templateRevision.kind } : { active: true },
  )

  return (
    <div className={styles.documentsPage}>
      <div className={styles.documentsHeading}>
        <div>
          <p className={styles.eyebrow}>{t.newSeries}</p>
          <h1>{t.createDocument}</h1>
        </div>
      </div>
      <DocumentEditor
        seriesId={templateRevision ? seriesId : undefined}
        templateRevision={templateRevision}
        categories={categories}
      />
    </div>
  )
}
