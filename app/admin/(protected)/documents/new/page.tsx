import styles from "@/app/admin/admin.module.css"
import { DocumentEditor } from "@/components/admin/document-editor"
import { requireAdmin } from "@/lib/auth/require-admin"

export default async function NewDocumentPage() {
  await requireAdmin()

  return (
    <div className={styles.documentsPage}>
      <div className={styles.documentsHeading}>
        <div>
          <p className={styles.eyebrow}>New series</p>
          <h1>Create document</h1>
        </div>
      </div>
      <DocumentEditor />
    </div>
  )
}
