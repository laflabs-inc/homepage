"use client"

import type { ComponentPropsWithRef } from "react"

import { useFieldControlProps } from "./field"
import styles from "./form-control.module.css"

export function Input(props: ComponentPropsWithRef<"input">) {
  const fieldProps = useFieldControlProps(props)
  return (
    <input
      {...fieldProps}
      className={[styles.control, props.className].filter(Boolean).join(" ")}
    />
  )
}
