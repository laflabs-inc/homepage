"use client"

import type { ComponentPropsWithRef, HTMLAttributes } from "react"

import { Button, type ButtonProps } from "./button"
import { useFieldControlProps } from "./field"
import styles from "./input-group.module.css"

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export function InputGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes(styles.group, className)} data-slot="input-group" {...props} />
}

export function InputGroupInput(props: ComponentPropsWithRef<"input">) {
  const fieldProps = useFieldControlProps(props)
  return (
    <input
      {...fieldProps}
      className={classes(styles.control, styles.input, props.className)}
      data-slot="input-group-input"
    />
  )
}

export function InputGroupTextarea(props: ComponentPropsWithRef<"textarea">) {
  const fieldProps = useFieldControlProps(props)
  return (
    <textarea
      {...fieldProps}
      className={classes(styles.control, styles.textarea, props.className)}
      data-slot="input-group-textarea"
    />
  )
}

export type InputGroupPlacement =
  | "inline-start"
  | "inline-end"
  | "block-start"
  | "block-end"

type InputGroupCompatibilityPlacement = "start" | "end"

export type InputGroupAddonProps = HTMLAttributes<HTMLDivElement> & {
  placement?: InputGroupPlacement | InputGroupCompatibilityPlacement
}

export function InputGroupAddon({ className, placement = "start", ...props }: InputGroupAddonProps) {
  const canonicalPlacement = placement === "start"
    ? "inline-start"
    : placement === "end"
      ? "inline-end"
      : placement

  return (
    <div
      className={classes(styles.addon, className)}
      data-placement={canonicalPlacement}
      data-slot="input-group-addon"
      {...props}
    />
  )
}

export function InputGroupText({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={classes(styles.text, className)}
      data-slot="input-group-text"
      {...props}
    />
  )
}

export type InputGroupButtonProps = ButtonProps

export function InputGroupButton({
  className,
  size = "compact",
  type = "button",
  variant = "ghost",
  ...props
}: InputGroupButtonProps) {
  const buttonProps = {
    ...props,
    className: classes(styles.button, className),
    size,
    type,
    variant,
  } as ButtonProps

  return (
    <Button
      {...buttonProps}
      data-slot="input-group-button"
    />
  )
}
