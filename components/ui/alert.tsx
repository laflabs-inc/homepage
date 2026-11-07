"use client"

import {
  CheckCircle,
  Info,
  Warning,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr"
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode,
} from "react"

import styles from "./feedback.module.css"

const alertIcons = {
  info: Info,
  success: CheckCircle,
  warning: Warning,
  error: WarningCircle,
} as const

type AlertVariant = keyof typeof alertIcons

type AlertContextValue = Readonly<{
  titleId: string
  variant: AlertVariant
}>

const AlertContext = createContext<AlertContextValue | null>(null)

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export type AlertProps = Omit<ComponentPropsWithoutRef<"section">, "title"> & {
  action?: ReactNode
  live?: boolean
  title?: ReactNode
  variant?: AlertVariant
}

export const Alert = forwardRef<HTMLElement, AlertProps>(function Alert(
  { action, children, className, live = false, title, variant = "info", ...props },
  ref,
) {
  const titleId = useId()
  const DefaultIcon = alertIcons[variant]

  return (
    <AlertContext.Provider value={{ titleId, variant }}>
      <section
        {...props}
        ref={ref}
        aria-labelledby={titleId}
        className={classes(styles.alert, className)}
        data-slot="alert"
        data-variant={variant}
        role={live ? "alert" : undefined}
      >
        <span
          aria-hidden="true"
          className={styles.alertSignal}
          data-alert-signal
          data-slot="alert-signal"
        />
        {title !== undefined ? (
          <>
            <AlertIcon><DefaultIcon size={20} weight="bold" /></AlertIcon>
            <AlertContent>
              <AlertTitle>{title}</AlertTitle>
              {children !== undefined && children !== null ? (
                <AlertDescription>{children}</AlertDescription>
              ) : null}
            </AlertContent>
            {action !== undefined && action !== null ? (
              <AlertAction>{action}</AlertAction>
            ) : null}
          </>
        ) : children}
      </section>
    </AlertContext.Provider>
  )
})

export const AlertIcon = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function AlertIcon({ className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        aria-hidden="true"
        className={classes(styles.alertIcon, className)}
        data-slot="alert-icon"
      />
    )
  },
)

export const AlertContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function AlertContent({ className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        className={classes(styles.alertContent, className)}
        data-slot="alert-content"
      />
    )
  },
)

export const AlertTitle = forwardRef<HTMLHeadingElement, ComponentPropsWithoutRef<"h3">>(
  function AlertTitle({ className, id, ...props }, ref) {
    const context = useContext(AlertContext)
    return (
      <h3
        {...props}
        ref={ref}
        className={classes(styles.alertTitle, className)}
        data-slot="alert-title"
        id={id ?? context?.titleId}
      />
    )
  },
)

export const AlertDescription = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function AlertDescription({ className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        className={classes(styles.alertDescription, className)}
        data-slot="alert-description"
      />
    )
  },
)

export const AlertAction = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function AlertAction({ className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        className={classes(styles.alertAction, className)}
        data-slot="alert-action"
      />
    )
  },
)
