import { notFound } from "next/navigation"

import styles from "@/app/admin/admin.module.css"
import { DocumentEditor } from "@/components/admin/document-editor"
import { requireAdmin } from "@/lib/auth/require-admin"
import { documentService } from "@/lib/documents/service"

export const dynamic = "force-dynamic"

export default async function DocumentRevisionPage({
  params,
}: {
  params: Promise<{ revisionId: string }>
}) {
  await requireAdmin()
  const { revisionId } = await params
  const revision = (await documentService.listAdmin()).find(({ id }) => id === revisionId)
  if (!revision) notFound()

  return (
    <div className={styles.documentsPage}>
      <DocumentEditor revision={revision} />
    </div>
  )
}
