import { forwardRef, type ComponentPropsWithoutRef } from "react"

import styles from "./status-label.module.css"

export type StatusLabelTone = "neutral" | "info" | "success" | "warning" | "error"

export type StatusLabelProps = ComponentPropsWithoutRef<"span"> & {
  tone?: StatusLabelTone
  variant?: "neutral" | "info" | "success" | "warning" | "error"
}

export const StatusLabel = forwardRef<HTMLSpanElement, StatusLabelProps>(function StatusLabel({
  children,
  className,
  tone,
  variant,
  ...props
}, ref) {
  const resolvedTone = tone ?? variant ?? "neutral"
  return (
    <span
      {...props}
      ref={ref}
      className={[styles.label, className].filter(Boolean).join(" ")}
      data-tone={resolvedTone}
    >
      <span aria-hidden="true" className={styles.marker} data-status-marker />
      {children}
    </span>
  )
})
