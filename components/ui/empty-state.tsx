import type { HTMLAttributes, ReactNode } from "react"

import styles from "./feedback.module.css"

export type EmptyStateProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title: ReactNode
  description: ReactNode
  action?: ReactNode
}

export function EmptyState({
  action,
  className,
  description,
  title,
  ...props
}: EmptyStateProps) {
  return (
    <section {...props} className={[styles.emptyState, className].filter(Boolean).join(" ")}>
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className={styles.emptyStateAction}>{action}</div> : null}
    </section>
  )
}
