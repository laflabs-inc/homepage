"use client"

import Link from "next/link"

import { useLocale } from "@/components/i18n/locale-provider"
import { useConsent } from "@/components/analytics/consent-provider"
import { GithubGlyph } from "@/components/layout/site-header"
import { Logo } from "@/components/ui/logo"
import { contactEmail, copy, githubOrg } from "@/lib/content"

export function SiteFooter({ homeHref }: { homeHref?: string } = {}) {
  const locale = useLocale()
  const { openSettings } = useConsent()
  const t = copy[locale].footer

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand"><Logo /><p>{t.blurb}</p></div>
          <div className="footer-nav">
            <div><h4>{t.company}</h4><a href={homeHref ? `${homeHref}#work-method` : "#work-method"}>{t.links.principles}</a><a href={`mailto:${contactEmail}`} data-analytics-event="contact_click" data-analytics-target="email">{t.links.contact}</a><a href={githubOrg} target="_blank" rel="noreferrer" data-analytics-event="github_click" data-analytics-target="laflabs-inc">GitHub</a></div>
            <div><h4>{t.documents}</h4><Link href="/notices">{t.links.notices}</Link><Link href="/legal">{t.links.legal}</Link><Link href="/disclosures">{t.links.disclosures}</Link><Link href="/design">{t.links.design}</Link></div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} LafLabs Inc. {t.rights}
          </span>
          <span>
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] tracking-[inherit] text-inherit transition-colors hover:text-white"
              onClick={openSettings}
            >
              {t.cookieSettings}
            </button>
            <a href={githubOrg} target="_blank" rel="noreferrer noopener" aria-label="GitHub" data-analytics-event="github_click" data-analytics-target="laflabs-inc"><GithubGlyph size={14} /></a>
          </span>
        </div>
      </div>
    </footer>
  )
}
