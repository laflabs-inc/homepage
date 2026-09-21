import type { HTMLAttributes } from "react"

import styles from "./button-group.module.css"

export type ButtonGroupProps = HTMLAttributes<HTMLDivElement> & {
  label: string
  orientation?: "horizontal" | "vertical"
}

export function ButtonGroup({
  label,
  orientation = "horizontal",
  className,
  ...props
}: ButtonGroupProps) {
  return (
    <div
      {...props}
      aria-label={label}
      className={[styles.group, className].filter(Boolean).join(" ")}
      data-orientation={orientation}
      role="group"
    />
  )
}
