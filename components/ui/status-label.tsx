import type { ComponentPropsWithRef } from "react"

import styles from "./status-label.module.css"

export type StatusLabelProps = ComponentPropsWithRef<"span"> & {
  variant?: "neutral" | "info" | "success" | "warning" | "error"
}

export function StatusLabel({
  className,
  variant = "neutral",
  ...props
}: StatusLabelProps) {
  return (
    <span
      {...props}
      className={[styles.label, className].filter(Boolean).join(" ")}
      data-variant={variant}
    />
  )
}
