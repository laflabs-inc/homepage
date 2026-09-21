"use client"

import { useId, type InputHTMLAttributes, type ReactNode } from "react"

import styles from "./selection-control.module.css"

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> & {
  label: ReactNode
  description?: ReactNode
}

export function Switch({ label, description, ...props }: SwitchProps) {
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
          aria-describedby={description ? descriptionId : props["aria-describedby"]}
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
