"use client"

import { useEffect, useRef, useState } from "react"
import {
  motion,
  type MotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { copy } from "@/lib/content"
import styles from "./build-loop.module.css"

const sceneIds = ["product", "foundation", "operations", "system"] as const
const sceneWindows = [
  [0, 0.2],
  [0.28, 0.45],
  [0.53, 0.7],
  [0.78, 1],
] as const

type SceneId = (typeof sceneIds)[number]

function BuildStep({
  body,
  index,
  progress,
  scene,
  title,
}: {
  body: string
  index: number
  progress: MotionValue<number>
  scene: SceneId
  title: string
}) {
  const [entry, exit] = sceneWindows[index]
  const input = index === 0
    ? [0, exit, exit + 0.06]
    : index === sceneIds.length - 1
      ? [entry - 0.08, entry, 1]
      : [entry - 0.08, entry, exit, exit + 0.06]
  const opacity = useTransform(
    progress,
    input,
    index === 0 ? [1, 1, 0] : index === sceneIds.length - 1 ? [0, 1, 1] : [0, 1, 1, 0],
  )
  const x = useTransform(
    progress,
    input,
    index === 0 ? [0, 0, -24] : index === sceneIds.length - 1 ? [48, 0, 0] : [48, 0, 0, -24],
  )

  return (
    <motion.li
      data-scene={scene}
      data-scene-index={index}
      style={{ opacity, x }}
    >
      <span className={`${styles.index} mono`}>{String(index + 1).padStart(2, "0")}</span>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </motion.li>
  )
}

function TopologyNode({
  index,
  progress,
  scene,
}: {
  index: number
  progress: MotionValue<number>
  scene: SceneId
}) {
  const entry = sceneWindows[index][0]
  const opacity = useTransform(
    progress,
    index === 0 ? [0, 0.01] : [entry - 0.08, entry],
    index === 0 ? [1, 1] : [0, 1],
  )
  const scale = useTransform(progress, index === 0 ? [0, 0.01] : [entry - 0.08, entry], [0.72, 1])

  return (
    <motion.span
      className={styles.node}
      data-scene={scene}
      data-testid="build-loop-node"
      style={{ opacity, scale }}
    />
  )
}

export function BuildLoop() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const section = useRef<HTMLElement>(null)
  const t = copy[locale].buildLoop
  const [activeScene, setActiveScene] = useState<SceneId>("product")
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", "end end"],
  })
  const markerY = useTransform(scrollYProgress, [0, 1], [0, 244])
  const connectorOne = useTransform(scrollYProgress, [0.2, 0.28], [0, 1])
  const connectorTwo = useTransform(scrollYProgress, [0.45, 0.53], [0, 1])
  const connectorThree = useTransform(scrollYProgress, [0.7, 0.78], [0, 1])
  const markOpacity = useTransform(scrollYProgress, [0.7, 0.78], [0, 1])

  useEffect(() => {
    if (reduced) setActiveScene("system")
  }, [reduced])

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (reduced) {
      setActiveScene("system")
      return
    }
    const next = value >= 0.74
      ? "system"
      : value >= 0.49
        ? "operations"
        : value >= 0.24
          ? "foundation"
          : "product"
    setActiveScene((current) => current === next ? current : next)
  })

  return (
    <section
      className={styles.buildLoop}
      ref={section}
      aria-labelledby="build-loop-title"
      data-active-scene={activeScene}
      data-motion-sequence="build-loop"
      data-scene-count={sceneIds.length}
    >
      <div className={styles.sticky} data-testid="build-loop-sticky">
        <div className={styles.intro}>
          <h2 id="build-loop-title">{t.title}</h2>
          <p>{t.lede}</p>
          <div className={styles.rail} aria-hidden="true">
            <motion.span className={styles.progress} style={{ scaleY: scrollYProgress }} />
            <motion.i style={{ y: markerY }} />
          </div>
        </div>

        <div className={styles.story}>
          <ol className={styles.steps}>
            {t.steps.map((step, index) => (
              <BuildStep
                key={sceneIds[index]}
                {...step}
                index={index}
                progress={scrollYProgress}
                scene={sceneIds[index]}
              />
            ))}
          </ol>

          <div
            className={styles.stage}
            data-stage-layout="sticky"
            data-testid="build-loop-stage"
            aria-hidden="true"
          >
            <div className={styles.stageFrame}>
              <motion.span className={`${styles.connector} ${styles.connectorOne}`} style={{ scaleX: connectorOne }} />
              <motion.span className={`${styles.connector} ${styles.connectorTwo}`} style={{ scaleY: connectorTwo }} />
              <motion.span className={`${styles.connector} ${styles.connectorThree}`} style={{ scaleX: connectorThree }} />
              {sceneIds.map((scene, index) => (
                <TopologyNode
                  index={index}
                  key={scene}
                  progress={scrollYProgress}
                  scene={scene}
                />
              ))}
              <motion.span
                className={`${styles.stageMark} mono`}
                style={{ opacity: markOpacity }}
              >LAF</motion.span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
