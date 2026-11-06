"use client"

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ComponentPropsWithRef,
  type ReactNode,
  type Ref,
} from "react"

import styles from "./selection-control.module.css"

export type CheckboxProps = Omit<ComponentPropsWithRef<"input">, "type"> & {
  label: ReactNode
  description?: ReactNode
  indeterminate?: boolean
}

function mergeIds(...values: Array<string | undefined>): string | undefined {
  const ids = [...new Set(values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []))]
  return ids.length > 0 ? ids.join(" ") : undefined
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value)
  else if (ref) ref.current = value
}

export function Checkbox({
  label,
  description,
  indeterminate = false,
  ref,
  ...props
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const prefix = useId()
  const labelId = `${prefix}-label`
  const descriptionId = `${prefix}-description`
  const setInputRef = useCallback((input: HTMLInputElement | null) => {
    inputRef.current = input
    assignRef(ref, input)
  }, [ref])

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.indeterminate = indeterminate
    return () => {
      input.indeterminate = false
    }
  }, [indeterminate])

  return (
    <label className={styles.choice} data-slot="checkbox">
      <input
        {...props}
        ref={setInputRef}
        aria-checked={indeterminate ? "mixed" : props.checked}
        aria-describedby={mergeIds(
          props["aria-describedby"],
          description ? descriptionId : undefined,
        )}
        aria-labelledby={labelId}
        className={`${styles.choiceInput} ${styles.checkboxInput}`}
        data-slot="checkbox-input"
        type="checkbox"
      />
      <span
        aria-hidden
        className={styles.checkboxIndicator}
        data-checkbox-indicator
        data-slot="checkbox-indicator"
      >
        <span className={styles.checkboxSelection} data-checkbox-selection />
        <span className={styles.checkboxMixed} data-checkbox-mixed />
      </span>
      <span className={styles.choiceCopy} data-slot="checkbox-copy">
        <span className={styles.choiceLabel} data-slot="checkbox-label" id={labelId}>{label}</span>
        {description ? (
          <span className={styles.choiceDescription} data-slot="checkbox-description" id={descriptionId}>{description}</span>
        ) : null}
      </span>
    </label>
  )
}
