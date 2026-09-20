"use client"

import type { InputHTMLAttributes } from "react"

import { useFieldControlProps } from "./field"
import styles from "./form-control.module.css"

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const fieldProps = useFieldControlProps(props)
  return (
    <input
      {...fieldProps}
      className={[styles.control, props.className].filter(Boolean).join(" ")}
    />
  )
}
