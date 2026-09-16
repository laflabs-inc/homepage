import { ArrowRight } from "@phosphor-icons/react/dist/ssr"
import type { AnchorHTMLAttributes, ReactNode } from "react"

import styles from "./text-link.module.css"

export type TextLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "className" | "href"
> & {
  children: ReactNode
  className?: string
  href: string
}

export function TextLink({ children, className, href, ...props }: TextLinkProps) {
  return (
    <a {...props} className={[styles.link, className].filter(Boolean).join(" ")} href={href}>
      <span>{children}</span>
      <ArrowRight aria-hidden size={14} weight="bold" />
    </a>
  )
}
