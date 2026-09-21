import type { ComponentPropsWithRef } from "react"

import styles from "./button.module.css"

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: "primary" | "secondary" | "inverse" | "danger"
  size?: "compact" | "default"
  loading?: boolean
}

export function Button({
  className,
  disabled = false,
  loading = false,
  size = "default",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ")

  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={classes}
      data-size={size}
      data-variant={variant}
      disabled={disabled || loading}
      type={type}
    />
  )
}
