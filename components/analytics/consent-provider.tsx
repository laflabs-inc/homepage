"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"

import { useLocale } from "@/components/i18n/locale-provider"
import { createAnalyticsClient, type AnalyticsClient } from "@/lib/analytics/client"
import type { AnalyticsEventType } from "@/lib/analytics/normalize"
import type { ConsentChoice, ConsentState } from "@/lib/analytics/types"
import { CONSENT_POLICY_VERSION } from "@/lib/analytics/consent"
import { reloadForConsentPolicyUpdate } from "@/lib/analytics/reload"
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
  const pathname = usePathname()
  const [state, setState] = useState<ConsentState>(initialState)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef<AnalyticsClient | null>(null)
  const previousStateRef = useRef<ConsentState>(initialState)
  const latestLocaleRef = useRef(locale)

  useEffect(() => {
    latestLocaleRef.current = locale
  }, [locale])

  useEffect(() => {
    const previousState = previousStateRef.current
    previousStateRef.current = state

    if (dnt || state !== "analytics" || pathname !== "/") {
      clientRef.current?.stop()
      clientRef.current = null
      return
    }

    if (clientRef.current) return

    let client: AnalyticsClient
    try {
      client = createAnalyticsClient({
        locale: latestLocaleRef.current,
        pathname,
      })
      clientRef.current = client
      if (previousState !== "analytics") client.track("consent_update", "analytics")
      client.track("page_view", null)
    } catch {
      clientRef.current = null
      return
    }

    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return
      const target = event.target.closest<HTMLElement>("[data-analytics-event]")
      const type = target?.dataset.analyticsEvent
      if (!target || !type) return
      client.track(
        type as AnalyticsEventType,
        target.dataset.analyticsTarget ?? null,
      )
    }
    document.addEventListener("click", onClick)

    return () => {
      document.removeEventListener("click", onClick)
      if (clientRef.current === client) {
        client.stop()
        clientRef.current = null
      }
    }
  }, [dnt, pathname, state])

  useEffect(() => {
    if (!dnt && state === "analytics") clientRef.current?.setLocale(locale)
  }, [dnt, locale, state])

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
        body: JSON.stringify({
          choice,
          policyVersion: CONSENT_POLICY_VERSION,
        }),
      })
      if (response.status === 409) {
        clientRef.current?.stop()
        clientRef.current = null
        setState("unknown")
        setSettingsOpen(true)
        reloadForConsentPolicyUpdate()
        return
      }
      if (!response.ok) throw new Error("Consent request failed")

      const result = await response.json() as { choice: ConsentChoice }
      if (result.choice !== "analytics") {
        clientRef.current?.stop()
        clientRef.current = null
      }
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
