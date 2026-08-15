"use client"

import { motion, useReducedMotion } from "motion/react"

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Scroll-triggered entrance. Fires once, stays put, and collapses to a
 * plain fade when the visitor asks for reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  as = "div",
}: {
  children: React.ReactNode
  delay?: number
  y?: number
  className?: string
  as?: "div" | "section" | "li" | "article" | "span"
}) {
  const reduced = useReducedMotion()
  const Tag = motion[as]

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reduced ? 0.2 : 0.6, delay: reduced ? 0 : delay, ease: EASE }}
    >
      {children}
    </Tag>
  )
}

/** Container that staggers its `Reveal`-less children on entry. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: React.ReactNode
  className?: string
  stagger?: number
}) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ visible: { transition: { staggerChildren: reduced ? 0 : stagger } } }}
    >
      {children}
    </motion.div>
  )
}

export const revealItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

export { EASE }
