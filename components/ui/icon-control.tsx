import type { ButtonHTMLAttributes, ReactNode } from "react"

import { Button } from "./button"

export type IconControlProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "aria-labelledby" | "children"
> & {
  children: ReactNode
  label: string
}

/**
 * @deprecated Use Button with size="icon" and an aria-label.
 */
export function IconControl({ className, label, type, ...props }: IconControlProps) {
  return (
    <Button
      {...props}
      aria-label={label}
      className={className}
      size="icon"
      variant="secondary"
      type={type ?? "button"}
    />
  )
}
