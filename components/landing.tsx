"use client"

import { ArrowDown, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { GithubGlyph } from "@/components/layout/site-header"
import { LatestSignals } from "@/components/sections/latest-signals"
import { SelectedWork } from "@/components/sections/selected-work"
import { StackStrip } from "@/components/sections/stack-strip"
import { contactEmail, githubOrg } from "@/lib/content"
import { homepageCopy, openSourceRows } from "@/lib/homepage"
import styles from "./landing.module.css"

export function Landing() {
  const locale = useLocale()
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.16], ["0px", "64px"])
  const t = homepageCopy[locale]
  const reveal = (delay = 0) => ({
    initial: { opacity: 0.2, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: {
      duration: reducedMotion ? 0 : 0.56,
      delay,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  })
  const companyEnter = (delay = 0) => ({
    initial: { opacity: 0.25, x: 48 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, amount: 0.4 },
    transition: {
      duration: reducedMotion ? 0 : 0.64,
      delay,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  })

  return (
    <main className={styles.root}>
      <motion.div className="page-progress" style={{ scaleX: scrollYProgress }} />

      <section className={styles.hero} id="top">
        <div className={styles.heroIndex}>LAF / 001</div>
        <motion.div className={styles.heroCopy} {...reveal()}>
          <p className={styles.kicker}>{t.hero.companyType} · {t.hero.location}</p>
          <h1>{t.hero.title}</h1>
          <p>{t.hero.lede}</p>
        </motion.div>
        <motion.div
          className={styles.heroBlock}
          style={{ y: reducedMotion ? 0 : heroY }}
          aria-hidden="true"
        >
          <strong>LAF</strong>
          <div className={styles.heroBlockMeta}>
            <span>SOFTWARE</span>
            <span>SEOUL / KR</span>
          </div>
          <video
            className={styles.heroVideo}
            autoPlay
            muted
            playsInline
            preload="metadata"
            poster="/laf-system-loop-poster.png"
          >
            <source src="/laf-system-loop.mp4" type="video/mp4" />
          </video>
        </motion.div>
        <a className={styles.heroScroll} href="#company">
          <ArrowDown size={16} aria-hidden="true" />
          COMPANY
        </a>
      </section>

      <section className={styles.company} id="company">
        <p className={styles.sectionLabel}>01 / COMPANY</p>
        <motion.h2 {...reveal()}>{t.company.title}</motion.h2>
        <div className={styles.companyCopy}>
          <motion.p {...companyEnter()}>{t.company.lede}</motion.p>
          <motion.span {...companyEnter(0.1)}>
            BUILD QUIETLY.<br />WORK RELIABLY.
          </motion.span>
        </div>
      </section>

      <StackStrip />

      <section className={styles.method} id="work-method">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionLabel}>02 / HOW WE WORK</p>
          <h2>{t.method.title}</h2>
          <p>{t.method.lede}</p>
        </div>
        <ol className={styles.methodPanels}>
          {t.method.items.map((item, index) => (
            <motion.li className={styles.methodPanel} key={item.mark} {...reveal(index * 0.07)}>
              <div className={styles.panelTop}>
                <span>0{index + 1}</span>
                <span>{item.title}</span>
              </div>
              <strong className={styles.panelMark} aria-hidden="true">{item.mark}</strong>
              <div className={styles.panelCopy}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      <SelectedWork />

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
          {openSourceRows.map((row, index) => {
            const content = (
              <>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <strong>{row.title[locale]}</strong>
                <span>{row.description[locale]}</span>
                <i>{row.language ?? "—"}</i>
                {row.public ? <ArrowUpRight size={20} aria-hidden="true" /> : null}
              </>
            )

            return row.public && row.href ? (
              <a
                href={row.href}
                target="_blank"
                rel="noreferrer noopener"
                key={row.id}
                data-analytics-event="github_click"
                data-analytics-target={row.id}
              >
                {content}
              </a>
            ) : (
              <div className={styles.privateRepo} key={row.id}>
                {content}
              </div>
            )
          })}
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
