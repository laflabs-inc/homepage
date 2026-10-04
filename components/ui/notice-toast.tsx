"use client"

import { useMemo } from "react"

import {
  ToastProvider,
  useToast,
  type ToastProviderProps,
  type ToastTone,
} from "./toast"

/** @deprecated Use ToastTone and useToast instead. */
export type NoticeToastVariant = Exclude<ToastTone, "neutral">

/** @deprecated Use ToastOptions instead. */
export type NoticeToastInput = Readonly<{
  description?: string
  duration?: number
  title: string
  variant?: NoticeToastVariant
}>

/** @deprecated Use ToastProviderProps instead. */
export type NoticeToastProviderProps = ToastProviderProps

/** @deprecated Use ToastProvider instead. */
export const NoticeToastProvider = ToastProvider

/** @deprecated Use useToast instead. */
export function useNoticeToast() {
  const toast = useToast()
  return useMemo(() => ({
    dismiss: (id: string) => toast.dismiss(id),
    notify: (notice: NoticeToastInput) => toast.show({
      description: notice.description,
      duration: notice.duration,
      title: notice.title,
      tone: notice.variant ?? "info",
    }),
  }), [toast])
}
