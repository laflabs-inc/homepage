"use client"

import { useEffect, useState } from "react"
import { ArrowRight, CheckCircle } from "@phosphor-icons/react/dist/ssr"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { useLocale } from "@/components/i18n/locale-provider"
import { GithubGlyph } from "@/components/layout/site-header"
import { EASE } from "@/components/ui/reveal"
import { copy, githubOrg } from "@/lib/content"

/**
 * Types the prompt one character at a time, then hands off to the output.
 * State only ever advances from inside the interval callback, so the effect
 * body stays free of synchronous renders.
 */
function useTypewriter(text: string, enabled: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setCount(index)
      if (index >= text.length) window.clearInterval(timer)
    }, 55)
    return () => window.clearInterval(timer)
  }, [text, enabled])

  return enabled ? text.slice(0, count) : text
}

function Terminal() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const t = copy[locale].terminal

  const typed = useTypewriter(t.command, !reduced)
  const done = typed.length === t.command.length

  return (
    <div className="terminal">
      <div className="terminal-bar">
        <div className="terminal-dots">
          <i />
          <i />
          <i />
        </div>
        <span>laflabs — zsh</span>
        <span />
      </div>

      <div className="terminal-body">
        <div>
          <span className="t-ok">$</span> <span>{typed}</span>
          {!done && <span className="terminal-caret" />}
        </div>

        <AnimatePresence>
          {done && (
            <motion.div
              key={locale}
              style={{ display: "grid", gap: 9 }}
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: reduced ? 0 : 0.14, delayChildren: 0.2 } } }}
            >
              {t.lines.map((line, index) => (
                <motion.div
                  key={line}
                  variants={{
                    hidden: { opacity: 0, x: reduced ? 0 : -6 },
                    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
                  }}
                  className={index === 0 ? "t-brand" : index === 3 ? undefined : "t-dim"}
                >
                  {line}
                </motion.div>
              ))}

              <motion.div
                className="t-spark"
                style={{ marginTop: 8 }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { duration: 0.5, delay: 0.15, ease: EASE } },
                }}
              >
                ✓ {t.result}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function Hero() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const t = copy[locale].hero

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  })

  return (
    <section className="hero" id="top">
      <div className="grid-lines" />

      <div className="hero-inner">
        <div>
          <motion.span className="hero-badge" {...rise(0)}>
            <i />
            {t.badge}
          </motion.span>

          <motion.h1 {...rise(0.08)}>
            {t.title[0]}
            <br />
            <em>{t.title[1]}</em>
          </motion.h1>

          <motion.p className="hero-lede" {...rise(0.16)}>
            {t.lede}
          </motion.p>

          <motion.div className="hero-ctas" {...rise(0.24)}>
            <a href="#products" className="btn btn-primary">
              {t.primary}
              <ArrowRight size={15} weight="bold" />
            </a>
            <a
              href={githubOrg}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-outline"
            >
              <GithubGlyph size={15} />
              {t.secondary}
            </a>
          </motion.div>

          <motion.div className="hero-proof" {...rise(0.32)}>
            {t.proof.map((item) => (
              <span key={item}>
                <CheckCircle size={13} weight="fill" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, y: reduced ? 0 : 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.18, ease: EASE }}
        >
          <Terminal />
        </motion.div>
      </div>
    </section>
  )
}
