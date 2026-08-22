"use client"

import { ArrowRight } from "@phosphor-icons/react/dist/ssr"
import { motion } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { GithubGlyph } from "@/components/layout/site-header"
import { EASE } from "@/components/ui/reveal"
import { copy, githubOrg, products } from "@/lib/content"

const routes = [
  "M40 260H340L500 100H680",
  "M40 260H680",
  "M40 260H340L500 420H680",
] as const

const routeY = [100, 260, 420] as const

export function Hero() {
  const locale = useLocale()
  const t = copy[locale].hero
  const productCopy = copy[locale].products

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  })

  return (
    <section className="hero" id="top">
      <div className="hero-inner">
        <div className="hero-copy">
          <h1>
            <motion.span {...rise(0)}>{t.titleQuiet}</motion.span>
            <motion.span {...rise(0.08)}>{t.titleLoud}</motion.span>
          </h1>

          <motion.p className="lede" {...rise(0.16)}>
            {t.lede}
          </motion.p>

          <motion.div className="hero-ctas" {...rise(0.24)}>
            <a href="#products" className="btn btn-primary">
              {t.primary}
              <ArrowRight size={15} weight="bold" />
            </a>
            <a href={githubOrg} target="_blank" rel="noreferrer noopener" className="btn btn-outline">
              <GithubGlyph size={15} />
              {t.secondary}
            </a>
          </motion.div>
        </div>

        <div className="hero-routing-plane" aria-label={t.primary}>
          <svg className="routing-lines" viewBox="0 0 720 520" aria-hidden="true">
            {routes.map((d, index) => (
              <motion.path
                key={d}
                className="routing-line"
                pathLength="1"
                d={d}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.34 + index * 0.08, ease: EASE }}
              />
            ))}
            <rect className="routing-origin" x="31" y="251" width="18" height="18" />
            {routeY.map((y) => (
              <rect key={y} className="routing-endpoint" x="671" y={y - 9} width="18" height="18" />
            ))}
          </svg>

          <div className="routing-items">
            {products.map((product, index) => {
              const content = (
                <>
                  <span className="routing-product-name">{product.name}</span>
                  {!product.href && <span className="routing-availability">{productCopy.soon}</span>}
                  <span className="routing-layer">{productCopy[product.id].layer}</span>
                </>
              )

              const motionProps = rise(0.48 + index * 0.08)

              return product.href ? (
                <motion.a
                  key={product.id}
                  href={product.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="routing-item"
                  data-route={index + 1}
                  {...motionProps}
                >
                  {content}
                </motion.a>
              ) : (
                <motion.div
                  key={product.id}
                  className="routing-item"
                  data-route={index + 1}
                  aria-disabled="true"
                  {...motionProps}
                >
                  {content}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
