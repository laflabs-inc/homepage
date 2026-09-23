import type { ComponentPropsWithRef } from "react"

import styles from "./panel.module.css"

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export type PanelProps = ComponentPropsWithRef<"div"> & {
  tone?: "default" | "subtle" | "inverse"
}

export function Panel({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  className,
  role,
  tone = "default",
  ...props
}: PanelProps) {
  return (
    <div
      {...props}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={classes(styles.panel, className)}
      data-tone={tone}
      role={role ?? (ariaLabel || ariaLabelledBy ? "region" : undefined)}
    />
  )
}

export function PanelHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={classes(styles.header, className)} />
}

export type PanelTitleProps = ComponentPropsWithRef<"h3"> & {
  as?: "h2" | "h3" | "h4"
}

export function PanelTitle({ as: Title = "h3", className, ...props }: PanelTitleProps) {
  return <Title {...props} className={classes(styles.title, className)} />
}

export function PanelDescription({ className, ...props }: ComponentPropsWithRef<"p">) {
  return <p {...props} className={classes(styles.description, className)} />
}

export function PanelAction({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={classes(styles.action, className)} />
}

export function PanelContent({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={classes(styles.content, className)} />
}

export function PanelFooter({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={classes(styles.footer, className)} />
}
