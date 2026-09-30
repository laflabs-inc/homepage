"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import { AssetUploadQueue } from "@/components/admin/asset-upload-queue"
import styles from "@/components/admin/asset-picker-dialog.module.css"
import { useLocale } from "@/components/i18n/locale-provider"
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
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { adminCopy } from "@/lib/admin/i18n"
import type { AdminAssetSummary } from "@/lib/assets/admin-summary"
import type { Locale } from "@/lib/i18n"

type AssetPage = { assets: AdminAssetSummary[]; nextCursor: string | null }

export type AssetPickerResult = { src: string; alt: string }

export function AssetPickerDialog({
  open,
  onOpenChange,
  documentLocale,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentLocale: Locale
  onSelect: (result: AssetPickerResult) => void
}) {
  const locale = useLocale()
  const t = adminCopy[locale].documents.editor
  const assetT = adminCopy[locale].assets
  const [assets, setAssets] = useState<AdminAssetSummary[]>([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<AdminAssetSummary | null>(null)
  const [alt, setAlt] = useState("")
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectAsset = (asset: AdminAssetSummary) => {
    setSelected(asset)
    setAlt((documentLocale === "ko" ? asset.altKo : asset.altEn) ?? asset.altKo ?? asset.altEn ?? "")
  }

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      const query = new URLSearchParams({ status: "ready", limit: "24" })
      if (search.trim()) query.set("search", search.trim())
      try {
        const response = await fetch(`/api/admin/assets?${query}`, { signal: controller.signal })
        if (!response.ok) throw new Error("request_failed")
        const page = await response.json() as AssetPage
        setAssets(page.assets)
        setNextCursor(page.nextCursor)
        setSelected(null)
        setAlt("")
      } catch {
        if (!controller.signal.aborted) setError(t.assetPickerError)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, search ? 200 : 0)
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [open, search, t.assetPickerError])

  const loadMore = async () => {
    if (!nextCursor) return
    setLoading(true)
    setError(null)
    const query = new URLSearchParams({ status: "ready", limit: "24", cursor: nextCursor })
    if (search.trim()) query.set("search", search.trim())
    try {
      const response = await fetch(`/api/admin/assets?${query}`)
      if (!response.ok) throw new Error("request_failed")
      const page = await response.json() as AssetPage
      setAssets((current) => [...current, ...page.assets.filter((item) => !current.some(({ id }) => id === item.id))])
      setNextCursor(page.nextCursor)
    } catch {
      setError(t.assetPickerError)
    } finally {
      setLoading(false)
    }
  }

  const insert = async () => {
    if (!selected?.src || !alt.trim()) return
    const originalAlt = documentLocale === "ko" ? selected.altKo : selected.altEn
    if (alt.trim() !== (originalAlt ?? "")) {
      const response = await fetch(`/api/admin/assets/${selected.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          altKo: documentLocale === "ko" ? alt.trim() : selected.altKo,
          altEn: documentLocale === "en" ? alt.trim() : selected.altEn,
          tags: selected.tags,
        }),
      })
      if (!response.ok) {
        setError(t.assetPickerMetadataError)
        return
      }
    }
    onSelect({ src: selected.src, alt: alt.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialog} closeLabel={assetT.close}>
        <DialogHeader>
          <DialogTitle>{t.assetPickerTitle}</DialogTitle>
          <DialogDescription>{t.assetPickerDescription}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel>{t.assetPickerSearch}</FieldLabel>
          <Input
            type="search"
            value={search}
            maxLength={160}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Field>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {loading && assets.length === 0 ? <p className={styles.state} role="status">{t.assetPickerLoading}</p> : null}
        {!loading && assets.length === 0 && !error ? (
          <EmptyState title={t.assetPickerEmpty} description={t.assetPickerEmptyDescription} />
        ) : null}
        {assets.length > 0 ? (
          <ul className={styles.grid} aria-label={t.assetPickerResults}>
            {assets.map((asset) => (
              <li key={asset.id}>
                <button
                  type="button"
                  className={styles.asset}
                  data-selected={selected?.id === asset.id}
                  onClick={() => selectAsset(asset)}
                >
                  {asset.src ? (
                    <span className={styles.preview}>
                      <Image src={asset.src} alt="" fill sizes="140px" unoptimized />
                    </span>
                  ) : null}
                  <span>{asset.originalFilename}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {nextCursor ? <Button variant="secondary" onClick={() => void loadMore()}>{t.assetPickerMore}</Button> : null}
        {selected ? (
          <Field>
            <FieldLabel>{t.assetPickerAlt}</FieldLabel>
            <Input value={alt} maxLength={500} onChange={(event) => setAlt(event.target.value)} />
          </Field>
        ) : null}
        <details className={styles.upload}>
          <summary>{t.assetPickerUpload}</summary>
          <AssetUploadQueue onReady={(asset) => {
            setAssets((current) => [asset, ...current.filter(({ id }) => id !== asset.id)])
            selectAsset(asset)
          }} />
        </details>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>{assetT.cancel}</Button>
          <Button disabled={!selected || !alt.trim()} onClick={() => void insert()}>{t.assetPickerInsert}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
