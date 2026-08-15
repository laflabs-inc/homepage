"use client"

import { ArrowUpRight, CreditCard, Cube, Dot, Fingerprint } from "@phosphor-icons/react/dist/ssr"
import { motion } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { Reveal, RevealGroup, revealItem } from "@/components/ui/reveal"
import { copy, products } from "@/lib/content"

const icons = {
  "laf-id": Fingerprint,
  "laf-pay": CreditCard,
  lafdock: Cube,
} as const

export function Products() {
  const locale = useLocale()
  const t = copy[locale].products

  return (
    <section className="section" id="products">
      <div className="shell">
        <Reveal className="section-head">
          <span className="eyebrow">{t.eyebrow}</span>
          <h2 className="section-title">{t.title}</h2>
          <p className="section-lede">{t.lede}</p>
        </Reveal>

        <RevealGroup className="product-grid">
          {products.map((product) => {
            const c = t[product.id]
            const Icon = icons[product.id]

            return (
              <motion.article key={product.id} className="product-card" variants={revealItem}>
                <div className="product-card-top">
                  <span className="product-icon">
                    <Icon size={20} weight="duotone" />
                  </span>
                  <span className="product-status">{c.status}</span>
                </div>

                <h3>{product.name}</h3>
                <p>{c.description}</p>

                <ul className="product-points">
                  {c.points.map((point) => (
                    <li key={point}>
                      <Dot size={14} weight="bold" />
                      {point}
                    </li>
                  ))}
                </ul>

                <div className="product-card-foot">
                  <code>{product.domain}</code>
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
                    <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{t.soon}</span>
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
