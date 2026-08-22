import {
  AnalyticsEventInputSchema,
  type AnalyticsEventType,
  type AnalyticsLocale,
} from "@/lib/analytics/normalize"

const ANALYTICS_ENDPOINT = "/api/analytics/events"
const SESSION_STORAGE_KEY = "laf_analytics_session"
const MAX_QUEUE_SIZE = 20
const AUTO_FLUSH_SIZE = 5
const AUTO_FLUSH_DELAY_MS = 5_000
const RETRY_DELAY_MS = 1_000

export type AnalyticsClient = {
  track: (type: AnalyticsEventType, targetId: string | null) => void
  setLocale: (locale: AnalyticsLocale) => void
  flush: () => Promise<void>
  stop: () => void
  size: () => number
}

type AnalyticsClientOptions = {
  locale: AnalyticsLocale
  pathname: string
}

function sanitizedPathname(value: string): string {
  try {
    return new URL(value, "https://analytics.invalid").pathname || "/"
  } catch {
    return "/"
  }
}

function getSessionId(): string {
  try {
    const saved = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (saved && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved)) {
      return saved
    }
  } catch {
    // A blocked storage API still permits an ephemeral, per-client identifier.
  }

  const sessionId = crypto.randomUUID()
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId)
  } catch {
    // Storage may be unavailable in hardened browser contexts.
  }
  return sessionId
}

export function createAnalyticsClient({
  locale: initialLocale,
  pathname,
}: AnalyticsClientOptions): AnalyticsClient {
  const sessionId = getSessionId()
  const eventPathname = sanitizedPathname(pathname)
  const queue: Array<ReturnType<typeof AnalyticsEventInputSchema.parse>> = []
  const fetchControllers = new Set<AbortController>()
  let locale = initialLocale
  let stopped = false
  let pageViewQueued = false
  let flushTimer: ReturnType<typeof setTimeout> | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let resolveRetryWait: ((active: boolean) => void) | null = null
  let activeFlush: Promise<void> | null = null

  const clearFlushTimer = () => {
    if (flushTimer === null) return
    clearTimeout(flushTimer)
    flushTimer = null
  }

  const pageIsActive = () => !stopped && document.visibilityState !== "hidden"

  const scheduleFlush = () => {
    if (stopped || queue.length === 0 || flushTimer !== null) return
    flushTimer = setTimeout(() => {
      flushTimer = null
      void flush()
    }, AUTO_FLUSH_DELAY_MS)
  }

  const sendOnce = async (blob: Blob): Promise<boolean> => {
    if (stopped) return false

    try {
      if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ANALYTICS_ENDPOINT, blob)) {
        return true
      }
    } catch {
      // Fall through to a same-origin keepalive request.
    }

    if (stopped) return false
    const controller = new AbortController()
    fetchControllers.add(controller)
    try {
      const response = await fetch(ANALYTICS_ENDPOINT, {
        method: "POST",
        body: blob,
        credentials: "same-origin",
        keepalive: true,
        signal: controller.signal,
      })
      return response.ok
    } catch {
      return false
    } finally {
      fetchControllers.delete(controller)
    }
  }

  const waitForRetry = (): Promise<boolean> => new Promise((resolve) => {
    resolveRetryWait = resolve
    retryTimer = setTimeout(() => {
      retryTimer = null
      resolveRetryWait = null
      resolve(pageIsActive())
    }, RETRY_DELAY_MS)
  })

  const sendBatch = async (events: typeof queue): Promise<void> => {
    const blob = new Blob([JSON.stringify({ events })], { type: "application/json" })
    if (await sendOnce(blob)) return
    if (!pageIsActive() || !await waitForRetry()) return
    await sendOnce(blob)
  }

  const flush = async (): Promise<void> => {
    if (stopped) return
    if (activeFlush) return activeFlush
    if (queue.length === 0) return

    clearFlushTimer()
    const batch = queue.splice(0, MAX_QUEUE_SIZE)
    const request = sendBatch(batch).catch(() => undefined).finally(() => {
      activeFlush = null
      if (stopped || queue.length === 0) return
      if (queue.length >= AUTO_FLUSH_SIZE) {
        void flush()
      } else {
        scheduleFlush()
      }
    })
    activeFlush = request
    return request
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") void flush()
  }
  document.addEventListener("visibilitychange", onVisibilityChange)

  return {
    track(type, targetId) {
      try {
        if (stopped || queue.length >= MAX_QUEUE_SIZE) return
        if (type === "page_view" && pageViewQueued) return

        const parsed = AnalyticsEventInputSchema.safeParse({
          eventId: crypto.randomUUID(),
          sessionId,
          type,
          pathname: eventPathname,
          targetId,
          locale,
          occurredAt: new Date().toISOString(),
        })
        if (!parsed.success) return

        queue.push(parsed.data)
        if (type === "page_view") pageViewQueued = true
        if (queue.length >= AUTO_FLUSH_SIZE) {
          void flush()
        } else {
          scheduleFlush()
        }
      } catch {
        // Analytics must never interrupt the interaction being measured.
      }
    },
    setLocale(nextLocale) {
      if (!stopped && (nextLocale === "ko" || nextLocale === "en")) locale = nextLocale
    },
    flush,
    stop() {
      if (stopped) return
      stopped = true
      queue.length = 0
      clearFlushTimer()
      if (retryTimer !== null) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      resolveRetryWait?.(false)
      resolveRetryWait = null
      for (const controller of fetchControllers) controller.abort()
      fetchControllers.clear()
      document.removeEventListener("visibilitychange", onVisibilityChange)
    },
    size: () => queue.length,
  }
}
