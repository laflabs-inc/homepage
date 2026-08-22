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
        <Reveal className="section-head">
          <h2 className="display section-head-title">
            {t.title[0]}
            <br />
            {t.title[1]}
          </h2>
          <div>
            <p className="lede">{t.lede}</p>
            <div className="acronym-chips">
              {acronyms.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </Reveal>

        <RevealGroup className="principle-list" stagger={0.07}>
          {t.items.map((item, index) => (
            <motion.div key={item.key} className="principle-row" variants={revealItem}>
              <span>0{index + 1}</span>
              <h3>{item.key}</h3>
              <p>{item.body}</p>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
