"use client"

import { useState } from "react"

import { SegmentedToggle } from "@/components/ui/segmented-toggle"
import type { Locale } from "@/lib/i18n"

export function SegmentedToggleDemo({ locale }: { locale: Locale }) {
  const [language, setLanguage] = useState<"ko" | "en">("ko")

  return (
    <SegmentedToggle
      label={locale === "ko" ? "언어 미리보기" : "Language preview"}
      value={language}
      options={[
        { value: "ko", label: locale === "ko" ? "한국어" : "Korean", content: "KO" },
        { value: "en", label: locale === "ko" ? "영어" : "English", content: "EN" },
      ]}
      onValueChange={setLanguage}
    />
  )
}
