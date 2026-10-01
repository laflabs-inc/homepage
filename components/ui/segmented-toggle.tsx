"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"

import { SegmentedControlCompat } from "./segmented-control"

type SegmentedToggleOption<Value extends string> = {
  value: Value
  label: string
  content: ReactNode
  buttonProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-label" | "aria-pressed" | "children" | "onClick" | "type"
  > & {
    "data-analytics-event"?: string
    "data-analytics-target"?: string
  }
}

type SegmentedToggleProps<Value extends string> = {
  label: string
  value: Value
  options: readonly [SegmentedToggleOption<Value>, SegmentedToggleOption<Value>]
  onValueChange: (value: Value) => void
  className?: string
}

export function SegmentedToggle<Value extends string>({
  label,
  value,
  options,
  onValueChange,
  className,
}: SegmentedToggleProps<Value>) {
  return (
    <SegmentedControlCompat
      className={className}
      label={label}
      onValueChange={onValueChange}
      options={options}
      value={value}
    />
  )
}
