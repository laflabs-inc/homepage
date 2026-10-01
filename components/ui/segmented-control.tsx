"use client"

import { motion, useReducedMotion } from "motion/react"
import {
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useId,
  useRef,
} from "react"

import styles from "./segmented-control.module.css"

export type SegmentedControlOption<Value extends string> = {
  value: Value
  label: string
  content: ReactNode
  disabled?: boolean
  buttonProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-checked" | "aria-label" | "children" | "disabled" | "onClick" | "role" | "tabIndex" | "type"
  > & Partial<Record<`data-${string}`, string | number | boolean | undefined>>
}

export type SegmentedControlProps<Value extends string> = {
  label: string
  value: Value
  options: readonly SegmentedControlOption<Value>[]
  onValueChange: (value: Value) => void
  className?: string
}

type SegmentedControlRootProps<Value extends string> =
  SegmentedControlProps<Value> & {
    presentation: "radio" | "pressed"
  }

function SegmentedControlRoot<Value extends string>({
  label,
  value,
  options,
  onValueChange,
  className,
  presentation,
}: SegmentedControlRootProps<Value>) {
  if (process.env.NODE_ENV !== "production" && options.length < 2) {
    throw new Error("SegmentedControl requires at least two options")
  }

  const controlId = useId()
  const reducedMotion = useReducedMotion()
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedIndex = options.findIndex(
    (option) => option.value === value && !option.disabled,
  )
  const firstEnabledIndex = options.findIndex((option) => !option.disabled)
  const tabStopIndex = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex
  const legacyPressed = presentation === "pressed"

  function selectAndFocus(index: number) {
    const option = options[index]
    if (!option || option.disabled) return

    buttonRefs.current[index]?.focus()
    if (option.value !== value) onValueChange(option.value)
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const enabledIndices = options
      .map((option, optionIndex) => option.disabled ? -1 : optionIndex)
      .filter((optionIndex) => optionIndex >= 0)

    if (enabledIndices.length === 0) return

    const enabledPosition = enabledIndices.indexOf(index)
    let nextIndex: number | undefined

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      const nextPosition = enabledPosition < 0
        ? 0
        : (enabledPosition + 1) % enabledIndices.length
      nextIndex = enabledIndices[nextPosition]
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      const nextPosition = enabledPosition <= 0
        ? enabledIndices.length - 1
        : enabledPosition - 1
      nextIndex = enabledIndices[nextPosition]
    } else if (event.key === "Home") {
      nextIndex = enabledIndices[0]
    } else if (event.key === "End") {
      nextIndex = enabledIndices.at(-1)
    }

    if (nextIndex === undefined) return

    event.preventDefault()
    selectAndFocus(nextIndex)
  }

  return (
    <div
      aria-label={label}
      className={[styles.root, className].filter(Boolean).join(" ")}
      data-active-index={legacyPressed ? selectedIndex : undefined}
      data-slot="segmented-control"
      role={legacyPressed ? "group" : "radiogroup"}
    >
      {options.map((option, index) => {
        const active = option.value === value && !option.disabled
        const { onKeyDown, ...buttonProps } = option.buttonProps ?? {}

        return (
          <button
            {...buttonProps}
            ref={(element) => {
              buttonRefs.current[index] = element
            }}
            key={option.value}
            aria-checked={legacyPressed ? undefined : active}
            aria-label={option.label}
            aria-pressed={legacyPressed ? active : undefined}
            className={styles.button}
            data-active={active || undefined}
            disabled={option.disabled}
            role={legacyPressed ? undefined : "radio"}
            tabIndex={legacyPressed ? undefined : index === tabStopIndex ? 0 : -1}
            type="button"
            onClick={() => {
              if (!active && !option.disabled) onValueChange(option.value)
            }}
            onKeyDown={(event) => {
              if (!legacyPressed) handleKeyDown(event, index)
              onKeyDown?.(event)
            }}
          >
            {active ? (
              <motion.span
                aria-hidden="true"
                className={styles.indicator}
                data-slot="segmented-control-indicator"
                layoutId={"segmented-control-indicator-" + controlId}
                transition={reducedMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 520, damping: 38 }}
              />
            ) : null}
            <span className={styles.content} data-slot="segmented-control-content">
              {option.content}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function SegmentedControl<Value extends string>(
  props: SegmentedControlProps<Value>,
) {
  return <SegmentedControlRoot {...props} presentation="radio" />
}

/** @internal Compatibility adapter for the deprecated SegmentedToggle. */
export function SegmentedControlCompat<Value extends string>(
  props: SegmentedControlProps<Value>,
) {
  return <SegmentedControlRoot {...props} presentation="pressed" />
}
