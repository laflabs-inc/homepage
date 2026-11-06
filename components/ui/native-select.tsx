"use client"

import { CaretDown } from "@phosphor-icons/react/dist/ssr"
import type { ComponentPropsWithRef } from "react"

import { useFieldControlProps } from "./field"
import styles from "./form-control.module.css"

export function NativeSelect(props: ComponentPropsWithRef<"select">) {
  const fieldProps = useFieldControlProps(props)

  return (
    <span className={styles.selectWrap} data-slot="native-select-wrap">
      <select
        {...fieldProps}
        className={[styles.control, styles.select, props.className].filter(Boolean).join(" ")}
        data-slot="native-select"
      />
      <CaretDown aria-hidden className={styles.selectIcon} size={16} weight="bold" />
    </span>
  )
}
