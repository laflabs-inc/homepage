"use client"

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  type AriaAttributes,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react"

import styles from "./field.module.css"

type FieldContextValue = Readonly<{
  controlId: string
  descriptionId: string
  errorId: string
  hasDescription: boolean
  hasError: boolean
  invalid: boolean
  required: boolean
}>

type FieldControlAttributes = {
  id?: string
  required?: boolean
  "aria-invalid"?: AriaAttributes["aria-invalid"]
  "aria-describedby"?: string
}

const FieldContext = createContext<FieldContextValue | null>(null)

function mergeIds(...values: Array<string | undefined>): string | undefined {
  const ids = [...new Set(values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []))]
  return ids.length > 0 ? ids.join(" ") : undefined
}

function hasContent(children: ReactNode): boolean {
  return Children.toArray(children).some((child) =>
    typeof child === "string" ? child.trim().length > 0 : child !== null && child !== undefined,
  )
}

function hasPart(
  children: ReactNode,
  part: typeof FieldDescription | typeof FieldError,
): boolean {
  return Children.toArray(children).some((child) =>
    isValidElement<{ children?: ReactNode }>(child)
      && child.type === part
      && hasContent(child.props.children),
  )
}

function getPartId(
  children: ReactNode,
  part: typeof FieldDescription | typeof FieldError,
): string | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ id?: string }>(child) || child.type !== part) continue
    if (child.props.id?.trim()) return child.props.id
  }
  return undefined
}

function getControlId(children: ReactNode): string | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ id?: string }>(child)) continue
    if (
      child.type === FieldLabel
      || child.type === FieldDescription
      || child.type === FieldError
      || child.type === Label
    ) continue
    if (child.props.id?.trim()) return child.props.id
  }
  return undefined
}

export function useFieldControlProps<T extends FieldControlAttributes>(props: T): T {
  const field = useContext(FieldContext)
  if (!field) return props

  return {
    ...props,
    id: props.id ?? field.controlId,
    required: props.required ?? field.required,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
    "aria-describedby": mergeIds(
      props["aria-describedby"],
      field.hasDescription ? field.descriptionId : undefined,
      field.hasError ? field.errorId : undefined,
    ),
  }
}

export type FieldProps = HTMLAttributes<HTMLDivElement> & {
  invalid?: boolean
  required?: boolean
}

export function Field({
  children,
  className,
  invalid = false,
  required = false,
  ...props
}: FieldProps) {
  const prefix = useId()
  const value: FieldContextValue = {
    controlId: getControlId(children) ?? `${prefix}-control`,
    descriptionId: getPartId(children, FieldDescription) ?? `${prefix}-description`,
    errorId: getPartId(children, FieldError) ?? `${prefix}-error`,
    hasDescription: hasPart(children, FieldDescription),
    hasError: hasPart(children, FieldError),
    invalid,
    required,
  }

  return (
    <FieldContext.Provider value={value}>
      <div
        {...props}
        className={[styles.field, className].filter(Boolean).join(" ")}
        data-invalid={invalid || undefined}
      >
        {children}
      </div>
    </FieldContext.Provider>
  )
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={[styles.label, className].filter(Boolean).join(" ")} />
}

export function FieldLabel({ className, children, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  const field = useContext(FieldContext)
  return (
    <Label
      {...props}
      className={className}
      data-required={field?.required || undefined}
      htmlFor={props.htmlFor ?? field?.controlId}
    >
      {children}
    </Label>
  )
}

export function FieldDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  const field = useContext(FieldContext)
  if (!hasContent(children)) return null

  return (
    <p
      {...props}
      className={[styles.description, className].filter(Boolean).join(" ")}
      id={props.id ?? field?.descriptionId}
    >
      {children}
    </p>
  )
}

export function FieldError({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  const field = useContext(FieldContext)
  if (!hasContent(children)) return null

  return (
    <p
      {...props}
      className={[styles.error, className].filter(Boolean).join(" ")}
      id={props.id ?? field?.errorId}
      role={props.role ?? "alert"}
    >
      {children}
    </p>
  )
}
