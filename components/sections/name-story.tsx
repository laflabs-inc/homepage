"use client"

import { motion, useReducedMotion } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { EASE, Reveal } from "@/components/ui/reveal"
import { copy } from "@/lib/content"

/** The one block on the page allowed to have a sense of humour about itself. */
export function NameStory() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const t = copy[locale].name

  const term = {
    hidden: { opacity: 0, y: reduced ? 0 : 24 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 240, damping: 22 } },
  }

  return (
    <section className="name-section section-alt">
      <div className="grid-lines" />

      <div className="name-inner">
        <Reveal>
          <span className="eyebrow">{t.eyebrow}</span>
        </Reveal>

        <motion.div
          className="name-equation"
          style={{ marginTop: 28 }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ visible: { transition: { staggerChildren: reduced ? 0 : 0.12 } } }}
        >
          <motion.span className="name-term" variants={term}>
            <motion.span
              className="name-laf"
              whileHover={reduced ? undefined : { rotate: -3, scale: 1.04 }}
              transition={{ type: "spring", stiffness: 320, damping: 12 }}
              style={{ display: "inline-block", cursor: "default" }}
            >
              Laf
            </motion.span>
            <small>{t.laf}</small>
          </motion.span>

          <motion.i variants={term}>+</motion.i>

          <motion.span className="name-term" variants={term}>
            <span className="name-labs">Labs</span>
            <small>{t.labs}</small>
          </motion.span>

          <motion.i variants={term}>=</motion.i>

          <motion.span className="name-term" variants={term}>
            <span>LafLabs</span>
            <small>Build quietly. Work reliably.</small>
          </motion.span>
        </motion.div>

        <motion.p
          className="name-note"
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
        >
          {t.note}
        </motion.p>
      </div>
    </section>
  )
}
