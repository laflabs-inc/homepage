"use client"

import { ArrowDown, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr"
import { motion, useReducedMotion } from "motion/react"
import { useLocale } from "@/components/i18n/locale-provider"
import { GithubGlyph } from "@/components/layout/site-header"
import { contactEmail, copy, githubOrg, products, repositories } from "@/lib/content"

const productMarks = ["ID", "PAY", "DOCK"] as const

export function Landing() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const t = copy[locale]
  const ko = locale === "ko"
  const reveal = (delay = 0) => ({
    initial: false as const,
    whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 },
    transition: { duration: reduced ? 0 : 0.55, delay },
  })

  return <main>
    <section className="new-hero" id="top">
      <div className="hero-index mono">LAF / 001</div>
      <motion.div className="new-hero-copy" {...reveal()}>
        <p className="kicker">Independent software company · Seoul</p>
        <h1>{ko ? <>제품의 다음을<br />만드는 회사.</> : <>We build what<br />products need next.</>}</h1>
        <p>{ko ? "LafLabs는 더 나은 디지털 경험에 필요한 제품과 기반 기술을 직접 설계하고 만듭니다." : "LafLabs designs and builds the products and infrastructure behind better digital experiences."}</p>
      </motion.div>
      <div className="hero-block" aria-hidden="true"><div className="hero-block-word">LAF</div><div className="hero-block-meta mono"><span>SOFTWARE</span><span>SEOUL / KR</span></div></div>
      <a className="hero-scroll mono" href="#products"><ArrowDown size={16} /> SELECTED PRODUCTS</a>
    </section>

    <section className="manifesto">
      <p className="section-no mono">01 / COMPANY</p>
      <motion.h2 {...reveal()}>{ko ? <>우리는 하나의 분야가 아니라,<br /><em>필요한 것</em>을 만듭니다.</> : <>We don&apos;t build for one category.<br />We build <em>what is needed.</em></>}</motion.h2>
      <div className="manifesto-copy"><p>{ko ? "아이덴티티, 결제, 클라우드에서 오픈소스까지. 서로 다른 문제를 하나의 태도로 해결합니다." : "From identity, payments, and cloud to open source. Different problems, solved with one point of view."}</p><span className="mono">BUILD QUIETLY.<br />WORK RELIABLY.</span></div>
    </section>

    <section className="product-stage" id="products">
      <div className="section-heading"><p className="section-no mono">02 / SELECTED PRODUCTS</p><h2>{ko ? "우리가 만드는 것" : "What we build"}</h2></div>
      <div className="product-grid">{products.map((product, index) => { const item = t.products[product.id]; return <motion.article className="product-panel" key={product.id} {...reveal(index * .07)}>
        <div className="product-top mono"><span>0{index + 1}</span><span>{item.layer}</span></div><div className="product-mark" aria-hidden="true">{productMarks[index]}</div>
        <div className="product-content"><p className="product-status mono">{item.status}</p><h3>{product.name}</h3><p>{item.description}</p>{product.href ? <a href={product.href}>{t.products.visit}<ArrowUpRight /></a> : <span className="product-soon">{t.products.soon}</span>}</div>
      </motion.article> })}</div>
    </section>

    <section className="open-stage" id="open-source">
      <div className="open-intro"><p className="section-no mono">03 / OPEN SOURCE</p><h2>{ko ? <>쓰임을 증명한<br />코드를 엽니다.</> : <>Code that earned<br />its place, open.</>}</h2><a href={githubOrg} target="_blank" rel="noreferrer"><GithubGlyph /> GitHub <ArrowUpRight /></a></div>
      <div className="repo-list">{repositories.map((repo, index) => <a href={repo.href} target="_blank" rel="noreferrer" key={repo.name}><span className="mono">0{index + 1}</span><strong>{repo.name}</strong><p>{t.open.descriptions[repo.name]}</p><ArrowUpRight size={22} /></a>)}</div>
    </section>

    <section className="principle-stage" id="principles">
      <p className="section-no mono">04 / OUR STANDARD</p><div className="principle-title"><h2>{ko ? "작동하는 것이 디자인입니다." : "Working is part of the design."}</h2><span className="square-seal mono">LAF<br />LABS</span></div>
      <div className="principle-grid">{t.principles.items.slice(0, 4).map((item, index) => <div key={item.key}><span className="mono">0{index + 1}</span><h3>{item.key}</h3><p>{item.body}</p></div>)}</div>
    </section>

    <section className="contact-stage" id="contact"><p className="section-no mono">05 / CONTACT</p><div><h2>{ko ? <>다음 제품을<br />함께 만듭시다.</> : <>Let&apos;s build<br />what&apos;s next.</>}</h2><a href={`mailto:${contactEmail}`}>{contactEmail}<ArrowRight /></a></div><p>{ko ? "제품 도입 · 기술 협업 · 투자 · 합류" : "Products · Partnerships · Investment · Careers"}</p></section>
  </main>
}
