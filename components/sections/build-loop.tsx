"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { copy } from "@/lib/content"
import styles from "./build-loop.module.css"

const sceneIds = ["product", "foundation", "operations", "system"] as const

type SceneId = (typeof sceneIds)[number]

function BuildStep({
  active,
  body,
  caption,
  index,
  scene,
  title,
}: {
  active: boolean
  body: string
  caption: string
  index: number
  scene: SceneId
  title: string
}) {
  return (
    <motion.li
      animate={{
        clipPath: active ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 0% 7%)",
        opacity: active ? 1 : 0,
        x: active ? 0 : index === 0 ? -24 : 48,
      }}
      aria-current={active ? "step" : undefined}
      data-scene={scene}
      data-scene-index={index}
      initial={false}
      transition={{ duration: 0.46, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.sceneCopy}>
        <span className={`${styles.index} mono`}>{String(index + 1).padStart(2, "0")}</span>
        <div>
          <h3>{title}</h3>
          <p>{body}</p>
        </div>
      </div>

      <figure
        className={styles.visual}
        data-scene={scene}
        data-testid="build-loop-visual"
      >
        <div className={styles.visualFrame}>
          <Image
            alt=""
            fill
            sizes="(max-width: 900px) calc(100vw - 36px), (max-width: 1200px) 58vw, 760px"
            src={`/images/build-loop/${scene}.webp`}
          />
        </div>
        <figcaption>{caption}</figcaption>
      </figure>
    </motion.li>
  )
}

export function BuildLoop() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const section = useRef<HTMLElement>(null)
  const t = copy[locale].buildLoop
  const titleLines = locale === "ko"
    ? ["제품에서 시작해", "시스템으로", "남깁니다."]
    : ["Products first.", "Systems follow."]
  const [activeScene, setActiveScene] = useState<SceneId>("product")
  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", "end end"],
  })
  const markerY = useTransform(scrollYProgress, [0, 1], [0, 244])

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
          <h2 id="build-loop-title" aria-label={t.title}>
            {titleLines.map((line) => <span key={line}>{line}</span>)}
          </h2>
          <p>{t.lede}</p>
          <div className={styles.rail} aria-hidden="true">
            <motion.span className={styles.progress} style={{ scaleX: scrollYProgress, scaleY: scrollYProgress }} />
            <motion.i style={{ y: markerY }} />
          </div>
        </div>

        <div className={styles.story}>
          <ol className={styles.steps}>
            {t.steps.map((step, index) => (
              <BuildStep
                active={activeScene === sceneIds[index]}
                key={sceneIds[index]}
                {...step}
                index={index}
                scene={sceneIds[index]}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
