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
      <div className="strip-inner">
        <span className="strip-label">{t.stripLabel}</span>
        <div style={{ minWidth: 0, overflow: "hidden", maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 92%, transparent)" }}>
          <motion.div
            style={{ display: "flex", gap: 40, width: "max-content" }}
            animate={reduced ? undefined : { x: ["0%", "-50%"] }}
            transition={{ duration: 34, ease: "linear", repeat: Infinity }}
          >
            {track}
            {track}
          </motion.div>
        </div>
      </div>
      <span className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {stack.join(", ")}
      </span>
    </section>
  )
}
