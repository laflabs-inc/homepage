"use client"

import { useLocale } from "@/components/i18n/locale-provider"
import { useConsent } from "@/components/analytics/consent-provider"
import { GithubGlyph } from "@/components/layout/site-header"
import { Logo } from "@/components/ui/logo"
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr"
import { contactEmail, copy, githubOrg, products } from "@/lib/content"

export function SiteFooter() {
  const locale = useLocale()
  const { openSettings } = useConsent()
  const t = copy[locale].footer
  const ko = locale === "ko"

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand"><Logo /><p>{t.blurb}</p></div>
          <div className="footer-nav">
            <div><h4>{t.products}</h4>{products.map((product) => <a href="#products" key={product.id}>{product.name}</a>)}</div>
            <div><h4>{t.company}</h4><a href="#principles">{t.links.principles}</a><a href={githubOrg} target="_blank" rel="noreferrer" data-analytics-event="github_click" data-analytics-target="laflabs-inc">GitHub</a></div>
          </div>
          <a className="footer-mail" href={`mailto:${contactEmail}`} data-analytics-event="contact_click" data-analytics-target="email"><span>{ko ? "새로운 이야기를 시작하세요" : "Start a conversation"}</span><strong>{contactEmail}</strong><ArrowUpRight size={22} /></a>
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
            {t.location}
            <a href={githubOrg} target="_blank" rel="noreferrer noopener" aria-label="GitHub" data-analytics-event="github_click" data-analytics-target="laflabs-inc"><GithubGlyph size={14} /></a>
          </span>
        </div>
      </div>
    </footer>
  )
}
