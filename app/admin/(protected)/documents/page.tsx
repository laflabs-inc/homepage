import Link from "next/link"

import styles from "@/app/admin/admin.module.css"
import { DocumentList } from "@/components/admin/document-list"
import { requireAdmin } from "@/lib/auth/require-admin"
import { documentService } from "@/lib/documents/service"

export const dynamic = "force-dynamic"

export default async function DocumentsPage() {
  await requireAdmin()
  const revisions = await documentService.listAdmin()

  return (
    <section className={styles.documentsPage}>
      <div className={styles.documentsHeading}>
        <div>
          <p className={styles.eyebrow}>Publishing workspace</p>
          <h1>Documents</h1>
        </div>
        <Link className={styles.primaryLink} href="/admin/documents/new">New document</Link>
      </div>
      <DocumentList revisions={revisions} />
    </section>
  )
}
