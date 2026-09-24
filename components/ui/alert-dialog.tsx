"use client"

import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type HTMLAttributes,
} from "react"

import styles from "./alert-dialog.module.css"

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger

export const AlertDialogContent = forwardRef<
  ComponentRef<typeof AlertDialogPrimitive.Content>,
  Omit<ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>, "asChild">
>(function AlertDialogContent({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className={styles.overlay} />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={classes(styles.content, className)}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  )
})

export const AlertDialogTitle = forwardRef<
  ComponentRef<typeof AlertDialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(function AlertDialogTitle({ className, ...props }, ref) {
  return <AlertDialogPrimitive.Title ref={ref} className={classes(styles.title, className)} {...props} />
})

export const AlertDialogDescription = forwardRef<
  ComponentRef<typeof AlertDialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(function AlertDialogDescription({ className, ...props }, ref) {
  return <AlertDialogPrimitive.Description ref={ref} className={classes(styles.description, className)} {...props} />
})

export function AlertDialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes(styles.header, className)} {...props} />
}

export function AlertDialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes(styles.footer, className)} {...props} />
}

export const AlertDialogCancel = forwardRef<
  ComponentRef<typeof AlertDialogPrimitive.Cancel>,
  Omit<ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>, "asChild">
>(function AlertDialogCancel({ className, ...props }, ref) {
  return <AlertDialogPrimitive.Cancel ref={ref} className={classes(styles.cancel, className)} {...props} />
})

type AlertDialogActionProps = Omit<
  ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>,
  "asChild"
> & {
  variant?: "primary" | "destructive"
}

export const AlertDialogAction = forwardRef<
  ComponentRef<typeof AlertDialogPrimitive.Action>,
  AlertDialogActionProps
>(function AlertDialogAction({ className, variant = "primary", ...props }, ref) {
  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      className={classes(styles.action, className)}
      data-variant={variant}
      {...props}
    />
  )
})
