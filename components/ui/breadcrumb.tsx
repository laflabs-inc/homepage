import { CaretRight, DotsThree } from "@phosphor-icons/react/dist/ssr"
import type { ComponentPropsWithRef } from "react"

import styles from "./breadcrumb.module.css"

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export function Breadcrumb({ "aria-label": ariaLabel = "Breadcrumb", className, ...props }: ComponentPropsWithRef<"nav">) {
  return <nav aria-label={ariaLabel} className={classes(styles.breadcrumb, className)} {...props} />
}

export function BreadcrumbList({ className, ...props }: ComponentPropsWithRef<"ol">) {
  return <ol className={classes(styles.list, className)} {...props} />
}

export function BreadcrumbItem({ className, ...props }: ComponentPropsWithRef<"li">) {
  return <li className={classes(styles.item, className)} {...props} />
}

export function BreadcrumbLink({ className, ...props }: ComponentPropsWithRef<"a">) {
  return <a className={classes(styles.link, className)} {...props} />
}

export function BreadcrumbPage({ className, ...props }: ComponentPropsWithRef<"span">) {
  return <span aria-current="page" className={classes(styles.page, className)} {...props} />
}

export function BreadcrumbSeparator({ children, className, ...props }: ComponentPropsWithRef<"li">) {
  return (
    <li
      aria-hidden="true"
      className={classes(styles.separator, className)}
      data-breadcrumb-separator
      {...props}
    >
      {children ?? <CaretRight aria-hidden size={12} weight="bold" />}
    </li>
  )
}

export type BreadcrumbEllipsisProps = ComponentPropsWithRef<"span"> & { label: string }

export function BreadcrumbEllipsis({ className, label, ...props }: BreadcrumbEllipsisProps) {
  return (
    <span aria-label={label} className={classes(styles.ellipsis, className)} role="img" {...props}>
      <DotsThree aria-hidden size={18} weight="bold" />
    </span>
  )
}
