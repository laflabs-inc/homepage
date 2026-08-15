"use client"

import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr"
import { motion } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { Reveal, RevealGroup, revealItem } from "@/components/ui/reveal"
import { copy, githubOrg, repositories } from "@/lib/content"

export function OpenSource() {
  const locale = useLocale()
  const t = copy[locale].open

  return (
    <section className="section section-alt" id="open-source">
      <div className="shell">
        <Reveal className="section-head">
          <span className="eyebrow">{t.eyebrow}</span>
          <h2 className="section-title">{t.title}</h2>
          <p className="section-lede">{t.lede}</p>
        </Reveal>

        <RevealGroup className="repo-grid">
          {repositories.map((repo) => (
            <motion.a
              key={repo.name}
              href={repo.href}
              target="_blank"
              rel="noreferrer noopener"
              className="repo-card"
              variants={revealItem}
            >
              <div className="repo-card-top">
                <strong>{repo.name}</strong>
                <ArrowUpRight size={15} weight="bold" />
              </div>
              <p>{t.descriptions[repo.name]}</p>
              <span className="repo-lang" style={{ "--dot": repo.dot } as React.CSSProperties}>
                <i />
                {repo.language}
              </span>
            </motion.a>
          ))}
        </RevealGroup>

        <Reveal delay={0.1}>
          <div style={{ marginTop: 26 }}>
            <a href={githubOrg} target="_blank" rel="noreferrer noopener" className="text-link">
              {t.all}
              <ArrowUpRight size={14} weight="bold" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
