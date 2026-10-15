import type { Metadata } from "next"
import Link from "next/link"

import { AdminPage, AdminPageHeader, AdminSection } from "@/components/admin/admin-page"
import { MarkdownAuthoringGuide } from "@/components/admin/markdown-authoring-guide"
import { ButtonLink } from "@/components/ui/button-link"
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
    <AdminPage>
      <AdminPageHeader
        actions={(
          <ButtonLink href="/markdown-guide.md" target="_blank" rel="noreferrer" variant="secondary">
            {t.source}
          </ButtonLink>
        )}
        breadcrumbs={(
          <Link href="/admin/documents">
            <span aria-hidden="true">←</span> {t.backToList}
          </Link>
        )}
        eyebrow={t.label}
        title={t.title}
      />
      <AdminSection aria-label={t.title}>
        <MarkdownAuthoringGuide locale={locale} showTitle={false} />
      </AdminSection>
    </AdminPage>
  )
}
