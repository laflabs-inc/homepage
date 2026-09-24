"use client"

import { X } from "@phosphor-icons/react"
import { Dialog as DialogPrimitive } from "radix-ui"
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type HTMLAttributes,
} from "react"

import styles from "./side-panel.module.css"

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export const SidePanel = DialogPrimitive.Root
export const SidePanelTrigger = DialogPrimitive.Trigger
export const SidePanelClose = DialogPrimitive.Close

type SidePanelContentProps = Omit<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  "asChild"
> & {
  closeLabel: string
  side?: "top" | "right" | "bottom" | "left"
}

export const SidePanelContent = forwardRef<
  ComponentRef<typeof DialogPrimitive.Content>,
  SidePanelContentProps
>(function SidePanelContent({ children, className, closeLabel, side = "right", ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={styles.overlay} />
      <DialogPrimitive.Content
        ref={ref}
        className={classes(styles.content, className)}
        data-side={side}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className={styles.close} aria-label={closeLabel}>
          <X aria-hidden size={18} weight="bold" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})

export const SidePanelTitle = forwardRef<
  ComponentRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function SidePanelTitle({ className, ...props }, ref) {
  return <DialogPrimitive.Title ref={ref} className={classes(styles.title, className)} {...props} />
})

export const SidePanelDescription = forwardRef<
  ComponentRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function SidePanelDescription({ className, ...props }, ref) {
  return <DialogPrimitive.Description ref={ref} className={classes(styles.description, className)} {...props} />
})

export function SidePanelHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes(styles.header, className)} {...props} />
}

export function SidePanelFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes(styles.footer, className)} {...props} />
}
