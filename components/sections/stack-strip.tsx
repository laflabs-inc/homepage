"use client"

import { motion, useReducedMotion } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { copy, stack } from "@/lib/content"

/** Two identical tracks scrolling as one, with only the duplicate hidden from assistive tech. */
export function StackStrip() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const t = copy[locale]

  const track = (duplicate = false) => (
    <ul className="strip-track" aria-hidden={duplicate || undefined}>
      {stack.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )

  return (
    <section className="strip" aria-label={t.stripLabel}>
      <div className="strip-label">{t.stripLabel}</div>

      <div className="strip-viewport">
        <motion.div
          style={{ display: "flex", gap: 52, width: "max-content" }}
          initial={false}
          animate={reduced ? { x: "0%" } : { x: ["0%", "-50%"] }}
          transition={{ duration: reduced ? 0 : 42, ease: "linear", repeat: reduced ? 0 : Infinity }}
        >
          {track()}
          {track(true)}
        </motion.div>
      </div>
    </section>
  )
}
