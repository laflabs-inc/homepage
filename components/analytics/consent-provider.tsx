"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

import { useLocale } from "@/components/i18n/locale-provider"
import type { ConsentChoice, ConsentState } from "@/lib/analytics/types"
import { ConsentPanel } from "./consent-panel"

type ConsentContextValue = {
  state: ConsentState
  openSettings: () => void
  choose: (choice: ConsentChoice) => Promise<void>
  pending: boolean
  error: string | null
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

const errors = {
  ko: "설정을 저장하지 못했습니다. 다시 시도해 주세요.",
  en: "We couldn't save your preference. Please try again.",
} as const

export function ConsentProvider({
  children,
  initialState,
  dnt,
}: {
  children: React.ReactNode
  initialState: ConsentState
  dnt: boolean
}) {
  const locale = useLocale()
  const [state, setState] = useState<ConsentState>(initialState)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openSettings = useCallback(() => {
    setError(null)
    setSettingsOpen(true)
  }, [])

  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  const choose = useCallback(async (choice: ConsentChoice) => {
    setPending(true)
    setError(null)

    try {
      const response = await fetch("/api/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ choice }),
      })
      if (!response.ok) throw new Error("Consent request failed")

      const result = await response.json() as { choice: ConsentChoice }
      setState(result.choice)
      setSettingsOpen(false)
    } catch {
      setError(errors[locale])
    } finally {
      setPending(false)
    }
  }, [locale])

  const value = useMemo(() => ({
    state,
    openSettings,
    choose,
    pending,
    error,
  }), [state, openSettings, choose, pending, error])

  return (
    <ConsentContext.Provider value={value}>
      {children}
      <ConsentPanel
        locale={locale}
        open={state === "unknown" || settingsOpen}
        pending={pending}
        error={error}
        dnt={dnt}
        onChoose={choose}
        onClose={state === "unknown" ? null : closeSettings}
      />
    </ConsentContext.Provider>
  )
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext)
  if (!context) throw new Error("useConsent must be used within ConsentProvider")
  return context
}
