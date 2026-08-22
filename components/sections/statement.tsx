"use client"

import { useRef } from "react"
import { motion, type MotionValue, useReducedMotion, useScroll, useTransform } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { Reveal } from "@/components/ui/reveal"
import { copy } from "@/lib/content"

function Word({
  word,
  index,
  total,
  progress,
}: {
  word: string
  index: number
  total: number
  progress: MotionValue<number>
}) {
  // Each word owns an overlapping slice of the scroll range, so the
  // sentence resolves as a wave rather than one word at a time — and it
  // finishes well before the section leaves the viewport. The floor stays
  // legible so the copy never reads as broken or missing.
  const start = (index / total) * 0.7
  const opacity = useTransform(progress, [start, start + 0.3], [0.36, 1])

  return (
    <motion.span style={{ opacity }}>
      {word}
    </motion.span>
  )
}

/** One oversized sentence that fills in as you scroll past it. */
export function Statement() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const ref = useRef<HTMLParagraphElement>(null)
  const t = copy[locale].statement

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.55"] })

  return (
    <section className="statement">
      <div className="statement-inner">
        <Reveal>
          <div className="label">
            <span>{t.eyebrow}</span>
            <b>◆</b>
          </div>
        </Reveal>

        <p className="statement-copy" ref={ref}>
          {t.words.map((word, index) =>
            reduced ? (
              <span key={`${word}-${index}`}>{word}</span>
            ) : (
              <Word
                key={`${word}-${index}`}
                word={word}
                index={index}
                total={t.words.length}
                progress={scrollYProgress}
              />
            ),
          )}
        </p>

        <Reveal delay={0.1}>
          <p className="statement-foot">{t.footnote}</p>
        </Reveal>
      </div>
    </section>
  )
}
