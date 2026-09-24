import { useId, type ComponentPropsWithRef } from "react"

import styles from "./progress.module.css"

export type ProgressProps = Omit<ComponentPropsWithRef<"progress">, "max" | "value"> & {
  label: string
  max?: number
  showValue?: boolean
  value?: number
}

export function Progress({ className, label, max = 100, showValue = false, value, ...props }: ProgressProps) {
  const labelId = useId()
  const safeMax = max > 0 ? max : 100
  const percentage = value === undefined ? undefined : Math.round((Math.min(Math.max(value, 0), safeMax) / safeMax) * 100)

  return (
    <div className={[styles.root, className].filter(Boolean).join(" ")}>
      <div className={styles.meta}>
        <span id={labelId}>{label}</span>
        {showValue && percentage !== undefined ? <output>{percentage}%</output> : null}
      </div>
      <progress aria-labelledby={labelId} className={styles.progress} max={safeMax} value={value} {...props} />
    </div>
  )
}
