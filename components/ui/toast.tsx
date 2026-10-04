"use client"

import { Toast as ToastPrimitive } from "radix-ui"
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ReactNode,
} from "react"

import styles from "./toast.module.css"

export type ToastTone = "neutral" | "info" | "success" | "warning" | "error"

export type ToastOptions = Readonly<{
  action?: Readonly<{ label: string; onClick: () => void }>
  description?: string
  duration?: number
  id?: string
  onDismiss?: () => void
  title: string
  tone?: ToastTone
}>

export type ToastProviderProps = Readonly<{
  children: ReactNode
  closeLabel: string
  viewportLabel: string
}>

type ToastHelperOptions = Omit<ToastOptions, "title" | "tone">

export type ToastApi = Readonly<{
  dismiss: (id?: string) => void
  error: (title: string, options?: ToastHelperOptions) => string
  info: (title: string, options?: ToastHelperOptions) => string
  neutral: (title: string, options?: ToastHelperOptions) => string
  show: (options: ToastOptions) => string
  success: (title: string, options?: ToastHelperOptions) => string
  update: (id: string, options: Partial<Omit<ToastOptions, "id">>) => void
  warning: (title: string, options?: ToastHelperOptions) => string
}>

type ToastItem = Omit<ToastOptions, "duration" | "id" | "tone"> & {
  duration: number
  id: string
  tone: ToastTone
}

type ToastStore = Readonly<{
  active: ToastItem[]
  pending: ToastItem[]
}>

const ToastContext = createContext<ToastApi | null>(null)

const durationByTone: Record<ToastTone, number> = {
  neutral: 5000,
  info: 5000,
  success: 5000,
  warning: 7000,
  error: 9000,
}

function classes(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ")
}

export const ToastViewport = forwardRef<
  ComponentRef<typeof ToastPrimitive.Viewport>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(function ToastViewport({ className, ...props }, ref) {
  return <ToastPrimitive.Viewport ref={ref} className={classes(styles.viewport, className)} {...props} />
})

type ToastRootProps = ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & { tone?: ToastTone }

export const ToastRoot = forwardRef<ComponentRef<typeof ToastPrimitive.Root>, ToastRootProps>(
  function ToastRoot({ className, tone = "neutral", ...props }, ref) {
    return (
      <ToastPrimitive.Root
        ref={ref}
        className={classes(styles.root, className)}
        data-tone={tone}
        {...props}
      />
    )
  },
)

export const ToastTitle = forwardRef<
  ComponentRef<typeof ToastPrimitive.Title>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(function ToastTitle({ className, ...props }, ref) {
  return <ToastPrimitive.Title ref={ref} className={classes(styles.title, className)} {...props} />
})

export const ToastDescription = forwardRef<
  ComponentRef<typeof ToastPrimitive.Description>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(function ToastDescription({ className, ...props }, ref) {
  return <ToastPrimitive.Description ref={ref} className={classes(styles.description, className)} {...props} />
})

export const ToastAction = forwardRef<
  ComponentRef<typeof ToastPrimitive.Action>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(function ToastAction({ className, ...props }, ref) {
  return <ToastPrimitive.Action ref={ref} className={classes(styles.action, className)} {...props} />
})

export const ToastClose = forwardRef<
  ComponentRef<typeof ToastPrimitive.Close>,
  ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(function ToastClose({ className, ...props }, ref) {
  return <ToastPrimitive.Close ref={ref} className={classes(styles.close, className)} {...props} />
})

function nextStoreAfterDismiss(store: ToastStore, id?: string): { next: ToastStore; removed: ToastItem[] } {
  if (!id) return { next: { active: [], pending: [] }, removed: [...store.active, ...store.pending] }

  const removed = [...store.active, ...store.pending].filter((item) => item.id === id)
  if (removed.length === 0) return { next: store, removed }

  const active = store.active.filter((item) => item.id !== id)
  const pending = store.pending.filter((item) => item.id !== id)
  while (active.length < 3 && pending.length > 0) active.push(pending.shift() as ToastItem)
  return { next: { active, pending }, removed }
}

