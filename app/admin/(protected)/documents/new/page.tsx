import styles from "@/app/admin/admin.module.css"
import { DocumentEditor } from "@/components/admin/document-editor"
import { requireAdmin } from "@/lib/auth/require-admin"
import { documentService } from "@/lib/documents/service"
import { revisionIdSchema } from "@/lib/documents/validation"

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ seriesId?: string | string[]; sourceRevisionId?: string | string[] }>
}) {
  await requireAdmin()
  const query = await searchParams
  const seriesId = typeof query.seriesId === "string" ? query.seriesId : undefined
  const sourceRevisionId = typeof query.sourceRevisionId === "string" ? query.sourceRevisionId : undefined
  let templateRevision
  if (revisionIdSchema.safeParse(seriesId).success && revisionIdSchema.safeParse(sourceRevisionId).success) {
    templateRevision = (await documentService.listAdmin({ seriesId })).find((candidate) => (
      candidate.id === sourceRevisionId && candidate.locale === "ko"
    ))
  }

  return (
    <div className={styles.documentsPage}>
      <div className={styles.documentsHeading}>
        <div>
          <p className={styles.eyebrow}>New series</p>
          <h1>Create document</h1>
        </div>
      </div>
      <DocumentEditor
        seriesId={templateRevision ? seriesId : undefined}
        templateRevision={templateRevision}
      />
    </div>
  )
}
