"use client"

import { useId, type ReactNode, type Ref } from "react"

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
  ref?: Ref<HTMLFieldSetElement>
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
  ref,
}: RadioGroupProps) {
  const prefix = useId()

  return (
    <fieldset
      ref={ref}
      className={[styles.group, className].filter(Boolean).join(" ")}
      data-slot="radio-group"
      disabled={disabled}
    >
      <legend className={styles.legend} data-slot="radio-group-legend">{legend}</legend>
      <div className={styles.groupChoices}>
        {options.map((option, index) => {
          const labelId = `${prefix}-${index}-label`
          const descriptionId = `${prefix}-${index}-description`
          return (
            <label className={styles.choice} data-slot="radio-group-option" key={option.value}>
              <input
                aria-describedby={option.description ? descriptionId : undefined}
                aria-labelledby={labelId}
                checked={value === undefined ? undefined : value === option.value}
                className={`${styles.choiceInput} ${styles.radioInput}`}
                data-slot="radio-group-input"
                defaultChecked={value === undefined ? defaultValue === option.value : undefined}
                disabled={option.disabled}
                name={name}
                onChange={(event) => onValueChange?.(event.currentTarget.value)}
                type="radio"
                value={option.value}
              />
              <span
                aria-hidden="true"
                className={styles.radioIndicator}
                data-slot="radio-group-indicator"
              />
              <span className={styles.choiceCopy}>
                <span
                  className={styles.choiceLabel}
                  data-slot="radio-group-label"
                  id={labelId}
                >
                  {option.label}
                </span>
                {option.description ? (
                  <span
                    className={styles.choiceDescription}
                    data-slot="radio-group-description"
                    id={descriptionId}
                  >
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