export function ToastProvider({ children, closeLabel, viewportLabel }: ToastProviderProps) {
  const prefix = useId().replaceAll(":", "")
  const counter = useRef(0)
  const dismissed = useRef(new Set<string>())
  const [store, setStore] = useState<ToastStore>({ active: [], pending: [] })

  const notifyDismissed = useCallback((items: ToastItem[]) => {
    for (const item of items) {
      if (dismissed.current.has(item.id)) continue
      dismissed.current.add(item.id)
      item.onDismiss?.()
    }
  }, [])

  const dismiss = useCallback((id?: string) => {
    setStore((current) => {
      const { next, removed } = nextStoreAfterDismiss(current, id)
      notifyDismissed(removed)
      return next
    })
  }, [notifyDismissed])

  const show = useCallback((options: ToastOptions) => {
    counter.current += 1
    const id = options.id ?? `${prefix}-toast-${counter.current}`
    dismissed.current.delete(id)
    setStore((current) => {
      const currentItem = [...current.active, ...current.pending].find((item) => item.id === id)
      const tone = options.tone ?? currentItem?.tone ?? "neutral"
      const item: ToastItem = {
        ...currentItem,
        ...options,
        duration: options.duration ?? currentItem?.duration ?? durationByTone[tone],
        id,
        tone,
      }
      if (current.active.some((candidate) => candidate.id === id)) {
        return { ...current, active: current.active.map((candidate) => candidate.id === id ? item : candidate) }
      }
      if (current.pending.some((candidate) => candidate.id === id)) {
        return { ...current, pending: current.pending.map((candidate) => candidate.id === id ? item : candidate) }
      }
      if (current.active.length < 3) return { ...current, active: [...current.active, item] }
      return { ...current, pending: [...current.pending, item] }
    })
    return id
  }, [prefix])

  const update = useCallback<ToastApi["update"]>((id, options) => {
    setStore((current) => {
      const updateItem = (item: ToastItem) => {
        if (item.id !== id) return item
        const tone = options.tone ?? item.tone
        return {
          ...item,
          ...options,
          duration: options.duration ?? (options.tone ? durationByTone[tone] : item.duration),
          id,
          tone,
        }
      }
      return { active: current.active.map(updateItem), pending: current.pending.map(updateItem) }
    })
  }, [])

  const api = useMemo<ToastApi>(() => {
    const helper = (tone: ToastTone) => (title: string, options: ToastHelperOptions = {}) => show({ ...options, title, tone })
    return {
      dismiss,
      error: helper("error"),
      info: helper("info"),
      neutral: helper("neutral"),
      show,
      success: helper("success"),
      update,
      warning: helper("warning"),
    }
  }, [dismiss, show, update])

  return (
    <ToastContext.Provider value={api}>
      <ToastPrimitive.Provider label={viewportLabel} swipeDirection="right">
        {children}
        {store.active.map((item) => (
          <ToastRoot
            aria-atomic="true"
            data-duration={item.duration}
            duration={item.duration === 0 ? Number.POSITIVE_INFINITY : item.duration}
            key={item.id}
            onOpenChange={(open) => {
              if (!open) dismiss(item.id)
            }}
            open
            role={item.tone === "error" ? "alert" : "status"}
            tone={item.tone}
            type={item.tone === "error" ? "foreground" : "background"}
          >
            <span aria-hidden className={styles.signal} />
            <div className={styles.copy}>
              <ToastTitle>{item.title}</ToastTitle>
              {item.description ? <ToastDescription>{item.description}</ToastDescription> : null}
            </div>
            {item.action ? (
              <ToastAction altText={item.action.label} onClick={item.action.onClick}>
                {item.action.label}
              </ToastAction>
            ) : null}
            <ToastClose aria-label={closeLabel}><span aria-hidden>×</span></ToastClose>
          </ToastRoot>
        ))}
        <ToastViewport label={viewportLabel} />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}
