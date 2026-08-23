import Link from "next/link"
import { notFound } from "next/navigation"
import { z } from "zod"

import styles from "@/app/admin/admin.module.css"
import { DocumentList } from "@/components/admin/document-list"
import { requireAdmin } from "@/lib/auth/require-admin"
import { toAdminDocumentListRow } from "@/lib/documents/admin-list"
import { documentService } from "@/lib/documents/service"
import { decodeAdminDocumentCursor, encodeAdminDocumentCursor } from "@/lib/http/cursor"
import { documentKinds, documentLocales, documentStatuses } from "@/lib/documents/types"

export const dynamic = "force-dynamic"

const pageQuerySchema = z.object({
  kind: z.enum(documentKinds).optional(),
  locale: z.enum(documentLocales).optional(),
  status: z.enum(documentStatuses).optional(),
  search: z.string().trim().min(1).max(160).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().max(512).optional(),
}).strict()

export default async function DocumentsPage({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
} = {}) {
  await requireAdmin()
  const parsed = pageQuerySchema.safeParse(await searchParams)
  if (!parsed.success) notFound()
  const { cursor, ...filter } = parsed.data
  const before = cursor ? decodeAdminDocumentCursor(cursor) : undefined
  if (cursor && !before) notFound()
  const page = await documentService.listAdminSummaries(before ? { ...filter, before } : filter)
  const rows = page.items.map(toAdminDocumentListRow)
  const initialFilters = {
    search: filter.search,
    kind: filter.kind,
    status: filter.status,
    locale: filter.locale,
  }

  return (
    <section className={styles.documentsPage}>
      <div className={styles.documentsHeading}>
        <div>
          <p className={styles.eyebrow}>Publishing workspace</p>
          <h1>Documents</h1>
        </div>
        <Link className={styles.primaryLink} href="/admin/documents/new">New document</Link>
      </div>
      <DocumentList
        rows={rows}
        nextCursor={page.nextCursor ? encodeAdminDocumentCursor(page.nextCursor) : null}
        limit={filter.limit}
        initialFilters={initialFilters}
      />
    </section>
  )
}
