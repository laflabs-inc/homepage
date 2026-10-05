import { forwardRef, type ComponentPropsWithoutRef } from "react"

import styles from "./spinner.module.css"

export type SpinnerProps = Omit<ComponentPropsWithoutRef<"span">, "aria-label"> & {
  label: string
  size?: "compact" | "default" | "large"
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { className, label, size = "default", ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      aria-label={label}
      className={[styles.spinner, className].filter(Boolean).join(" ")}
      data-size={size}
      role="status"
    >
      <span aria-hidden="true" data-spinner-track="" />
    </span>
  )
})
