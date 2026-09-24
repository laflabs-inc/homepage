"use client"

import type { ButtonHTMLAttributes, ComponentPropsWithRef, HTMLAttributes } from "react"

import { useFieldControlProps } from "./field"
import styles from "./input-group.module.css"

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export function InputGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes(styles.group, className)} {...props} />
}

export function InputGroupInput(props: ComponentPropsWithRef<"input">) {
  const fieldProps = useFieldControlProps(props)
  return <input {...fieldProps} className={classes(styles.input, props.className)} />
}

export type InputGroupAddonProps = HTMLAttributes<HTMLDivElement> & {
  placement?: "start" | "end"
}

export function InputGroupAddon({ className, placement = "start", ...props }: InputGroupAddonProps) {
  return <div className={classes(styles.addon, className)} data-placement={placement} {...props} />
}

export function InputGroupText({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span aria-hidden="true" className={classes(styles.text, className)} {...props} />
}

export function InputGroupButton({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={classes(styles.button, className)} {...props} />
}
