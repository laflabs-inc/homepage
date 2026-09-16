import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react"

import styles from "./action.module.css"

type ActionVariant = "primary" | "secondary" | "inverse"

type ActionSharedProps = {
  children: ReactNode
  className?: string
  variant?: ActionVariant
}

type ActionLinkProps = ActionSharedProps
  & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className" | "href">
  & { href: string }

type ActionButtonProps = ActionSharedProps
  & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">
  & { href?: never }

export type ActionProps = ActionLinkProps | ActionButtonProps

function isActionLink(props: ActionProps): props is ActionLinkProps {
  return typeof props.href === "string"
}

export function Action({ className, variant = "primary", ...props }: ActionProps) {
  const classes = [styles.action, styles[variant], className].filter(Boolean).join(" ")

  if (isActionLink(props)) {
    const { href, ...linkProps } = props

    return <a {...linkProps} className={classes} data-variant={variant} href={href} />
  }

  const buttonProps = props as ActionButtonProps

  return <button {...buttonProps} className={classes} data-variant={variant} type={buttonProps.type ?? "button"} />
}
