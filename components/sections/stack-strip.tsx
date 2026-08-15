"use client"

import { motion, useReducedMotion } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { copy, stack } from "@/lib/content"

/** Two identical tracks scrolling as one, so the loop has no seam. */
export function StackStrip() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const t = copy[locale]

  const track = (
    <div className="strip-track" aria-hidden="true">
      {stack.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  )

  return (
    <section className="strip" aria-label={t.stripLabel}>
      <div className="strip-label">{t.stripLabel}</div>

      <div className="strip-viewport">
        <motion.div
          style={{ display: "flex", gap: 52, width: "max-content" }}
          animate={reduced ? undefined : { x: ["0%", "-50%"] }}
          transition={{ duration: 42, ease: "linear", repeat: Infinity }}
        >
          {track}
          {track}
        </motion.div>
      </div>
    </section>
  )
}
