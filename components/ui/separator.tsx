import type { HTMLAttributes } from "react"

import styles from "./feedback.module.css"

export type SeparatorProps = HTMLAttributes<HTMLElement> & {
  decorative?: boolean
  orientation?: "horizontal" | "vertical"
}

export function Separator({
  className,
  decorative = true,
  orientation = "horizontal",
  ...props
}: SeparatorProps) {
  const classes = [styles.separator, className].filter(Boolean).join(" ")

  if (decorative) {
    return (
      <div
        {...props}
        aria-hidden="true"
        className={classes}
        data-orientation={orientation}
      />
    )
  }

  if (orientation === "horizontal") {
    return <hr {...props} className={classes} data-orientation={orientation} />
  }

  return (
    <div
      {...props}
      aria-orientation="vertical"
      className={classes}
      data-orientation={orientation}
      role="separator"
    />
  )
}
