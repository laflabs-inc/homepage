"use client"

import { useId, type ReactNode } from "react"

import styles from "./selection-control.module.css"

export type RadioOption = Readonly<{
  value: string
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}>

export type RadioGroupProps = Readonly<{
  legend: ReactNode
  name: string
  options: readonly RadioOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  className?: string
}>

export function RadioGroup({
  legend,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  className,
}: RadioGroupProps) {
  const prefix = useId()

  return (
    <fieldset
      className={[styles.group, className].filter(Boolean).join(" ")}
      disabled={disabled}
    >
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.groupChoices}>
        {options.map((option, index) => {
          const labelId = `${prefix}-${index}-label`
          const descriptionId = `${prefix}-${index}-description`
          return (
            <label className={styles.choice} key={option.value}>
              <input
                aria-describedby={option.description ? descriptionId : undefined}
                aria-labelledby={labelId}
                checked={value === undefined ? undefined : value === option.value}
                className={`${styles.choiceInput} ${styles.radioInput}`}
                defaultChecked={value === undefined ? defaultValue === option.value : undefined}
                disabled={option.disabled}
                name={name}
                onChange={(event) => onValueChange?.(event.currentTarget.value)}
                type="radio"
                value={option.value}
              />
              <span className={styles.choiceCopy}>
                <span className={styles.choiceLabel} id={labelId}>{option.label}</span>
                {option.description ? (
                  <span className={styles.choiceDescription} id={descriptionId}>
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
