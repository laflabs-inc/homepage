"use client"

import { X } from "@phosphor-icons/react"
import { Dialog as DialogPrimitive } from "radix-ui"
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type HTMLAttributes,
} from "react"

import styles from "./overlay-shell.module.css"

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

export const DialogOverlay = forwardRef<
  ComponentRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return <DialogPrimitive.Overlay ref={ref} className={classes(styles.overlay, className)} {...props} />
})

type DialogContentProps = Omit<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  "asChild"
> & {
  closeLabel?: string
  scroll?: "content" | "body"
  size?: "small" | "medium" | "large" | "full"
}

export const DialogContent = forwardRef<
  ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent({ children, className, closeLabel, scroll = "content", size = "medium", ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={classes(styles.content, className)}
        data-scroll={scroll}
        data-size={size}
        {...props}
      >
        {children}
        {closeLabel ? (
          <DialogPrimitive.Close className={styles.close} aria-label={closeLabel}>
            <X aria-hidden size={18} weight="bold" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})

export const DialogTitle = forwardRef<
  ComponentRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return <DialogPrimitive.Title ref={ref} className={classes(styles.title, className)} {...props} />
})

export const DialogDescription = forwardRef<
  ComponentRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return <DialogPrimitive.Description ref={ref} className={classes(styles.description, className)} {...props} />
})

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes(styles.header, className)} {...props} />
}

export const DialogBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function DialogBody({ className, ...props }, ref) {
    return <div ref={ref} className={classes(styles.body, className)} data-dialog-body="" {...props} />
  },
)

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes(styles.footer, className)} {...props} />
}
