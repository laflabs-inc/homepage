"use client"

import { useEffect, useRef, useState } from "react"

import { useAnalytics } from "@/components/analytics/consent-provider"
import type { Locale } from "@/lib/i18n"
import contentStyles from "@/components/content/content.module.css"

const labels = {
  ko: {
    button: "사용 코드 복사",
    idle: "복사",
    copied: "복사됨",
    retry: "다시 시도",
    copiedStatus: "복사됨",
    errorStatus: "복사하지 못했습니다. 코드를 직접 선택해 주세요.",
  },
  en: {
    button: "Copy usage code",
    idle: "COPY",
    copied: "COPIED",
    retry: "RETRY",
    copiedStatus: "Copied",
    errorStatus: "Copy failed. Select the code manually.",
  },
} as const

type CopyStatus = "idle" | "copied" | "error"

export function CodeCopyButton({
  source,
  componentSlug,
  locale,
}: {
  source: string
  componentSlug: string
  locale: Locale
}) {
  const { track } = useAnalytics()
  const [status, setStatus] = useState<CopyStatus>("idle")
  const mountedRef = useRef(true)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const text = labels[locale]
  const statusMessage = status === "copied"
    ? text.copiedStatus
    : status === "error"
      ? text.errorStatus
      : ""

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  function scheduleReset() {
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setStatus("idle"), 1800)
  }

  async function copySource() {
    try {
      await navigator.clipboard.writeText(source)
      if (!mountedRef.current) return
      setStatus("copied")
      track("design_code_copy", componentSlug)
    } catch {
      if (!mountedRef.current) return
      setStatus("error")
    }
    scheduleReset()
  }

  return (
    <>
      <button type="button" onClick={copySource} aria-label={text.button}>
        {status === "copied" ? text.copied : status === "error" ? text.retry : text.idle}
      </button>
      <span className={contentStyles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </span>
    </>
  )
}
