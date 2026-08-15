"use client"

import { useRef } from "react"
import { ArrowDown, ArrowRight } from "@phosphor-icons/react/dist/ssr"
import { motion, type MotionValue, useReducedMotion, useScroll, useTransform } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { GithubGlyph } from "@/components/layout/site-header"
import { EASE } from "@/components/ui/reveal"
import { copy, githubOrg, motto, products } from "@/lib/content"

const LAYER_OFFSETS = [-26, 0, 26]

function LayerPlane({
  progress,
  index,
  layer,
  productName,
}: {
  progress: MotionValue<number>
  index: number
  layer: string
  productName: string
}) {
  const reduced = useReducedMotion()
  const x = useTransform(progress, [0, 0.6], [0, reduced ? 0 : LAYER_OFFSETS[index]])

  return (
    <motion.div
      className="layer-plane"
      data-tone={index === 0 ? "brand" : undefined}
      style={{ x }}
      initial={{ opacity: 0, y: reduced ? 0 : 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay: 0.34 + index * 0.09, ease: EASE }}
    >
      <div className="layer-left">
        <span className="layer-index">L{index + 1}</span>
        <span className="layer-name">{layer}</span>
      </div>
      <span className="layer-meta">{productName}</span>
    </motion.div>
  )
}

/**
 * Three slabs standing in for the three layers of infrastructure. They
 * sit flush at rest and drift apart as the hero scrolls away — the
 * stack coming apart so you can see inside it.
 */
function LayerStack() {
  const locale = useLocale()
  const ref = useRef<HTMLDivElement>(null)
  const t = copy[locale].products

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })

  return (
    <div className="layer-stack" ref={ref}>
      {products.map((product, index) => (
        <LayerPlane
          key={product.id}
          progress={scrollYProgress}
          index={index}
          layer={t[product.id].layer}
          productName={product.name}
        />
      ))}
    </div>
  )
}

export function Hero() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const t = copy[locale].hero

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 26 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: EASE },
  })

  return (
    <section className="hero" id="top">
      <div className="grid-lines" />

      <div className="hero-inner">
        <motion.div className="hero-overline" {...rise(0)}>
          <i />
          {t.overline}
        </motion.div>

        <h1>
          <motion.span className="hero-quiet" {...rise(0.08)}>
            {t.titleQuiet}
          </motion.span>
          <motion.span className="hero-loud" {...rise(0.16)}>
            {t.titleLoud}
            <b>.</b>
          </motion.span>
        </h1>

        <motion.div className="hero-body" {...rise(0.24)}>
          <div>
            <p className="lede">{t.lede}</p>
            <p className="hero-motto">
              <b>◆</b> {motto}
            </p>
          </div>

          <div className="hero-ctas">
            <a href="#products" className="btn btn-primary">
              {t.primary}
              <ArrowRight size={15} weight="bold" />
            </a>
            <a href={githubOrg} target="_blank" rel="noreferrer noopener" className="btn btn-outline">
              <GithubGlyph size={15} />
              {t.secondary}
            </a>
          </div>
        </motion.div>

        <LayerStack />

        <motion.div
          className="hero-scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <motion.span
            animate={reduced ? undefined : { y: [0, 5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ display: "inline-flex" }}
          >
            <ArrowDown size={12} weight="bold" />
          </motion.span>
          {t.scroll}
        </motion.div>
      </div>
    </section>
  )
}
