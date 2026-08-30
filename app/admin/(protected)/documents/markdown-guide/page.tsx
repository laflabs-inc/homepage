import type { Metadata } from "next"
import Link from "next/link"

import styles from "@/app/admin/admin.module.css"
import { MarkdownAuthoringGuide } from "@/components/admin/markdown-authoring-guide"
import { requireAdmin } from "@/lib/auth/require-admin"
import { adminCopy } from "@/lib/admin/i18n"
import { getAdminLocale } from "@/lib/admin/locale"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAdminLocale()

  return { title: adminCopy[locale].documents.markdownGuide.metadataTitle }
}

export default async function MarkdownGuidePage() {
  await requireAdmin()
  const locale = await getAdminLocale()
  const t = adminCopy[locale].documents.markdownGuide

  return (
    <div className={styles.markdownGuidePage}>
      <div className={styles.markdownGuideToolbar}>
        <Link href="/admin/documents">
          <span aria-hidden="true">←</span> {t.backToList}
        </Link>
        <a href="/markdown-guide.md" target="_blank" rel="noreferrer">{t.source}</a>
        <span>{t.label}</span>
      </div>
      <MarkdownAuthoringGuide locale={locale} />
    </div>
  )
}
