"use client"

import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr"
import { motion, useScroll } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { GithubGlyph } from "@/components/layout/site-header"
import { LatestSignals } from "@/components/sections/latest-signals"
import { SelectedWork } from "@/components/sections/selected-work"
import { StackStrip } from "@/components/sections/stack-strip"
import { contactEmail, copy, githubOrg, repositories } from "@/lib/content"
import { homepageCopy } from "@/lib/homepage"
import styles from "./landing.module.css"

export function Landing() {
  const locale = useLocale()
  const { scrollYProgress } = useScroll()
  const t = homepageCopy[locale]
  const shared = copy[locale]

  return (
    <main className={styles.root}>
      <motion.div className="page-progress" style={{ scaleX: scrollYProgress }} />

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <h1>{t.hero.title}</h1>
          <p>{t.hero.lede}</p>
          <div className={styles.heroActions}>
            <a href="#company">
              {t.hero.primary}
              <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a href="#work">
              {t.hero.secondary}
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className={styles.heroField} aria-hidden="true">
          <div className={styles.fieldHeader}>
            <span>{t.hero.companyType}</span>
            <span>{t.hero.location}</span>
          </div>
          <strong>LAF</strong>
          <div className={styles.fieldRoute}>
            <span>PRODUCT</span>
            <span>API</span>
            <span>OPERATIONS</span>
            <span>SYSTEM</span>
          </div>
          <div className={styles.fieldFooter}>
            <span>BUILD QUIETLY.</span>
            <span>WORK RELIABLY.</span>
          </div>
        </div>
      </section>

      <section className={styles.company} id="company">
        <div className={styles.companyIntro}>
          <h2>{t.company.title}</h2>
          <p>{t.company.lede}</p>
        </div>
        <ul className={styles.scopeList}>
          {t.company.scopes.map((scope) => (
            <li key={scope.title}>
              <h3>{scope.title}</h3>
              <p>{scope.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <StackStrip />

      <section className={styles.method} id="work-method">
        <div className={styles.methodIntro}>
          <h2>{t.method.title}</h2>
          <p>{t.method.lede}</p>
        </div>
        <ol className={styles.methodGrid}>
          {t.method.items.map((item) => (
            <li key={item.title}>
              <span aria-hidden="true">{item.mark}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <SelectedWork />

      <section className={styles.engineering} id="engineering">
        <div className={styles.engineeringIntro}>
          <h2>{t.engineering.title}</h2>
          <p>{t.engineering.lede}</p>
        </div>
        <div className={styles.engineeringFrame}>
          <div className={styles.codePanel}>
            <div className={styles.codeHeader}>
              <span>{t.engineering.file}</span>
              <span>TypeScript</span>
            </div>
            <pre aria-label={t.engineering.file}>
              <code>
                {t.engineering.snippet.map((line, index) => (
                  <span key={`${index}:${line}`}>
                    <i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>
                    <b>{line || " "}</b>
                  </span>
                ))}
              </code>
            </pre>
          </div>
          <div className={styles.engineeringResult}>
            <div className={styles.requestFlow} aria-hidden="true">
              <span>REQUEST</span>
              <i />
              <strong>POLICY IN CODE</strong>
              <i />
              <span>RESPONSE</span>
            </div>
            <div>
              <h3>{t.engineering.resultTitle}</h3>
              <p>{t.engineering.resultBody}</p>
              <a
                href="https://github.com/laflabs-inc/lafetch"
                target="_blank"
                rel="noreferrer noopener"
                data-analytics-event="github_click"
                data-analytics-target="lafetch"
              >
                {t.engineering.repository}
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.open} id="open-source">
        <div className={styles.openIntro}>
          <h2>{t.open.title}</h2>
          <p>{t.open.lede}</p>
          <a
            href={githubOrg}
            target="_blank"
            rel="noreferrer noopener"
            data-analytics-event="github_click"
            data-analytics-target="laflabs-inc"
          >
            <GithubGlyph />
            {t.open.all}
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
        <div className={styles.repoList}>
          {repositories.map((repository) => (
            <a
              href={repository.href}
              target="_blank"
              rel="noreferrer noopener"
              key={repository.name}
              data-analytics-event="github_click"
              data-analytics-target={repository.name}
            >
              <strong>{repository.name}</strong>
              <span>{shared.open.descriptions[repository.name]}</span>
              <small>{repository.language}</small>
              <ArrowUpRight size={20} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <LatestSignals />

      <section className={styles.contact} id="contact">
        <div>
          <h2>{t.contact.title}</h2>
          <p>{t.contact.lede}</p>
        </div>
        <a
          href={`mailto:${contactEmail}`}
          data-analytics-event="contact_click"
          data-analytics-target="email"
        >
          {contactEmail}
          <ArrowRight size={22} aria-hidden="true" />
        </a>
      </section>
    </main>
  )
}
