import { notFound } from "next/navigation"
import { z } from "zod"

import { AssetLibrary } from "@/components/admin/asset-library"
import { EmptyState } from "@/components/ui/empty-state"
import { adminCopy } from "@/lib/admin/i18n"
import { getAdminLocale } from "@/lib/admin/locale"
import { toAdminAsset } from "@/lib/assets/admin-summary"
import { decodeAssetCursor, encodeAssetCursor } from "@/lib/assets/cursor"
import { assetService } from "@/lib/assets/service"
import { mediaAssetStatuses, mediaTypes } from "@/lib/assets/types"
import { requireAdmin } from "@/lib/auth/require-admin"
import { isMediaConfigured } from "@/lib/env"

import styles from "@/components/admin/asset-library.module.css"

export const dynamic = "force-dynamic"

const querySchema = z.object({
  search: z.string().trim().max(160).optional(),
  type: z.enum(mediaTypes).optional(),
  status: z.enum(mediaAssetStatuses).optional(),
  tag: z.string().trim().max(40).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().max(512).optional(),
}).strict()

export default async function AssetsPage({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
} = {}) {
  await requireAdmin()
  const locale = await getAdminLocale()
  const t = adminCopy[locale].assets

  if (!isMediaConfigured()) {
    return (
      <section className={styles.page}>
        <EmptyState
          className={styles.unavailable}
          title={t.unavailableHeading}
          description={t.unavailableDescription}
        />
      </section>
    )
  }

  const parsed = querySchema.safeParse(await searchParams)
  if (!parsed.success) notFound()
  const { cursor, type, search, tag, ...baseFilter } = parsed.data
  const before = cursor ? decodeAssetCursor(cursor) : undefined
  if (cursor && !before) notFound()
  const filter = {
    ...baseFilter,
    ...(search ? { search } : {}),
    ...(tag ? { tag } : {}),
    ...(type ? { mediaType: type } : {}),
    ...(before ? { before } : {}),
  }
  const page = await assetService.list(filter)

  return (
    <AssetLibrary
      key={[search ?? "", type ?? "", baseFilter.status ?? "", tag ?? "", baseFilter.limit].join(":")}
      assets={page.items.map(toAdminAsset)}
      nextCursor={page.nextCursor ? encodeAssetCursor(page.nextCursor) : null}
      initialFilters={{
        search: search || undefined,
        type,
        status: baseFilter.status,
        tag: tag || undefined,
      }}
      limit={baseFilter.limit}
    />
  )
}
