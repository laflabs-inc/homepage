"use client"

import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type AriaAttributes,
  type ComponentPropsWithRef,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from "react"

import styles from "./field.module.css"

type FieldContextValue = Readonly<{
  controlId: string
  defaultDescriptionId: string
  defaultErrorId: string
  descriptionIds: readonly string[]
  errorIds: readonly string[]
  invalid: boolean
  registerDescription: (id: string) => () => void
  registerError: (id: string) => () => void
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
  return Children.toArray(children).some((child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return false
    if (child.type === part) return hasContent(child.props.children)
    return hasPart(child.props.children, part)
  })
}

function getPartId(
  children: ReactNode,
  part: typeof FieldDescription | typeof FieldError,
): string | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ children?: ReactNode; id?: string }>(child)) continue
    if (child.type === part && child.props.id?.trim()) return child.props.id
    const nestedId = getPartId(child.props.children, part)
    if (nestedId) return nestedId
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
      ...field.descriptionIds,
      ...field.errorIds,
    ),
  }
}

export type FieldOrientation = "vertical" | "horizontal" | "responsive"

export type FieldProps = HTMLAttributes<HTMLDivElement> & {
  invalid?: boolean
  orientation?: FieldOrientation
  required?: boolean
}

export function Field({
  children,
  className,
  invalid = false,
  orientation = "vertical",
  required = false,
  ...props
}: FieldProps) {
  const prefix = useId()
  const defaultDescriptionId = `${prefix}-description`
  const defaultErrorId = `${prefix}-error`
  const staticDescriptionId = hasPart(children, FieldDescription)
    ? getPartId(children, FieldDescription) ?? defaultDescriptionId
    : undefined
  const staticErrorId = hasPart(children, FieldError)
    ? getPartId(children, FieldError) ?? defaultErrorId
    : undefined
  const [registeredDescriptionIds, setRegisteredDescriptionIds] = useState<string[]>([])
  const [registeredErrorIds, setRegisteredErrorIds] = useState<string[]>([])

  const registerDescription = useCallback((id: string) => {
    setRegisteredDescriptionIds((current) => current.includes(id) ? current : [...current, id])
    return () => setRegisteredDescriptionIds((current) => current.filter((value) => value !== id))
  }, [])
  const registerError = useCallback((id: string) => {
    setRegisteredErrorIds((current) => current.includes(id) ? current : [...current, id])
    return () => setRegisteredErrorIds((current) => current.filter((value) => value !== id))
  }, [])

  const value = useMemo<FieldContextValue>(() => ({
    controlId: getControlId(children) ?? `${prefix}-control`,
    defaultDescriptionId,
    defaultErrorId,
    descriptionIds: [...new Set([
      ...(staticDescriptionId ? [staticDescriptionId] : []),
      ...registeredDescriptionIds,
    ])],
    errorIds: [...new Set([
      ...(staticErrorId ? [staticErrorId] : []),
      ...registeredErrorIds,
    ])],
    invalid,
    registerDescription,
    registerError,
    required,
  }), [
    children,
    defaultDescriptionId,
    defaultErrorId,
    invalid,
    prefix,
    registerDescription,
    registerError,
    registeredDescriptionIds,
    registeredErrorIds,
    required,
    staticDescriptionId,
    staticErrorId,
  ])

  return (
    <FieldContext.Provider value={value}>
      <div
        {...props}
        className={[styles.field, className].filter(Boolean).join(" ")}
        data-invalid={invalid || undefined}
        data-orientation={orientation}
        data-slot="field"
      >
        {children}
      </div>
    </FieldContext.Provider>
  )
}

export type FieldGroupProps = HTMLAttributes<HTMLDivElement>

export function FieldGroup({ className, ...props }: FieldGroupProps) {
  return (
    <div
      {...props}
      className={[styles.group, className].filter(Boolean).join(" ")}
      data-slot="field-group"
    />
  )
}

export type FieldSetProps = ComponentPropsWithRef<"fieldset">

export function FieldSet({ className, ...props }: FieldSetProps) {
  return (
    <fieldset
      {...props}
      className={[styles.fieldSet, className].filter(Boolean).join(" ")}
      data-slot="field-set"
    />
  )
}

export type FieldLegendProps = ComponentPropsWithRef<"legend">

export function FieldLegend({ className, ...props }: FieldLegendProps) {
  return (
    <legend
      {...props}
      className={[styles.legend, className].filter(Boolean).join(" ")}
      data-slot="field-legend"
    />
  )
}

export type FieldContentProps = HTMLAttributes<HTMLDivElement>

export function FieldContent({ className, ...props }: FieldContentProps) {
  return (
    <div
      {...props}
      className={[styles.content, className].filter(Boolean).join(" ")}
      data-slot="field-content"
    />
  )
}

export type FieldTitleProps = HTMLAttributes<HTMLDivElement>

export function FieldTitle({ className, ...props }: FieldTitleProps) {
  return (
    <div
      {...props}
      className={[styles.title, className].filter(Boolean).join(" ")}
      data-slot="field-title"
    />
  )
}

export type FieldSeparatorProps = HTMLAttributes<HTMLDivElement>

export function FieldSeparator({ className, ...props }: FieldSeparatorProps) {
  return (
    <div
      {...props}
      className={[styles.separator, className].filter(Boolean).join(" ")}
      data-slot="field-separator"
      role={props.role ?? "separator"}
    />
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
      data-slot="field-label"
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
  const visible = hasContent(children)
  const id = props.id ?? field?.defaultDescriptionId
  const registerDescription = field?.registerDescription

  useEffect(() => {
    if (!registerDescription || !visible || !id) return
    return registerDescription(id)
  }, [id, registerDescription, visible])

  if (!visible) return null

  return (
    <p
      {...props}
      className={[styles.description, className].filter(Boolean).join(" ")}
      data-slot="field-description"
      id={id}
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
  const visible = hasContent(children)
  const id = props.id ?? field?.defaultErrorId
  const registerError = field?.registerError

  useEffect(() => {
    if (!registerError || !visible || !id) return
    return registerError(id)
  }, [id, registerError, visible])

  if (!visible) return null

  return (
    <p
      {...props}
      className={[styles.error, className].filter(Boolean).join(" ")}
      data-slot="field-error"
      id={id}
      role={props.role ?? "alert"}
    >
      {children}
    </p>
  )
}
