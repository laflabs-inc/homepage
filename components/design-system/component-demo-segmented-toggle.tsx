"use client"

import { useState } from "react"

import { SegmentedToggle } from "@/components/ui/segmented-toggle"
import type { Locale } from "@/lib/i18n"

export function SegmentedToggleDemo({ locale, state }: { locale: Locale; state?: string }) {
  const [language, setLanguage] = useState<"ko" | "en">(state === "selected" ? "en" : "ko")
  const label = state
    ? locale === "ko"
      ? `언어 ${state} 상태 컨트롤`
      : `Language ${state} state control`
    : locale === "ko"
      ? "언어 미리보기"
      : "Language preview"

  return (
    <SegmentedToggle
      label={label}
      value={language}
      options={[
        { value: "ko", label: locale === "ko" ? "한국어" : "Korean", content: "KO" },
        { value: "en", label: locale === "ko" ? "영어" : "English", content: "EN" },
      ]}
      onValueChange={setLanguage}
    />
  )
}
