"use client"

import {
  CheckCircle,
  Info,
  Warning,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr"
import { useId, type HTMLAttributes, type ReactNode } from "react"

import styles from "./feedback.module.css"

const alertIcons = {
  info: Info,
  success: CheckCircle,
  warning: Warning,
  error: WarningCircle,
} as const

export type AlertProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title: ReactNode
  variant?: keyof typeof alertIcons
  live?: boolean
}

export function Alert({
  children,
  className,
  live = false,
  title,
  variant = "info",
  ...props
}: AlertProps) {
  const titleId = useId()
  const AlertIcon = alertIcons[variant]

  return (
    <section
      {...props}
      aria-labelledby={titleId}
      className={[styles.alert, className].filter(Boolean).join(" ")}
      data-variant={variant}
      role={live ? "alert" : undefined}
    >
      <AlertIcon aria-hidden className={styles.alertIcon} size={20} weight="bold" />
      <div className={styles.alertContent}>
        <h3 id={titleId}>{title}</h3>
        <div>{children}</div>
      </div>
    </section>
  )
}
