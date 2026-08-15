"use client"

import { motion } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { Reveal, RevealGroup, revealItem } from "@/components/ui/reveal"
import { copy } from "@/lib/content"

const acronyms = ["KISS", "DRY", "SOLID", "YAGNI"] as const

export function Principles() {
  const locale = useLocale()
  const t = copy[locale].principles

  return (
    <section className="section" id="principles">
      <div className="shell">
        <div className="principle-layout">
          <Reveal>
            <span className="eyebrow">{t.eyebrow}</span>
            <h2 className="section-title">{t.title}</h2>
            <p className="section-lede">{t.lede}</p>
            <div className="acronym-chips">
              {acronyms.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </Reveal>

          <RevealGroup className="principle-list" stagger={0.07}>
            {t.items.map((item) => (
              <motion.div key={item.key} className="principle-row" variants={revealItem}>
                <span>{item.key}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </motion.div>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  )
}
