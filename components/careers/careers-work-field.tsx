"use client"

import { motion, useReducedMotion } from "motion/react"

import styles from "./careers.module.css"

const EASE = [0.22, 1, 0.36, 1] as const

export function CareersWorkField({ label }: { label: string }) {
  const reducedMotion = useReducedMotion()
  const transition = (delay: number) => ({
    duration: reducedMotion ? 0 : 0.72,
    delay: reducedMotion ? 0 : delay,
    ease: EASE,
  })

  return (
    <div className={styles.workField} aria-label={label}>
      <motion.span
        className={`${styles.workWord} ${styles.build}`}
        initial={reducedMotion ? false : { opacity: 0.28, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={transition(0.05)}
      >
        BUILD
      </motion.span>
      <motion.span
        className={`${styles.workWord} ${styles.operate}`}
        initial={reducedMotion ? false : { opacity: 0.28, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={transition(0.22)}
      >
        OPERATE
      </motion.span>
      <motion.span
        className={`${styles.workWord} ${styles.share}`}
        initial={reducedMotion ? false : { opacity: 0.28, x: 24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={transition(0.39)}
      >
        SHARE
      </motion.span>
      <motion.i
        className={`${styles.route} ${styles.routeOne}`}
        initial={reducedMotion ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={transition(0.14)}
      />
      <motion.i
        className={`${styles.route} ${styles.routeTwo}`}
        initial={reducedMotion ? false : { scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={transition(0.31)}
      />
      <span className={`${styles.node} ${styles.nodeOne}`} />
      <span className={`${styles.node} ${styles.nodeTwo}`} />
    </div>
  )
}
