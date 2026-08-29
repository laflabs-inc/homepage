import type { Metadata } from "next"
import Link from "next/link"

import styles from "@/app/admin/admin.module.css"
import { MarkdownAuthoringGuide } from "@/components/admin/markdown-authoring-guide"
import { requireAdmin } from "@/lib/auth/require-admin"

export const metadata: Metadata = {
  title: "Markdown 작성 가이드 | Admin",
}

export default async function MarkdownGuidePage() {
  await requireAdmin()

  return (
    <div className={styles.markdownGuidePage}>
      <div className={styles.markdownGuideToolbar}>
        <Link href="/admin/documents">
          <span aria-hidden="true">←</span> 문서 목록으로 돌아가기
        </Link>
        <span>ADMIN DOCS / GUIDE</span>
      </div>
      <MarkdownAuthoringGuide />
    </div>
  )
}
