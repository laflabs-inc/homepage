"use client"

import { useLocale } from "@/components/i18n/locale-provider"
import { GithubGlyph } from "@/components/layout/site-header"
import { Logo } from "@/components/ui/logo"
import { contactEmail, copy, githubOrg, products, repositories } from "@/lib/content"

export function SiteFooter() {
  const locale = useLocale()
  const t = copy[locale].footer
  const productCopy = copy[locale].products

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo />
            <p>{t.blurb}</p>
          </div>

          <div className="footer-col">
            <h4>{t.products}</h4>
            <ul>
              {products.map((product) => (
                <li key={product.id}>
                  {product.href ? (
                    <a href={product.href} target="_blank" rel="noreferrer noopener">
                      {product.name}
                    </a>
                  ) : (
                    <a href="#products">
                      {product.name} <span style={{ opacity: 0.6 }}>· {productCopy.soon}</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t.open}</h4>
            <ul>
              {repositories.map((repo) => (
                <li key={repo.name}>
                  <a href={repo.href} target="_blank" rel="noreferrer noopener">
                    {repo.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t.company}</h4>
            <ul>
              <li>
                <a href="#principles">{t.links.principles}</a>
              </li>
              <li>
                <a href={`mailto:${contactEmail}`}>{t.links.contact}</a>
              </li>
              <li>
                <a href={githubOrg} target="_blank" rel="noreferrer noopener">
                  {t.links.github}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} LafLabs Inc. {t.rights}
          </span>
          <span>
            {t.location}
            <a href={githubOrg} target="_blank" rel="noreferrer noopener" aria-label="GitHub">
              <GithubGlyph size={14} />
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
