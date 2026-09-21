"use client"

import type { ComponentPropsWithRef } from "react"

import { useFieldControlProps } from "./field"
import styles from "./form-control.module.css"

export function Textarea(props: ComponentPropsWithRef<"textarea">) {
  const fieldProps = useFieldControlProps(props)
  return (
    <textarea
      {...fieldProps}
      className={[styles.control, styles.textarea, props.className].filter(Boolean).join(" ")}
    />
  )
}
