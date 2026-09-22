"use client"

import { CaretDown, CaretUp, Check } from "@phosphor-icons/react"
import { Select as SelectPrimitive } from "radix-ui"
import { forwardRef, type ComponentPropsWithoutRef, type ComponentRef } from "react"

import styles from "./select.module.css"

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export const Select = SelectPrimitive.Root
export const SelectGroup = SelectPrimitive.Group
export const SelectValue = SelectPrimitive.Value

export const SelectTrigger = forwardRef<
  ComponentRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(function SelectTrigger({ children, className, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger ref={ref} className={classes(styles.trigger, className)} {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <CaretDown aria-hidden className={styles.triggerIcon} size={16} weight="bold" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})

export const SelectContent = forwardRef<
  ComponentRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ children, className, position = "popper", sideOffset = 5, ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={classes(styles.content, className)}
        collisionPadding={8}
        position={position}
        sideOffset={sideOffset}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className={styles.scrollButton}>
          <CaretUp aria-hidden size={14} weight="bold" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className={styles.viewport}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className={styles.scrollButton}>
          <CaretDown aria-hidden size={14} weight="bold" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})

export const SelectLabel = forwardRef<
  ComponentRef<typeof SelectPrimitive.Label>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function SelectLabel({ className, ...props }, ref) {
  return <SelectPrimitive.Label ref={ref} className={classes(styles.label, className)} {...props} />
})

export const SelectItem = forwardRef<
  ComponentRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ children, className, ...props }, ref) {
  return (
    <SelectPrimitive.Item ref={ref} className={classes(styles.item, className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className={styles.itemIndicator} data-select-indicator>
        <Check aria-hidden size={16} weight="bold" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
})

export const SelectSeparator = forwardRef<
  ComponentRef<typeof SelectPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function SelectSeparator({ className, ...props }, ref) {
  return <SelectPrimitive.Separator ref={ref} className={classes(styles.separator, className)} {...props} />
})
