"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useId, useRef } from "react"

export const DIRTY_NAVIGATION_MESSAGE = "You have unsaved document changes. Leave this page?"
const DIRTY_SENTINEL_KEY = "__laf_document_dirty_sentinel"

type PendingRetirement = {
  promise: Promise<void>
  resolve: () => void
}

export function useDirtyNavigationGuard(dirty: boolean, discard: () => void): () => Promise<void> {
  const router = useRouter()
  const sentinelId = useId()
  const dirtyRef = useRef(dirty)
  const discardRef = useRef(discard)
  const sentinelActiveRef = useRef(false)
  const suppressedPopRef = useRef<"restore" | "replay" | "retire" | null>(null)
  const pendingRetirementRef = useRef<PendingRetirement | null>(null)

  useEffect(() => {
    dirtyRef.current = dirty
    discardRef.current = discard
  }, [dirty, discard])

  const retireSentinel = useCallback((): Promise<void> => {
    if (!sentinelActiveRef.current) return Promise.resolve()
    if (pendingRetirementRef.current) return pendingRetirementRef.current.promise
    const state = typeof window.history.state === "object" && window.history.state !== null
      ? window.history.state as Record<string, unknown>
      : {}
    if (state[DIRTY_SENTINEL_KEY] !== sentinelId) {
      sentinelActiveRef.current = false
      return Promise.resolve()
    }

    let resolveRetirement!: () => void
    const promise = new Promise<void>((resolve) => {
      resolveRetirement = resolve
    })
    pendingRetirementRef.current = { promise, resolve: resolveRetirement }
    suppressedPopRef.current = "retire"
    window.history.back()
    return promise
  }, [sentinelId])

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      event.preventDefault()
      event.returnValue = ""
    }

    const click = (event: MouseEvent) => {
      if (
        !dirtyRef.current
        || event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) return

      const target = event.target
      const anchor = target instanceof Element ? target.closest("a[href]") : null
      if (!(anchor instanceof HTMLAnchorElement) || anchor.download || (anchor.target && anchor.target !== "_self")) {
        return
      }

      const destination = new URL(anchor.href, window.location.href)
      if (destination.origin !== window.location.origin) return
      if (
        destination.pathname === window.location.pathname
        && destination.search === window.location.search
      ) return

      event.preventDefault()
      event.stopImmediatePropagation()
      if (!window.confirm(DIRTY_NAVIGATION_MESSAGE)) return

      const retirement = retireSentinel()
      discardRef.current()
      void retirement.then(() => {
        router.push(`${destination.pathname}${destination.search}${destination.hash}`)
      })
    }

    const popState = () => {
      const suppressedPop = suppressedPopRef.current
      if (suppressedPop) {
        suppressedPopRef.current = null
        if (suppressedPop === "retire") {
          sentinelActiveRef.current = false
          const retirement = pendingRetirementRef.current
          pendingRetirementRef.current = null
          retirement?.resolve()
        }
        return
      }
      if (!dirtyRef.current) return
      if (window.confirm(DIRTY_NAVIGATION_MESSAGE)) {
        sentinelActiveRef.current = false
        discardRef.current()
        suppressedPopRef.current = "replay"
        window.history.back()
        return
      }
      suppressedPopRef.current = "restore"
      window.history.forward()
    }

    window.addEventListener("beforeunload", beforeUnload)
    window.addEventListener("popstate", popState)
    document.addEventListener("click", click, true)
    return () => {
      window.removeEventListener("beforeunload", beforeUnload)
      window.removeEventListener("popstate", popState)
      document.removeEventListener("click", click, true)
      const retirement = pendingRetirementRef.current
      pendingRetirementRef.current = null
      retirement?.resolve()
    }
  }, [retireSentinel, router])

  useEffect(() => {
    if (!dirty) {
      void retireSentinel()
      return
    }
    const guardedUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const state = typeof window.history.state === "object" && window.history.state !== null
      ? window.history.state as Record<string, unknown>
      : {}
    if (state[DIRTY_SENTINEL_KEY] !== sentinelId) {
      window.history.pushState({ ...state, [DIRTY_SENTINEL_KEY]: sentinelId }, "", guardedUrl)
    }
    sentinelActiveRef.current = true
  }, [dirty, retireSentinel, sentinelId])

  return retireSentinel
}
