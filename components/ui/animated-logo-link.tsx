"use client"

import { useCallback, useEffect, useRef, useState, type AnimationEvent } from "react"

import { Logo } from "@/components/ui/logo"

const LOGO_MOTION_SESSION_KEY = "laflabs:logo-motion:v1"
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

type LogoMotionState = "idle" | "intro" | "replay"

function prefersReducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION_QUERY).matches
}

export function AnimatedLogoLink({ href }: { href: string }) {
  const [motion, setMotion] = useState<LogoMotionState>("idle")
  const motionRef = useRef<LogoMotionState>("idle")
  const reducedMotionRef = useRef(false)
  const introCheckedRef = useRef(false)
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const finishMotion = useCallback(() => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current)
    finishTimerRef.current = null
    motionRef.current = "idle"
    setMotion("idle")
  }, [])

  const play = useCallback((nextMotion: Exclude<LogoMotionState, "idle">) => {
    if (prefersReducedMotion()) {
      reducedMotionRef.current = true
      return
    }
    if (reducedMotionRef.current || motionRef.current !== "idle") return

    motionRef.current = nextMotion
    setMotion(nextMotion)
    finishTimerRef.current = setTimeout(finishMotion, nextMotion === "intro" ? 700 : 440)
  }, [finishMotion])

  useEffect(() => {
    if (introCheckedRef.current) return
    introCheckedRef.current = true

    reducedMotionRef.current = prefersReducedMotion()
    if (reducedMotionRef.current) return

    try {
      if (window.sessionStorage.getItem(LOGO_MOTION_SESSION_KEY)) return
      window.sessionStorage.setItem(LOGO_MOTION_SESSION_KEY, "played")
    } catch {
      return
    }

    play("intro")
  }, [play])

  useEffect(() => () => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current)
  }, [])

  const handleAnimationEnd = (event: AnimationEvent<HTMLAnchorElement>) => {
    if (event.animationName && event.animationName !== "laf-logo-labs-reveal") return
    finishMotion()
  }

  return (
    <a
      href={href}
      aria-label="LafLabs"
      className="laf-logo-motion"
      data-logo-motion={motion}
      onAnimationEnd={handleAnimationEnd}
      onFocus={() => play("replay")}
      onMouseEnter={() => play("replay")}
    >
      <Logo />
    </a>
  )
}
