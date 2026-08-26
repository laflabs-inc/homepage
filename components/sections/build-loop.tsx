"use client"

import { useRef } from "react"
import { motion, type MotionValue, useReducedMotion, useScroll, useTransform } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { copy } from "@/lib/content"

function BuildStep({
  body,
  index,
  progress,
  reduced,
  title,
}: {
  body: string
  index: number
  progress: MotionValue<number>
  reduced: boolean | null
  title: string
}) {
  const start = index * 0.2
  const opacity = useTransform(progress, [start, start + 0.18], [0.24, 1])
  const x = useTransform(progress, [start, start + 0.18], [64, 0])

  return (
    <motion.li style={reduced ? undefined : { opacity, x }}>
      <span className="build-loop-index mono">{String(index + 1).padStart(2, "0")}</span>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </motion.li>
  )
}

export function BuildLoop() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const section = useRef<HTMLElement>(null)
  const t = copy[locale].buildLoop
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", "end end"],
  })
  const markerY = useTransform(scrollYProgress, [0, 1], [0, 244])

  return (
    <section className="build-loop" ref={section} aria-labelledby="build-loop-title">
      <div className="build-loop-sticky">
        <div className="build-loop-intro">
          <h2 id="build-loop-title">{t.title}</h2>
          <p>{t.lede}</p>
          <div className="build-loop-rail" aria-hidden="true">
            <motion.span className="build-loop-progress" style={reduced ? undefined : { scaleY: scrollYProgress }} />
            <motion.i style={reduced ? undefined : { y: markerY }} />
          </div>
        </div>

        <ol className="build-loop-steps">
          {t.steps.map((step, index) => (
            <BuildStep
              key={step.title}
              {...step}
              index={index}
              progress={scrollYProgress}
              reduced={reduced}
            />
          ))}
        </ol>
      </div>
    </section>
  )
}
