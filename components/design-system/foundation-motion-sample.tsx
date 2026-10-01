"use client"

import { useState } from "react"

import { SegmentedControl } from "@/components/ui/segmented-control"

export function FoundationMotionSample({ label }: { label: string }) {
  const [value, setValue] = useState<"a" | "b">("a")

  return (
    <SegmentedControl
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
