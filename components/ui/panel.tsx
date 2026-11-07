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
      data-slot="panel"
      data-tone={tone}
      role={role ?? (ariaLabel || ariaLabelledBy ? "region" : undefined)}
    />
  )
}

export function PanelHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={classes(styles.header, className)} data-slot="panel-header" />
}

export type PanelTitleProps = ComponentPropsWithRef<"h3"> & {
  as?: "h2" | "h3" | "h4"
}

export function PanelTitle({ as: Title = "h3", className, ...props }: PanelTitleProps) {
  return <Title {...props} className={classes(styles.title, className)} data-slot="panel-title" />
}

export function PanelDescription({ className, ...props }: ComponentPropsWithRef<"p">) {
  return <p {...props} className={classes(styles.description, className)} data-slot="panel-description" />
}

export function PanelAction({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={classes(styles.action, className)} data-slot="panel-action" />
}

export function PanelContent({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={classes(styles.content, className)} data-slot="panel-content" />
}

export function PanelFooter({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={classes(styles.footer, className)} data-slot="panel-footer" />
}
