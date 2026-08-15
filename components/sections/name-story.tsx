"use client"

import { motion, useReducedMotion } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { EASE, Reveal } from "@/components/ui/reveal"
import { copy, motto } from "@/lib/content"

/** The one block on the page allowed to have a sense of humour about itself. */
export function NameStory() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const t = copy[locale].name

  const term = {
    hidden: { opacity: 0, y: reduced ? 0 : 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 210, damping: 24 } },
  }

  return (
    <section className="name-section">
      <div className="grid-lines" style={{ opacity: 0.5 }} />

      <div className="name-inner">
        <Reveal>
          <div className="label">
            <span>{t.eyebrow}</span>
            <b>◆</b>
          </div>
        </Reveal>

        <motion.div
          className="name-equation"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-90px" }}
          variants={{ visible: { transition: { staggerChildren: reduced ? 0 : 0.13 } } }}
        >
          <motion.span className="name-term" variants={term}>
            <motion.span
              className="name-laf"
              whileHover={reduced ? undefined : { rotate: -4, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
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
            <small>{motto}</small>
          </motion.span>
        </motion.div>

        <motion.p
          className="name-note"
          initial={{ opacity: 0, y: reduced ? 0 : 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, delay: 0.34, ease: EASE }}
        >
          {t.note}
        </motion.p>
      </div>
    </section>
  )
}
