"use client"

import {
  useEffect,
  useId,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react"

import styles from "./selection-control.module.css"

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode
  description?: ReactNode
  indeterminate?: boolean
}

export function Checkbox({
  label,
  description,
  indeterminate = false,
  ...props
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const prefix = useId()
  const labelId = `${prefix}-label`
  const descriptionId = `${prefix}-description`

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.indeterminate = indeterminate
    return () => {
      input.indeterminate = false
    }
  }, [indeterminate])

  return (
    <label className={styles.choice}>
      <input
        {...props}
        ref={inputRef}
        aria-checked={indeterminate ? "mixed" : props.checked}
        aria-describedby={description ? descriptionId : props["aria-describedby"]}
        aria-labelledby={labelId}
        className={styles.choiceInput}
        type="checkbox"
      />
      <span className={styles.choiceCopy}>
        <span className={styles.choiceLabel} id={labelId}>{label}</span>
        {description ? (
          <span className={styles.choiceDescription} id={descriptionId}>{description}</span>
        ) : null}
      </span>
    </label>
  )
}
