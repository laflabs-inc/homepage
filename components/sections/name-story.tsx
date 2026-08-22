"use client"

import { motion, useReducedMotion } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { EASE } from "@/components/ui/reveal"
import { copy, motto } from "@/lib/content"

/** The one block on the page allowed to have a sense of humour about itself. */
export function NameStory() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const t = copy[locale].name

  const term = {
    hidden: reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduced
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 210, damping: 24 },
    },
  }

  return (
    <section className="name-section">
      <div className="name-inner">
        <motion.h2
          className="name-equation"
          initial={reduced ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-90px" }}
          variants={{ visible: { transition: { staggerChildren: reduced ? 0 : 0.13 } } }}
        >
          <motion.span className="name-term" variants={term}>
            <motion.span
              className="name-laf"
              whileHover={reduced ? undefined : { rotate: -4, scale: 1.05 }}
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 10 }}
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
        </motion.h2>

        <motion.p
          className="name-note"
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: reduced ? 0 : 0.65, delay: reduced ? 0 : 0.34, ease: EASE }}
        >
          {t.note}
        </motion.p>
      </div>
    </section>
  )
}
