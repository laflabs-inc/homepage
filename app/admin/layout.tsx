import type { Metadata } from "next"
import Link from "next/link"

import { AdminLanguageToggle } from "@/components/admin/admin-language-toggle"
import { Logo } from "@/components/ui/logo"
import { adminCopy } from "@/lib/admin/i18n"
import { getAdminLocale } from "@/lib/admin/locale"
import styles from "./admin.module.css"

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getAdminLocale()
  const t = adminCopy[locale].shell

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" aria-label={t.homeLabel}>
          <Logo />
        </Link>
        <div className={styles.headerMeta}>
          <span className={styles.headerLabel}>{t.privateLabel}</span>
          <AdminLanguageToggle />
        </div>
      </header>
      <div className={styles.content}>{children}</div>
    </main>
  )
}
