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
          <h2 className="display-sm section-head-title">
            {t.title[0]}
            <br />
            {t.title[1]}
          </h2>
          <p className="lede">{t.lede}</p>
        </Reveal>

        <RevealGroup className="repo-list" stagger={0.08}>
          {repositories.map((repo) => (
            <motion.a
              key={repo.name}
              href={repo.href}
              target="_blank"
              rel="noreferrer noopener"
              className="repo-row"
              variants={revealItem}
            >
              <span className="repo-name">{repo.name}</span>
              <p>{t.descriptions[repo.name]}</p>
              <span className="repo-lang" style={{ "--dot": repo.dot } as React.CSSProperties}>
                <i />
                {repo.language}
              </span>
              <ArrowUpRight size={18} weight="bold" />
            </motion.a>
          ))}
        </RevealGroup>

        <Reveal delay={0.1} className="repo-foot">
          <a href={githubOrg} target="_blank" rel="noreferrer noopener" className="text-link">
            {t.all}
            <ArrowUpRight size={14} weight="bold" />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
