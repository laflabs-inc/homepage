import type { HTMLAttributes } from "react"

import styles from "./button-group.module.css"

export type ButtonGroupProps = HTMLAttributes<HTMLDivElement> & {
  label?: string
  orientation?: "horizontal" | "vertical"
}

export function ButtonGroup({
  label,
  orientation = "horizontal",
  className,
  "aria-label": ariaLabel,
  ...props
}: ButtonGroupProps) {
  return (
    <div
      {...props}
      aria-label={ariaLabel ?? label}
      className={[styles.group, className].filter(Boolean).join(" ")}
      data-orientation={orientation}
      data-slot="button-group"
      role="group"
    />
  )
}

export type ButtonGroupSeparatorProps = HTMLAttributes<HTMLSpanElement> & {
  orientation?: "horizontal" | "vertical"
}

export function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: ButtonGroupSeparatorProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={[styles.separator, className].filter(Boolean).join(" ")}
      data-orientation={orientation}
      data-slot="button-group-separator"
      role="separator"
    />
  )
}

export function ButtonGroupText({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={[styles.text, className].filter(Boolean).join(" ")}
      data-slot="button-group-text"
    />
  )
}
