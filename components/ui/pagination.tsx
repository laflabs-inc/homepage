import { CaretLeft, CaretRight, DotsThree } from "@phosphor-icons/react/dist/ssr"
import type { ComponentPropsWithRef } from "react"

import styles from "./pagination.module.css"

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export function Pagination({ "aria-label": ariaLabel = "Pagination", className, ...props }: ComponentPropsWithRef<"nav">) {
  return (
    <nav
      aria-label={ariaLabel}
      className={classes(styles.pagination, className)}
      data-slot="pagination"
      {...props}
    />
  )
}

export function PaginationContent({ className, ...props }: ComponentPropsWithRef<"ul">) {
  return (
    <ul
      className={classes(styles.content, className)}
      data-pagination-rail
      data-slot="pagination-content"
      {...props}
    />
  )
}

export function PaginationItem({ className, ...props }: ComponentPropsWithRef<"li">) {
  return <li className={classes(styles.item, className)} data-slot="pagination-item" {...props} />
}

export type PaginationLinkProps = ComponentPropsWithRef<"a"> & { isCurrent?: boolean }

export function PaginationLink({ className, isCurrent = false, ...props }: PaginationLinkProps) {
  return (
    <a
      aria-current={isCurrent ? "page" : undefined}
      className={classes(styles.link, isCurrent ? styles.current : undefined, className)}
      data-slot="pagination-page"
      {...props}
    />
  )
}

type PaginationDirectionProps = ComponentPropsWithRef<"a"> & {
  disabled?: boolean
  label: string
}

export function PaginationPrevious({ children, className, disabled = false, href, label, onClick, ...props }: PaginationDirectionProps) {
  return (
    <a
      {...props}
      aria-disabled={disabled || undefined}
      aria-label={label}
      className={classes(styles.direction, className)}
      data-disabled={disabled || undefined}
      data-slot="pagination-previous"
      href={disabled ? undefined : href}
      onClick={disabled ? undefined : onClick}
    >
      <CaretLeft aria-hidden size={14} weight="bold" />
      <span>{children}</span>
    </a>
  )
}

export function PaginationNext({ children, className, disabled = false, href, label, onClick, ...props }: PaginationDirectionProps) {
  return (
    <a
      {...props}
      aria-disabled={disabled || undefined}
      aria-label={label}
      className={classes(styles.direction, className)}
      data-disabled={disabled || undefined}
      data-slot="pagination-next"
      href={disabled ? undefined : href}
      onClick={disabled ? undefined : onClick}
    >
      <span>{children}</span>
      <CaretRight aria-hidden size={14} weight="bold" />
    </a>
  )
}

export function PaginationEllipsis({ className, label, ...props }: ComponentPropsWithRef<"span"> & { label: string }) {
  return (
    <span
      aria-label={label}
      className={classes(styles.ellipsis, className)}
      data-slot="pagination-ellipsis"
      role="img"
      {...props}
    >
      <DotsThree aria-hidden size={18} weight="bold" />
    </span>
  )
}
