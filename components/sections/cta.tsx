"use client"

import { ArrowRight } from "@phosphor-icons/react/dist/ssr"

import { useLocale } from "@/components/i18n/locale-provider"
import { GithubGlyph } from "@/components/layout/site-header"
import { Reveal } from "@/components/ui/reveal"
import { contactEmail, copy, githubOrg } from "@/lib/content"

export function Cta() {
  const locale = useLocale()
  const t = copy[locale].cta

  return (
    <section className="cta" id="contact">
      <div className="cta-inner">
        <Reveal>
          <h2 className="display">
            {t.title[0]}
            <br />
            {t.title[1]}
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="cta-body">
            <div>
              <p className="lede">{t.lede}</p>
              <a href={`mailto:${contactEmail}`} className="cta-mail">
                {contactEmail}
              </a>
            </div>

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
          </div>
        </Reveal>
      </div>
    </section>
  )
}
