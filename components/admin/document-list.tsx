import Link from "next/link"

import styles from "@/app/admin/admin.module.css"
import type { DocumentRevision } from "@/lib/documents/types"

export function DocumentList({ revisions }: { revisions: DocumentRevision[] }) {
  if (revisions.length === 0) {
    return (
      <div className={styles.documentEmpty}>
        <h2>No documents yet</h2>
        <p>Create the first Korean document draft to begin a publication series.</p>
      </div>
    )
  }

  return (
    <ul className={styles.documentList}>
      {revisions.map((revision) => (
        <li key={revision.id}>
          <Link href={`/admin/documents/${revision.id}`}>
            <span className={styles.documentListTitle}>{revision.title}</span>
            <span>{revision.kind} / {revision.locale} / r{revision.revision}</span>
            <span className={styles.statusBadge}>{revision.status}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
