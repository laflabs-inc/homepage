import { CaretLeft, CaretRight, DotsThree } from "@phosphor-icons/react/dist/ssr"
import type { ComponentPropsWithRef } from "react"

import styles from "./pagination.module.css"

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export function Pagination({ "aria-label": ariaLabel = "Pagination", className, ...props }: ComponentPropsWithRef<"nav">) {
  return <nav aria-label={ariaLabel} className={classes(styles.pagination, className)} {...props} />
}

export function PaginationContent({ className, ...props }: ComponentPropsWithRef<"ul">) {
  return <ul className={classes(styles.content, className)} {...props} />
}

export function PaginationItem({ className, ...props }: ComponentPropsWithRef<"li">) {
  return <li className={classes(styles.item, className)} {...props} />
}

export type PaginationLinkProps = ComponentPropsWithRef<"a"> & { isCurrent?: boolean }

export function PaginationLink({ className, isCurrent = false, ...props }: PaginationLinkProps) {
  return (
    <a
      aria-current={isCurrent ? "page" : undefined}
      className={classes(styles.link, isCurrent ? styles.current : undefined, className)}
      {...props}
    />
  )
}

type DirectionLinkProps = ComponentPropsWithRef<"a"> & { label: string }

export function PaginationPrevious({ children, className, label, ...props }: DirectionLinkProps) {
  return (
    <a aria-label={label} className={classes(styles.direction, className)} {...props}>
      <CaretLeft aria-hidden size={14} weight="bold" />
      <span>{children}</span>
    </a>
  )
}

export function PaginationNext({ children, className, label, ...props }: DirectionLinkProps) {
  return (
    <a aria-label={label} className={classes(styles.direction, className)} {...props}>
      <span>{children}</span>
      <CaretRight aria-hidden size={14} weight="bold" />
    </a>
  )
}

export function PaginationEllipsis({ className, label, ...props }: ComponentPropsWithRef<"span"> & { label: string }) {
  return (
    <span aria-label={label} className={classes(styles.ellipsis, className)} role="img" {...props}>
      <DotsThree aria-hidden size={18} weight="bold" />
    </span>
  )
}
