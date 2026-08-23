"use client"

import { useEffect, useId } from "react"

export const DIRTY_NAVIGATION_MESSAGE = "You have unsaved document changes. Leave this page?"
const DIRTY_SENTINEL_KEY = "__laf_document_dirty_sentinel"

export function useDirtyNavigationGuard(dirty: boolean, discard: () => void): void {
  const sentinelId = useId()

  useEffect(() => {
    if (!dirty) return
    const guardedUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const state = typeof window.history.state === "object" && window.history.state !== null
      ? window.history.state as Record<string, unknown>
      : {}
    if (state[DIRTY_SENTINEL_KEY] !== sentinelId) {
      window.history.pushState({ ...state, [DIRTY_SENTINEL_KEY]: sentinelId }, "", guardedUrl)
    }
    let suppressNextPop = false

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented
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

      if (window.confirm(DIRTY_NAVIGATION_MESSAGE)) {
        discard()
        return
      }
      event.preventDefault()
      event.stopImmediatePropagation()
    }

    const popState = () => {
      if (suppressNextPop) {
        suppressNextPop = false
        return
      }
      if (window.confirm(DIRTY_NAVIGATION_MESSAGE)) {
        discard()
        suppressNextPop = true
        window.history.back()
        return
      }
      suppressNextPop = true
      window.history.forward()
    }

    window.addEventListener("beforeunload", beforeUnload)
    window.addEventListener("popstate", popState)
    document.addEventListener("click", click, true)
    return () => {
      window.removeEventListener("beforeunload", beforeUnload)
      window.removeEventListener("popstate", popState)
      document.removeEventListener("click", click, true)
    }
  }, [dirty, discard, sentinelId])
}
