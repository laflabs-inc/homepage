"use client"

import { useState } from "react"

import { SegmentedControl } from "@/components/ui/segmented-control"
import type { Locale } from "@/lib/i18n"

export function SegmentedControlDemo({ locale, state }: { locale: Locale; state?: string }) {
  const [value, setValue] = useState("draft")
  const options = [
    { value: "draft", label: locale === "ko" ? "초안" : "Draft", content: locale === "ko" ? "초안" : "Draft" },
    { value: "review", label: locale === "ko" ? "검토 중" : "In review", content: locale === "ko" ? "검토" : "Review", disabled: state === "disabled" },
    { value: "published", label: locale === "ko" ? "발행됨" : "Published", content: locale === "ko" ? "발행" : "Published" },
  ] as const

  return (
    <SegmentedControl
      label={locale === "ko" ? "문서 상태 미리보기" : "Document status preview"}
      value={value}
      options={options}
      onValueChange={setValue}
    />
  )
}
