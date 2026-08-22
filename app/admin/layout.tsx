import type { Metadata } from "next"
import Link from "next/link"

import { Logo } from "@/components/ui/logo"
import styles from "./admin.module.css"

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" aria-label="LafLabs homepage">
          <Logo />
        </Link>
        <span className={styles.headerLabel}>Admin / Private</span>
      </header>
      <div className={styles.content}>{children}</div>
    </main>
  )
}
