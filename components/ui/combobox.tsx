"use client"

import { CaretDown, Check } from "@phosphor-icons/react"
import { Popover as PopoverPrimitive } from "radix-ui"
import {
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
} from "react"

import { useFieldControlProps } from "./field"
import styles from "./combobox.module.css"

export type ComboboxOption = Readonly<{
  value: string
  label: string
  disabled?: boolean
  keywords?: readonly string[]
}>

export type ComboboxProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "defaultValue" | "onChange" | "value"
> & {
  defaultValue?: string
  emptyText: string
  onValueChange?: (value: string) => void
  options: readonly ComboboxOption[]
  value?: string
}

function optionText(option: ComboboxOption) {
  return [option.label, option.value, ...(option.keywords ?? [])].join(" ").toLocaleLowerCase()
}

export function Combobox({
  defaultValue = "",
  emptyText,
  onValueChange,
  options,
  value,
  ...inputProps
}: ComboboxProps) {
  const generatedId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const selectedValue = isControlled ? value : internalValue
  const selected = options.find((option) => option.value === selectedValue)
  const [query, setQuery] = useState(selected?.label ?? "")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listboxId = `${generatedId}-listbox`

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized || normalized === selected?.label.toLocaleLowerCase()) return options
    return options.filter((option) => optionText(option).includes(normalized))
  }, [options, query, selected?.label])

  function commit(option: ComboboxOption) {
    if (option.disabled) return
    if (!isControlled) setInternalValue(option.value)
    setQuery(option.label)
    setOpen(false)
    setActiveIndex(-1)
    onValueChange?.(option.value)
    inputRef.current?.focus()
  }

  function moveActive(direction: 1 | -1) {
    if (filteredOptions.length === 0) return
    let next = activeIndex
    for (let attempts = 0; attempts < filteredOptions.length; attempts += 1) {
      next = (next + direction + filteredOptions.length) % filteredOptions.length
      if (!filteredOptions[next]?.disabled) {
        setActiveIndex(next)
        return
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      setOpen(true)
      moveActive(event.key === "ArrowDown" ? 1 : -1)
      return
    }
    if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault()
      const option = filteredOptions[activeIndex]
      if (option) commit(option)
      return
    }
    if (event.key === "Escape" && open) {
      event.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
      setQuery(selected?.label ?? "")
    }
  }

  const fieldProps = useFieldControlProps({ ...inputProps, id: inputProps.id ?? `${generatedId}-input` })
  const activeOption = activeIndex >= 0 ? filteredOptions[activeIndex] : undefined

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setActiveIndex(-1)
          setQuery(selected?.label ?? "")
        }
      }}
    >
      <PopoverPrimitive.Anchor asChild>
        <div ref={rootRef} className={styles.root} data-open={open || undefined}>
          <div className={styles.control}>
            <input
              {...fieldProps}
              ref={inputRef}
              aria-activedescendant={activeOption ? `${listboxId}-option-${activeIndex}` : undefined}
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-expanded={open}
              className={[styles.input, inputProps.className].filter(Boolean).join(" ")}
              onBlur={(event) => {
                inputProps.onBlur?.(event)
                window.setTimeout(() => {
                  if (!rootRef.current?.contains(document.activeElement)) {
                    setOpen(false)
                    setActiveIndex(-1)
                  }
                }, 0)
              }}
              onChange={(event) => {
                setQuery(event.target.value)
                setOpen(true)
                setActiveIndex(-1)
                if (selectedValue) {
                  if (!isControlled) setInternalValue("")
                  onValueChange?.("")
                }
              }}
              onClick={(event) => {
                inputProps.onClick?.(event)
                if (!open) setQuery(selected?.label ?? "")
                setOpen(true)
              }}
              onFocus={(event) => {
                inputProps.onFocus?.(event)
                if (!open) setQuery(selected?.label ?? "")
                setOpen(true)
              }}
              onKeyDown={(event) => {
                inputProps.onKeyDown?.(event)
                if (!event.defaultPrevented) handleKeyDown(event)
              }}
              role="combobox"
              value={open ? query : selected?.label ?? ""}
            />
            <CaretDown aria-hidden className={styles.icon} size={16} weight="bold" />
          </div>
        </div>
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          id={listboxId}
          align="start"
          className={styles.listbox}
          collisionPadding={12}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => {
            if (rootRef.current?.contains(event.target as Node)) event.preventDefault()
          }}
          role="listbox"
          sideOffset={6}
        >
          {filteredOptions.length > 0 ? filteredOptions.map((option, index) => (
            <div
              id={`${listboxId}-option-${index}`}
              key={option.value}
              aria-disabled={option.disabled || undefined}
              aria-selected={option.value === selectedValue}
              className={styles.option}
              data-active={index === activeIndex || undefined}
              data-disabled={option.disabled || undefined}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => !option.disabled && setActiveIndex(index)}
              onClick={() => commit(option)}
              role="option"
            >
              <span>{option.label}</span>
              {option.value === selectedValue ? <Check aria-hidden size={16} weight="bold" /> : null}
            </div>
          )) : <p className={styles.empty}>{emptyText}</p>}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
