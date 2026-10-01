"use client"

import {
  Archive,
  ArrowCounterClockwise,
  ArrowsClockwise,
  Copy,
  GridFour,
  LinkSimple,
  ListBullets,
  NotePencil,
  Trash,
} from "@phosphor-icons/react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState, useTransition } from "react"

import { AssetUploadQueue } from "@/components/admin/asset-upload-queue"
import styles from "@/components/admin/asset-library.module.css"
import { useLocale } from "@/components/i18n/locale-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { SegmentedToggle } from "@/components/ui/segmented-toggle"
import { StatusLabel, type StatusLabelProps } from "@/components/ui/status-label"
import { Textarea } from "@/components/ui/textarea"
import { adminCopy } from "@/lib/admin/i18n"
import type { AdminAssetSummary } from "@/lib/assets/admin-summary"
import type { MediaAssetStatus, MediaType } from "@/lib/assets/types"

type AssetUsage = {
  revisionId: string
  kind: "notice" | "legal" | "disclosure"
  locale: "ko" | "en"
  title: string
  status: "draft" | "scheduled" | "published" | "archived"
  field: string
  updatedAt: string
}

export type { AdminAssetSummary } from "@/lib/assets/admin-summary"

type AssetFilters = {
  search?: string
  type?: MediaType
  status?: MediaAssetStatus
  tag?: string
}

type AssetLibraryProps = {
  assets: AdminAssetSummary[]
  nextCursor: string | null
  initialFilters: AssetFilters
  limit?: number
}

