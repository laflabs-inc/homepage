"use client"

import { CheckCircle, Info, Warning, X, XCircle } from "@phosphor-icons/react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react"

import styles from "./notice-toast.module.css"

export type NoticeToastVariant = "info" | "success" | "warning" | "error"

export type NoticeToastInput = Readonly<{
  description?: string
  duration?: number
  title: string
  variant?: NoticeToastVariant
}>

type Notice = NoticeToastInput & Readonly<{ id: string }>
type NoticeToastContextValue = Readonly<{
  dismiss: (id: string) => void
  notify: (notice: NoticeToastInput) => string
}>

const NoticeToastContext = createContext<NoticeToastContextValue | null>(null)

const icons = {
  info: Info,
  success: CheckCircle,
  warning: Warning,
  error: XCircle,
} as const

function NoticeToast({ closeLabel, notice, onDismiss }: { closeLabel: string; notice: Notice; onDismiss: () => void }) {
  const { description, duration = 5000, title, variant = "info" } = notice
  const Icon = icons[variant]

  useEffect(() => {
    if (duration <= 0) return
    const timeout = window.setTimeout(onDismiss, duration)
    return () => window.clearTimeout(timeout)
  }, [duration, onDismiss])

  return (
    <section className={styles.toast} data-variant={variant} role={variant === "error" ? "alert" : "status"} aria-atomic="true">
      <Icon aria-hidden className={styles.icon} size={20} weight="bold" />
      <div className={styles.copy}>
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      <button type="button" className={styles.close} aria-label={closeLabel} onClick={onDismiss}>
        <X aria-hidden size={16} weight="bold" />
      </button>
    </section>
  )
}

export type NoticeToastProviderProps = Readonly<{
  children: ReactNode
  closeLabel: string
  viewportLabel: string
}>

export function NoticeToastProvider({ children, closeLabel, viewportLabel }: NoticeToastProviderProps) {
  const prefix = useId()
  const counter = useRef(0)
  const [notices, setNotices] = useState<Notice[]>([])
  const dismiss = useCallback((id: string) => {
    setNotices((current) => current.filter((notice) => notice.id !== id))
  }, [])
  const notify = useCallback((input: NoticeToastInput) => {
    counter.current += 1
    const id = `${prefix}-${counter.current}`
    setNotices((current) => [...current, { ...input, id }].slice(-3))
    return id
  }, [prefix])

  return (
    <NoticeToastContext.Provider value={{ dismiss, notify }}>
      {children}
      {notices.length > 0 ? (
        <aside aria-label={viewportLabel} className={styles.viewport} role="region">
          {notices.map((notice) => (
            <NoticeToast
              key={notice.id}
              closeLabel={closeLabel}
              notice={notice}
              onDismiss={() => dismiss(notice.id)}
            />
          ))}
        </aside>
      ) : null}
    </NoticeToastContext.Provider>
  )
}

export function useNoticeToast(): NoticeToastContextValue {
  const context = useContext(NoticeToastContext)
  if (!context) throw new Error("useNoticeToast must be used within NoticeToastProvider")
  return context
}
