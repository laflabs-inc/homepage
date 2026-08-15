"use client"

import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr"
import { motion } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { Reveal, RevealGroup, revealItem } from "@/components/ui/reveal"
import { copy, products } from "@/lib/content"

export function Products() {
  const locale = useLocale()
  const t = copy[locale].products

  return (
    <section className="section" id="products">
      <div className="shell">
        <Reveal>
          <div className="label">
            <span>{t.eyebrow}</span>
            <span>03</span>
          </div>
        </Reveal>

        <Reveal delay={0.06} className="section-head">
          <h2 className="display section-head-title">
            {t.title[0]}
            <br />
            {t.title[1]}
          </h2>
          <p className="lede">{t.lede}</p>
        </Reveal>

        <RevealGroup className="product-list" stagger={0.1}>
          {products.map((product, index) => {
            const c = t[product.id]

            return (
              <motion.article key={product.id} className="product-row" variants={revealItem}>
                <span className="product-ghost" aria-hidden="true">
                  {product.name}
                </span>

                <div className="product-index">
                  0{index + 1}
                  <small>{c.layer}</small>
                </div>

                <div className="product-headline">
                  <h3>{product.name}</h3>
                  <p>{c.tagline}</p>
                </div>

                <div className="product-body">
                  <p>{c.description}</p>
                  <ul className="product-points">
                    {c.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>

                <div className="product-aside">
                  <span className="product-status" data-live={Boolean(product.href)}>
                    {c.status}
                  </span>
                  {product.href ? (
                    <a
                      href={product.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-link"
                    >
                      {t.visit}
                      <ArrowUpRight size={14} weight="bold" />
                    </a>
                  ) : (
                    <code>{product.domain}</code>
                  )}
                </div>
              </motion.article>
            )
          })}
        </RevealGroup>
      </div>
    </section>
  )
}