const statusVariants: Record<MediaAssetStatus, StatusLabelProps["variant"]> = {
  pending: "info",
  processing: "info",
  ready: "success",
  failed: "error",
  archived: "warning",
  deleting: "warning",
  deleted: "neutral",
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "-"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusLabel(
  status: MediaAssetStatus,
  copy: (typeof adminCopy)["en"]["assets"],
): string {
  return copy[status]
}

async function readAsset(response: Response): Promise<AdminAssetSummary> {
  if (!response.ok) throw new Error("request_failed")
  const body = await response.json() as { asset: AdminAssetSummary }
  return body.asset
}

function AssetMetadataDialog({
  asset,
  open,
  onOpenChange,
  onSaved,
}: {
  asset: AdminAssetSummary
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (asset: AdminAssetSummary) => void
}) {
  const locale = useLocale()
  const t = adminCopy[locale].assets
  const [altKo, setAltKo] = useState(asset.altKo ?? "")
  const [altEn, setAltEn] = useState(asset.altEn ?? "")
  const [tags, setTags] = useState(asset.tags.join(", "))
  const [error, setError] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()

  const save = () => startSaving(async () => {
    setError(null)
    try {
      const updated = await readAsset(await fetch(`/api/admin/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          altKo: altKo.trim() || null,
          altEn: altEn.trim() || null,
          tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        }),
      }))
      onSaved(updated)
      onOpenChange(false)
    } catch {
      setError(t.operationFailed)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t.close}>
        <DialogHeader>
          <DialogTitle>{t.editMetadata}</DialogTitle>
          <DialogDescription>{asset.originalFilename}</DialogDescription>
        </DialogHeader>
        <div className={styles.metadataForm}>
          <Field>
            <FieldLabel>{t.koreanAlt}</FieldLabel>
            <Textarea maxLength={500} rows={3} value={altKo} onChange={(event) => setAltKo(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>{t.englishAlt}</FieldLabel>
            <Textarea maxLength={500} rows={3} value={altEn} onChange={(event) => setAltEn(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel>{t.tags}</FieldLabel>
            <Input value={tags} onChange={(event) => setTags(event.target.value)} />
            <FieldDescription>{t.tagsDescription}</FieldDescription>
          </Field>
          {error ? <p className={styles.errorText} role="alert">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>{t.cancel}</Button>
          <Button loading={saving} onClick={save}>{saving ? t.saving : t.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AssetLibrary({
  assets: initialAssets,
  nextCursor,
  initialFilters,
  limit = 30,
}: AssetLibraryProps) {
  const locale = useLocale()
  const t = adminCopy[locale].assets
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [assets, setAssets] = useState(initialAssets)
  const [search, setSearch] = useState(initialFilters.search ?? "")
  const [type, setType] = useState<MediaType | "">(initialFilters.type ?? "")
  const [status, setStatus] = useState<MediaAssetStatus | "">(initialFilters.status ?? "")
  const [tag, setTag] = useState(initialFilters.tag ?? "")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [selected, setSelected] = useState<AdminAssetSummary | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [replacement, setReplacement] = useState<AdminAssetSummary | null>(null)
  const [usageAsset, setUsageAsset] = useState<AdminAssetSummary | null>(null)
  const [usage, setUsage] = useState<AssetUsage[]>([])
  const [usageLoading, setUsageLoading] = useState(false)
  const [usageError, setUsageError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hrefFor = useCallback((filters: AssetFilters, cursor?: string) => {
    const query = new URLSearchParams()
    if (filters.search) query.set("search", filters.search)
    if (filters.type) query.set("type", filters.type)
    if (filters.status) query.set("status", filters.status)
    if (filters.tag) query.set("tag", filters.tag)
    if (limit !== 30) query.set("limit", String(limit))
    if (cursor) query.set("cursor", cursor)
    const value = query.toString()
    return value ? `/admin/assets?${value}` : "/admin/assets"
  }, [limit])

  const replaceFilters = useCallback((filters: AssetFilters) => {
    startTransition(() => router.replace(hrefFor(filters)))
  }, [hrefFor, router])

  useEffect(() => {
    const cleanSearch = search.trim()
    if (cleanSearch === (initialFilters.search ?? "")) return
    const timeout = window.setTimeout(() => {
      replaceFilters({
        search: cleanSearch || undefined,
        type: type || undefined,
        status: status || undefined,
        tag: tag.trim() || undefined,
      })
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [initialFilters.search, replaceFilters, search, status, tag, type])

  const currentFilters = (): AssetFilters => ({
    search: search.trim() || undefined,
    type: type || undefined,
    status: status || undefined,
    tag: tag.trim() || undefined,
  })

  const replaceAsset = (updated: AdminAssetSummary) => {
    setAssets((current) => current.map((asset) => asset.id === updated.id ? updated : asset))
  }

  const openUsage = async (asset: AdminAssetSummary) => {
    setUsageAsset(asset)
    setUsage([])
    setUsageError(null)
    setUsageLoading(true)
    try {
      const response = await fetch(`/api/admin/assets/${asset.id}/references`)
      if (!response.ok) throw new Error("request_failed")
      const body = await response.json() as { references: AssetUsage[] }
      setUsage(body.references)
    } catch {
      setUsageError(t.usageError)
    } finally {
      setUsageLoading(false)
    }
  }

  const mutateAsset = async (
    asset: AdminAssetSummary,
    operation: "archive" | "restore" | "delete",
  ) => {
    setNotice(null)
    setError(null)
    try {
      const response = operation === "delete"
        ? await fetch(`/api/admin/assets/${asset.id}`, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ confirm: true }),
        })
        : await fetch(`/api/admin/assets/${asset.id}/${operation}`, { method: "POST" })
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null
        if (body?.error === "asset_referenced") {
          setError(t.assetReferenced)
          await openUsage(asset)
          return
        }
        throw new Error("request_failed")
      }
      const updated = await readAsset(response)
      if (operation === "delete") setAssets((current) => current.filter((item) => item.id !== asset.id))
      else replaceAsset(updated)
      setNotice(operation === "archive" ? t.archivedNotice : operation === "restore" ? t.restoredNotice : t.deletedNotice)
    } catch {
      setError(t.operationFailed)
    }
  }

  const hasFilters = Boolean(search.trim() || type || status || tag.trim())
  const clearFilters = () => {
    setSearch("")
    setType("")
    setStatus("")
    setTag("")
    replaceFilters({})
  }

  return (
    <section className={styles.page} data-testid="asset-library" data-mobile-layout="single-column">
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h1>{t.heading}</h1>
          <p className={styles.description}>{t.description}</p>
        </div>
      </header>

      <AssetUploadQueue onReady={(asset) => setAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)])} />

      <div className={styles.toolbar}>
        <Field className={styles.searchField}>
          <FieldLabel>{t.search}</FieldLabel>
          <Input
            type="search"
            maxLength={160}
            value={search}
            onChange={(event) => setSearch(event.target.value.slice(0, 160))}
          />
        </Field>
        <Field>
          <FieldLabel>{t.type}</FieldLabel>
          <NativeSelect value={type} aria-label={t.type} onChange={(event) => {
            const next = event.target.value as MediaType | ""
            setType(next)
            replaceFilters({ ...currentFilters(), type: next || undefined })
          }}>
            <option value="">{t.allTypes}</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
            <option value="image/avif">AVIF</option>
            <option value="image/svg+xml">SVG</option>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel>{t.status}</FieldLabel>
          <NativeSelect value={status} aria-label={t.status} onChange={(event) => {
            const next = event.target.value as MediaAssetStatus | ""
            setStatus(next)
            replaceFilters({ ...currentFilters(), status: next || undefined })
          }}>
            <option value="">{t.allStatuses}</option>
            <option value="ready">{t.ready}</option>
            <option value="processing">{t.processing}</option>
            <option value="failed">{t.failed}</option>
            <option value="archived">{t.archived}</option>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel>{t.tag}</FieldLabel>
          <Input value={tag} maxLength={40} placeholder={t.tagPlaceholder} onChange={(event) => {
            const next = event.target.value.slice(0, 40)
            setTag(next)
            replaceFilters({ ...currentFilters(), tag: next.trim() || undefined })
          }} />
        </Field>
      </div>

      <div className={styles.libraryMeta}>
        <div>
          <span aria-live="polite">{t.results(assets.length)}</span>
          {hasFilters ? <Button size="compact" variant="secondary" onClick={clearFilters}>{t.clearFilters}</Button> : null}
        </div>
        <SegmentedToggle
          label={t.view}
          value={view}
          onValueChange={setView}
          options={[
            { value: "grid", label: t.gridView, content: <GridFour aria-hidden size={16} weight="bold" /> },
            { value: "list", label: t.listView, content: <ListBullets aria-hidden size={16} weight="bold" /> },
          ]}
        />
      </div>

      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      {error ? <p className={styles.errorText} role="alert">{error}</p> : null}

      <div className={styles.results} aria-busy={isPending} data-view={view}>
        {assets.length === 0 ? (
          <EmptyState
            className={styles.empty}
            title={hasFilters ? t.noMatchesHeading : t.emptyHeading}
            description={hasFilters ? t.noMatchesDescription : t.emptyDescription}
            action={hasFilters ? <Button size="compact" variant="secondary" onClick={clearFilters}>{t.clearFilters}</Button> : undefined}
          />
        ) : (
          <ul className={styles.assetGrid}>
            {assets.map((asset) => (
              <li key={asset.id} className={styles.assetCard}>
                <div className={styles.preview}>
                  {asset.src ? (
                    <Image
                      src={asset.src}
                      alt={asset.altKo || asset.altEn || asset.originalFilename}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : <span>{asset.mediaType?.split("/")[1]?.toUpperCase() ?? "IMG"}</span>}
                </div>
                <div className={styles.assetBody}>
                  <div className={styles.assetTitleRow}>
                    <strong title={asset.originalFilename}>{asset.originalFilename}</strong>
                    <StatusLabel variant={statusVariants[asset.status]}>{statusLabel(asset.status, t)}</StatusLabel>
                  </div>
                  <div className={styles.assetFacts}>
                    <span>{formatBytes(asset.byteSize)}</span>
                    {asset.width && asset.height ? <span>{t.dimensions(asset.width, asset.height)}</span> : null}
                    <span>{t.version(asset.version)}</span>
                  </div>
                  {asset.tags.length > 0 ? <p className={styles.tags}>{asset.tags.join(", ")}</p> : null}
                  <div className={styles.assetActions}>
                    <Button
                      size="compact"
                      variant="secondary"
                      aria-label={t.edit(asset.originalFilename)}
                      onClick={() => { setSelected(asset); setEditorOpen(true) }}
                    >
                      <NotePencil aria-hidden size={16} weight="bold" />
                    </Button>
                    {asset.src ? (
                      <Button
                        size="compact"
                        variant="secondary"
                        aria-label={t.copyPath(asset.originalFilename)}
                        onClick={async () => {
                          await navigator.clipboard.writeText(asset.src ?? "")
                          setNotice(t.copied)
                        }}
                      >
                        <Copy aria-hidden size={16} weight="bold" />
                      </Button>
                    ) : null}
                    {(asset.status === "ready" || asset.status === "archived") ? (
                      <Button
                        size="compact"
                        variant="secondary"
                        aria-label={t.replace(asset.originalFilename)}
                        onClick={() => setReplacement(asset)}
                      >
                        <ArrowsClockwise aria-hidden size={16} weight="bold" />
                      </Button>
                    ) : null}
                    <Button
                      size="compact"
                      variant="secondary"
                      aria-label={t.usage(asset.originalFilename)}
                      onClick={() => void openUsage(asset)}
                    >
                      <LinkSimple aria-hidden size={16} weight="bold" />
                    </Button>
                    {asset.status === "ready" ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="compact" variant="secondary" aria-label={t.archive}>
                            <Archive aria-hidden size={16} weight="bold" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.archiveTitle}</AlertDialogTitle>
                            <AlertDialogDescription>{t.archiveDescription}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void mutateAsset(asset, "archive")}>{t.archive}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                    {asset.status === "archived" ? (
                      <Button size="compact" variant="secondary" aria-label={t.restore} onClick={() => void mutateAsset(asset, "restore")}>
                        <ArrowCounterClockwise aria-hidden size={16} weight="bold" />
                      </Button>
                    ) : null}
                    {(asset.status === "pending" || asset.status === "archived" || asset.status === "failed") ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="compact"
                            variant="danger"
                            aria-label={asset.status === "pending" ? t.cancelPendingUpload : t.delete}
                          >
                            <Trash aria-hidden size={16} weight="bold" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{asset.status === "pending" ? t.cancelPendingTitle : t.deleteTitle}</AlertDialogTitle>
                            <AlertDialogDescription>{asset.status === "pending" ? t.cancelPendingDescription : t.deleteDescription}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={() => void mutateAsset(asset, "delete")}>
                              {asset.status === "pending" ? t.cancelPendingAction : t.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {nextCursor ? (
        <Link className={styles.nextLink} href={hrefFor(initialFilters, nextCursor)}>{t.nextPage}</Link>
      ) : null}

      <Dialog open={Boolean(replacement)} onOpenChange={(open) => { if (!open) setReplacement(null) }}>
        <DialogContent closeLabel={t.close}>
          <DialogHeader>
            <DialogTitle>{t.replaceTitle}</DialogTitle>
            <DialogDescription>
              {replacement ? t.replaceDescription(replacement.originalFilename, replacement.version) : ""}
            </DialogDescription>
          </DialogHeader>
          {replacement ? (
            <AssetUploadQueue
              replaceAssetId={replacement.id}
              multiple={false}
              onReady={(asset) => {
                setAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)])
                setReplacement(null)
                setNotice(t.replacedNotice(asset.version))
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(usageAsset)} onOpenChange={(open) => { if (!open) setUsageAsset(null) }}>
        <DialogContent closeLabel={t.close}>
          <DialogHeader>
            <DialogTitle>{t.usageTitle}</DialogTitle>
            <DialogDescription>{usageAsset ? t.usageDescription(usageAsset.originalFilename) : ""}</DialogDescription>
          </DialogHeader>
          {error === t.assetReferenced ? <p className={styles.errorText} role="alert">{error}</p> : null}
          {usageLoading ? <p className={styles.usageState} role="status">{t.usageLoading}</p> : null}
          {usageError ? <p className={styles.errorText} role="alert">{usageError}</p> : null}
          {!usageLoading && !usageError && usage.length === 0 ? (
            <EmptyState title={t.usageEmpty} description={t.usageEmptyDescription} />
          ) : null}
          {usage.length > 0 ? (
            <ul className={styles.usageList}>
              {usage.map((reference) => (
                <li key={`${reference.revisionId}:${reference.field}`}>
                  <div>
                    <strong>{reference.title}</strong>
                    <span>{reference.locale.toUpperCase()} · {t.usageStatus[reference.status]}</span>
                  </div>
                  <Link href={`/admin/documents/${reference.revisionId}`} aria-label={t.openUsage(reference.title)}>
                    {t.open}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </DialogContent>
      </Dialog>

      {selected ? (
        <AssetMetadataDialog
          key={selected.id}
          asset={selected}
          open={editorOpen}
          onOpenChange={setEditorOpen}
          onSaved={(asset) => { replaceAsset(asset); setNotice(t.metadataSaved) }}
        />
      ) : null}
    </section>
  )
}
