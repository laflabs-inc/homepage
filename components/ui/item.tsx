import type { ElementType, HTMLAttributes } from "react"

import styles from "./item.module.css"

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export type ItemProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "div" | "li"
  tone?: "default" | "subtle" | "inverse"
}

export function Item({ as = "div", className, tone = "default", ...props }: ItemProps) {
  const Component = as as ElementType
  return <Component className={classes(styles.item, className)} data-tone={tone} {...props} />
}

export function ItemMedia({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes(styles.media, className)} {...props} />
}

export function ItemContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes(styles.content, className)} {...props} />
}

export function ItemHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes(styles.header, className)} {...props} />
}

export function ItemTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={classes(styles.title, className)} {...props} />
}

export function ItemDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={classes(styles.description, className)} {...props} />
}

export function ItemActions({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes(styles.actions, className)} {...props} />
}

export function ItemFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes(styles.footer, className)} {...props} />
}
