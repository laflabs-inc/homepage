"use client"

import { useState } from "react"

import { SegmentedToggle } from "@/components/ui/segmented-toggle"

export function FoundationMotionSample({ label }: { label: string }) {
  const [value, setValue] = useState<"a" | "b">("a")

  return (
    <SegmentedToggle
      label={label}
      value={value}
      onValueChange={setValue}
      options={[
        { value: "a", label: "A", content: "A" },
        { value: "b", label: "B", content: "B" },
      ]}
    />
  )
}
