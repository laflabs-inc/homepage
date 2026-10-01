"use client"

import { ArrowClockwise, Trash, UploadSimple } from "@phosphor-icons/react"
import { useRef, useState } from "react"

import styles from "@/components/admin/asset-library.module.css"
import { useLocale } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StatusLabel } from "@/components/ui/status-label"
import { adminCopy } from "@/lib/admin/i18n"
import type { AdminAssetSummary } from "@/lib/assets/admin-summary"
import { finalizeUploadedAsset } from "@/lib/assets/client-finalize"
import { uploadStagedAsset } from "@/lib/assets/client-upload"

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
])
const MAX_BYTES = 10 * 1024 * 1024

type QueueStatus = "queued" | "uploading" | "processing" | "ready" | "failed"
type FailureReason = "unsupported_type" | "file_too_large" | "upload_failed"

type QueueItem = {
  id: string
  file: File
  status: QueueStatus
  progress: number
  assetId?: string
  failureReason?: FailureReason
}

type IntentResponse = {
  intent: {
    assetId: string
    pathname: string
  }
}

function localId(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}:${Math.random().toString(36).slice(2)}`
}

function validateFile(file: File): FailureReason | null {
  if (!ACCEPTED_TYPES.has(file.type)) return "unsupported_type"
  if (file.size > MAX_BYTES) return "file_too_large"
  return null
}

async function readJson<ResponseShape>(response: Response): Promise<ResponseShape> {
  if (!response.ok) throw new Error("request_failed")
  return response.json() as Promise<ResponseShape>
}

export function AssetUploadQueue({
  onReady,
  replaceAssetId,
  multiple = true,
}: {
  onReady: (asset: AdminAssetSummary) => void
  replaceAssetId?: string
  multiple?: boolean
}) {
  const locale = useLocale()
  const t = adminCopy[locale].assets
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<QueueItem[]>([])

  const updateItem = (id: string, update: Partial<QueueItem>) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...update } : item))
  }

  const runUpload = async (item: QueueItem) => {
    updateItem(item.id, { status: "queued", progress: 0, assetId: undefined, failureReason: undefined })
    try {
      const intentResponse = await fetch("/api/admin/assets/intents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          originalFilename: item.file.name,
          declaredMediaType: item.file.type,
          byteSize: item.file.size,
          ...(replaceAssetId ? { replaceAssetId } : {}),
        }),
      })
      const { intent } = await readJson<IntentResponse>(intentResponse)
      updateItem(item.id, { status: "uploading", progress: 0, assetId: intent.assetId })
      await uploadStagedAsset({
        file: item.file,
        assetId: intent.assetId,
        pathname: intent.pathname,
        onProgress: ({ percentage }) => updateItem(item.id, {
          status: "uploading",
          progress: Math.round(percentage),
        }),
      })
      updateItem(item.id, { status: "processing", progress: 100 })
      const asset = await finalizeUploadedAsset(intent.assetId)
      updateItem(item.id, { status: "ready", progress: 100 })
      onReady(asset)
    } catch {
      updateItem(item.id, { status: "failed", failureReason: "upload_failed" })
    }
  }

  const discardIntent = async (assetId: string) => {
    const response = await fetch(`/api/admin/assets/${assetId}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirm: true }),
    })
    if (!response.ok) throw new Error("request_failed")
  }

  const retryUpload = async (item: QueueItem) => {
    try {
      if (item.assetId) await discardIntent(item.assetId)
      await runUpload({ ...item, assetId: undefined })
    } catch {
      updateItem(item.id, { status: "failed", failureReason: "upload_failed" })
    }
  }

  const removeFailedUpload = async (item: QueueItem) => {
    try {
      if (item.assetId) await discardIntent(item.assetId)
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id))
    } catch {
      updateItem(item.id, { status: "failed", failureReason: "upload_failed" })
    }
  }

  const addFiles = (files: File[]) => {
    const nextItems = (multiple ? files : files.slice(0, 1)).map<QueueItem>((file) => {
      const failureReason = validateFile(file)
      return {
        id: localId(file),
        file,
        status: failureReason ? "failed" : "queued",
        progress: 0,
        ...(failureReason ? { failureReason } : {}),
      }
    })
    setItems((current) => [...nextItems, ...current])
    for (const item of nextItems) {
      if (!item.failureReason) void runUpload(item)
    }
  }

  const statusCopy = (item: QueueItem) => {
    if (item.failureReason === "unsupported_type") return t.unsupportedType
    if (item.failureReason === "file_too_large") return t.fileTooLarge
    if (item.failureReason === "upload_failed") return t.uploadFailed
    return t[item.status]
  }

  return (
    <section className={styles.uploadPanel} aria-labelledby="asset-upload-heading">
      <div className={styles.uploadLead}>
        <div>
          <h2 id="asset-upload-heading">{t.uploadHeading}</h2>
          <p>{t.uploadDescription}</p>
        </div>
        <Button size="compact" onClick={() => inputRef.current?.click()}>
          <UploadSimple aria-hidden size={17} weight="bold" />
          {t.uploadButton}
        </Button>
        <input
          ref={inputRef}
          className={styles.visuallyHidden}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.avif,.svg,image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
          multiple={multiple}
          aria-label={t.uploadInput}
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []))
            event.currentTarget.value = ""
          }}
        />
      </div>
      <p className={styles.uploadHint}>{t.dropHint}</p>
      {items.length > 0 ? (
        <ul className={styles.uploadQueue} aria-live="polite">
          {items.map((item) => (
            <li key={item.id}>
              <div className={styles.queueIdentity}>
                <strong>{item.file.name}</strong>
                <span>{Math.max(1, Math.ceil(item.file.size / 1024))} KB</span>
              </div>
              <div className={styles.queueStatus}>
                <StatusLabel variant={item.status === "ready" ? "success" : item.status === "failed" ? "error" : "info"}>
                  {statusCopy(item)}
                </StatusLabel>
                {item.status === "uploading" ? (
                  <Progress label={`${item.file.name} ${t.uploading}`} value={item.progress} />
                ) : null}
              </div>
              {item.status === "failed" ? (
                <div className={styles.queueActions}>
                  {item.failureReason === "upload_failed" ? (
                    <Button
                      size="compact"
                      variant="secondary"
                      aria-label={t.retryUpload}
                      onClick={() => void retryUpload(item)}
                    >
                      <ArrowClockwise aria-hidden size={16} weight="bold" />
                    </Button>
                  ) : null}
                  <Button
                    size="compact"
                    variant="secondary"
                    aria-label={t.removeFailedUpload}
                    onClick={() => void removeFailedUpload(item)}
                  >
                    <Trash aria-hidden size={16} weight="bold" />
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
