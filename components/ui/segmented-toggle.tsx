"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"

import styles from "./segmented-toggle.module.css"

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
  const reducedMotion = useReducedMotion()
  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value))

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      role="group"
      aria-label={label}
      data-active-index={activeIndex}
    >
      <motion.span
        className={styles.thumb}
        aria-hidden="true"
        initial={false}
        animate={{ x: activeIndex * 34 }}
        transition={reducedMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 520, damping: 38 }}
      />
      {options.map((option) => {
        const active = option.value === value

        return (
          <button
            {...option.buttonProps}
            key={option.value}
            className={styles.button}
            type="button"
            data-active={active}
            aria-label={option.label}
            aria-pressed={active}
            onClick={() => {
              if (!active) onValueChange(option.value)
            }}
          >
            {option.content}
          </button>
        )
      })}
    </div>
  )
}
