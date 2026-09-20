"use client"

import { CaretDown } from "@phosphor-icons/react/dist/ssr"
import type { SelectHTMLAttributes } from "react"

import { useFieldControlProps } from "./field"
import styles from "./form-control.module.css"

export function NativeSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const fieldProps = useFieldControlProps(props)

  return (
    <span className={styles.selectWrap}>
      <select
        {...fieldProps}
        className={[styles.control, styles.select, props.className].filter(Boolean).join(" ")}
      />
      <CaretDown aria-hidden className={styles.selectIcon} size={16} weight="bold" />
    </span>
  )
}
