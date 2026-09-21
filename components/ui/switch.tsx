"use client"

import { useId, type ComponentPropsWithRef, type ReactNode } from "react"

import styles from "./selection-control.module.css"

export type SwitchProps = Omit<ComponentPropsWithRef<"input">, "type" | "role"> & {
  label: ReactNode
  description?: ReactNode
}

function mergeIds(...values: Array<string | undefined>): string | undefined {
  const ids = [...new Set(values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []))]
  return ids.length > 0 ? ids.join(" ") : undefined
}

export function Switch({ label, description, ref, ...props }: SwitchProps) {
  const prefix = useId()
  const labelId = `${prefix}-label`
  const descriptionId = `${prefix}-description`

  return (
    <label className={styles.switchRow}>
      <span className={styles.choiceCopy}>
        <span className={styles.choiceLabel} id={labelId}>{label}</span>
        {description ? (
          <span className={styles.choiceDescription} id={descriptionId}>{description}</span>
        ) : null}
      </span>
      <span className={styles.switchControl}>
        <input
          {...props}
          ref={ref}
          aria-describedby={mergeIds(
            props["aria-describedby"],
            description ? descriptionId : undefined,
          )}
          aria-labelledby={labelId}
          role="switch"
          type="checkbox"
        />
        <span aria-hidden className={styles.switchTrack}>
          <span className={styles.switchThumb} />
        </span>
      </span>
    </label>
  )
}
