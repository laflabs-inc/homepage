import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react"

import { Button } from "./button"
import { ButtonLink } from "./button-link"

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

/**
 * @deprecated Use Button for in-place actions or ButtonLink for navigation.
 */
export function Action({ className, variant = "primary", ...props }: ActionProps) {
  if (isActionLink(props)) {
    const { href, ...linkProps } = props

    return (
      <ButtonLink
        {...linkProps}
        className={className}
        href={href}
        variant={variant}
      />
    )
  }

  const buttonProps = props as ActionButtonProps

  return (
    <Button
      {...buttonProps}
      className={className}
      variant={variant}
    />
  )
}
