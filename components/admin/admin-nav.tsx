import Link from "next/link"

import styles from "@/app/admin/admin.module.css"

export function AdminNav() {
  return (
    <nav className={styles.adminNav} aria-label="Admin">
      <Link href="/admin/analytics">Analytics</Link>
      <Link href="/admin/documents">Documents</Link>
      <Link href="/admin/agent">Agent</Link>
    </nav>
  )
}
