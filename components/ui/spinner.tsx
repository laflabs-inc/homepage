import { CircleNotch } from "@phosphor-icons/react/dist/ssr"
import type { HTMLAttributes } from "react"

import styles from "./spinner.module.css"

export type SpinnerProps = Omit<HTMLAttributes<HTMLSpanElement>, "aria-label"> & {
  label: string
  size?: "compact" | "default" | "large"
}

export function Spinner({ className, label, size = "default", ...props }: SpinnerProps) {
  return (
    <span
      aria-label={label}
      className={[styles.spinner, className].filter(Boolean).join(" ")}
      data-size={size}
      role="status"
      {...props}
    >
      <CircleNotch aria-hidden size="1em" weight="bold" />
    </span>
  )
}
