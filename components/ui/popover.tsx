"use client"

import { Popover as PopoverPrimitive } from "radix-ui"
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type HTMLAttributes,
} from "react"

import styles from "./popover.module.css"

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

const PopoverLabelContext = createContext<{ titleId: string; descriptionId: string } | null>(null)

export function Popover(props: ComponentPropsWithoutRef<typeof PopoverPrimitive.Root>) {
  const id = useId()
  return (
    <PopoverLabelContext.Provider value={{ titleId: `${id}-title`, descriptionId: `${id}-description` }}>
      <PopoverPrimitive.Root {...props} />
    </PopoverLabelContext.Provider>
  )
}

export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor

export const PopoverContent = forwardRef<
  ComponentRef<typeof PopoverPrimitive.Content>,
  Omit<ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>, "asChild">
>(function PopoverContent({ className, sideOffset = 8, ...props }, ref) {
  const label = useContext(PopoverLabelContext)
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        aria-describedby={props["aria-describedby"] ?? label?.descriptionId}
        aria-labelledby={props["aria-labelledby"] ?? label?.titleId}
        className={classes(styles.content, className)}
        collisionPadding={12}
        role={props.role ?? "dialog"}
        sideOffset={sideOffset}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
})

export function PopoverHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes(styles.header, className)} {...props} />
}

export function PopoverTitle({ className, id, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  const label = useContext(PopoverLabelContext)
  return <h2 id={id ?? label?.titleId} className={classes(styles.title, className)} {...props} />
}

export function PopoverDescription({ className, id, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  const label = useContext(PopoverLabelContext)
  return <p id={id ?? label?.descriptionId} className={classes(styles.description, className)} {...props} />
}
