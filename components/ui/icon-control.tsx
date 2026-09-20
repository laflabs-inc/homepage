import type { ButtonHTMLAttributes, ReactNode } from "react"

import styles from "./icon-control.module.css"

export type IconControlProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "aria-labelledby" | "children"
> & {
  children: ReactNode
  label: string
}

export function IconControl({ className, label, type, ...props }: IconControlProps) {
  return (
    <button
      {...props}
      aria-label={label}
      className={[styles.control, className].filter(Boolean).join(" ")}
      type={type ?? "button"}
    />
  )
}
