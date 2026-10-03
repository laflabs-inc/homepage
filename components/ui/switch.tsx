"use client"

import { useId, type ComponentPropsWithRef, type ReactNode } from "react"

import styles from "./selection-control.module.css"

export type SwitchProps = Omit<ComponentPropsWithRef<"input">, "type" | "role"> & {
  label: ReactNode
  description?: ReactNode
  tone?: SwitchTone
}

export type SwitchTone = "primary" | "success" | "warning" | "danger" | "neutral"

function mergeIds(...values: Array<string | undefined>): string | undefined {
  const ids = [...new Set(values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []))]
  return ids.length > 0 ? ids.join(" ") : undefined
}

export function Switch({ label, description, ref, tone = "primary", ...props }: SwitchProps) {
  const prefix = useId()
  const labelId = `${prefix}-label`
  const descriptionId = `${prefix}-description`

  return (
    <label className={styles.switchRow} data-slot="switch" data-tone={tone}>
      <span className={styles.choiceCopy}>
        <span className={styles.choiceLabel} data-slot="switch-label" id={labelId}>{label}</span>
        {description ? (
          <span
            className={styles.choiceDescription}
            data-slot="switch-description"
            id={descriptionId}
          >
            {description}
          </span>
        ) : null}
      </span>
      <span className={styles.switchControl} data-slot="switch-control">
        <input
          {...props}
          ref={ref}
          aria-describedby={mergeIds(
            props["aria-describedby"],
            description ? descriptionId : undefined,
          )}
          aria-labelledby={labelId}
          data-slot="switch-input"
          role="switch"
          type="checkbox"
        />
        <span aria-hidden className={styles.switchTrack} data-slot="switch-track">
          <span className={styles.switchThumb} data-slot="switch-thumb" />
        </span>
      </span>
    </label>
  )
}
