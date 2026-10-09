import styles from "./button.module.css"

export type ButtonVariant = "primary" | "secondary" | "outline" | "inverse" | "danger" | "ghost"
export type ButtonSize = "compact" | "default" | "icon"

export function getButtonClassName({
  className,
  size = "default",
  variant = "primary",
}: {
  className?: string
  size?: ButtonSize
  variant?: ButtonVariant
}) {
  return [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ")
}
