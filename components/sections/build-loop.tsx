"use client"

import { useRef } from "react"
import { motion, type MotionValue, useReducedMotion, useScroll, useTransform } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { copy } from "@/lib/content"
import styles from "./build-loop.module.css"

const sceneIds = ["product", "foundation", "operations", "system"] as const

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
  const start = 0.08 + index * 0.18
  const opacity = useTransform(progress, [start, start + 0.22], [0.22, 1])
  const x = useTransform(progress, [start, start + 0.22], [72, 0])

  return (
    <motion.li style={reduced ? undefined : { opacity, x }}>
      <span className={`${styles.index} mono`}>{String(index + 1).padStart(2, "0")}</span>
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
    offset: ["start 0.85", "end 0.2"],
  })
  const introOpacity = useTransform(scrollYProgress, [0, 0.12], [0.24, 1])
  const introX = useTransform(scrollYProgress, [0, 0.12], [84, 0])
  const markerY = useTransform(scrollYProgress, [0.08, 0.9], [0, 244])

  return (
    <section
      className={styles.buildLoop}
      ref={section}
      aria-labelledby="build-loop-title"
      data-motion-sequence="build-loop"
      data-scene-count={sceneIds.length}
    >
      <div className={styles.sticky}>
        <motion.div
          className={styles.intro}
          style={reduced ? undefined : { opacity: introOpacity, x: introX }}
        >
          <h2 id="build-loop-title">{t.title}</h2>
          <p>{t.lede}</p>
          <div className={styles.rail} aria-hidden="true">
            <motion.span className={styles.progress} style={reduced ? undefined : { scaleY: scrollYProgress }} />
            <motion.i style={reduced ? undefined : { y: markerY }} />
          </div>
        </motion.div>

        <div className={styles.story}>
        <ol className={styles.steps}>
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
        <div className={styles.stage} data-testid="build-loop-stage" aria-hidden="true">
          <div className={styles.stageFrame}>
            {sceneIds.map((scene) => (
              <span
                className={styles.node}
                data-scene={scene}
                data-testid="build-loop-node"
                key={scene}
              />
            ))}
            <span className={`${styles.stageMark} mono`}>LAF</span>
          </div>
        </div>
        </div>
      </div>
    </section>
  )
}
