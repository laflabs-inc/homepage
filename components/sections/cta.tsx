"use client"

import { ArrowRight } from "@phosphor-icons/react/dist/ssr"

import { useLocale } from "@/components/i18n/locale-provider"
import { GithubGlyph } from "@/components/layout/site-header"
import { Reveal } from "@/components/ui/reveal"
import { LogoMark } from "@/components/ui/logo"
import { contactEmail, copy, githubOrg } from "@/lib/content"

export function Cta() {
  const locale = useLocale()
  const t = copy[locale].cta

  return (
    <section className="cta" id="contact">
      <div className="grid-lines" />

      <div className="cta-inner">
        <Reveal>
          <LogoMark size={34} />
        </Reveal>

        <Reveal delay={0.06}>
          <span className="eyebrow" style={{ marginTop: 22, display: "inline-flex" }}>
            {t.eyebrow}
          </span>
        </Reveal>

        <Reveal delay={0.12}>
          <h2>
            {t.title[0]}
            <br />
            {t.title[1]}
          </h2>
        </Reveal>

        <Reveal delay={0.18}>
          <p>{t.lede}</p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="cta-actions">
            <a href={`mailto:${contactEmail}`} className="btn btn-light">
              {t.mail}
              <ArrowRight size={15} weight="bold" />
            </a>
            <a
              href={githubOrg}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-ghost-inverse"
            >
              <GithubGlyph size={15} />
              {t.github}
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <a
            href={`mailto:${contactEmail}`}
            className="mono"
            style={{ marginTop: 26, display: "inline-block", color: "var(--text-inverse-muted)", fontSize: 12 }}
          >
            {contactEmail}
          </a>
        </Reveal>
      </div>
    </section>
  )
}
