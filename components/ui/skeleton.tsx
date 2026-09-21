import type { HTMLAttributes } from "react"

import styles from "./feedback.module.css"

export type SkeletonProps = HTMLAttributes<HTMLDivElement>

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={[styles.skeleton, className].filter(Boolean).join(" ")}
    />
  )
}
