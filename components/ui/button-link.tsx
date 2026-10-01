import type { ComponentPropsWithRef } from "react"

import {
  getButtonClassName,
  type ButtonSize,
  type ButtonVariant,
} from "./button-contract"

type ButtonLinkBaseProps = Omit<ComponentPropsWithRef<"a">, "className"> & {
  className?: string
  variant?: ButtonVariant
}

type ButtonLinkTextProps = ButtonLinkBaseProps & {
  size?: Exclude<ButtonSize, "icon">
}

type ButtonLinkIconProps = ButtonLinkBaseProps & {
  "aria-label": string
  size: "icon"
}

export type ButtonLinkProps = ButtonLinkTextProps | ButtonLinkIconProps

export function ButtonLink({
  className,
  size = "default",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <a
      {...props}
      className={getButtonClassName({ className, size, variant })}
      data-size={size}
      data-variant={variant}
    />
  )
}
