import type { ComponentPropsWithRef } from "react"

import {
  getButtonClassName,
  type ButtonSize,
  type ButtonVariant,
} from "./button-contract"

type ButtonBaseProps = Omit<ComponentPropsWithRef<"button">, "className"> & {
  className?: string
  variant?: ButtonVariant
  loading?: boolean
}

type ButtonTextProps = ButtonBaseProps & {
  size?: Exclude<ButtonSize, "icon">
}

type ButtonIconProps = ButtonBaseProps & {
  "aria-label": string
  size: "icon"
}

export type ButtonProps = ButtonTextProps | ButtonIconProps

export function Button({
  className,
  disabled = false,
  loading = false,
  size = "default",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={getButtonClassName({ className, size, variant })}
      data-size={size}
      data-slot="button"
      data-variant={variant}
      disabled={disabled || loading}
      type={type}
    />
  )
}
