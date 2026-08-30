"use client"

import { ArrowDown, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr"
import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useLocale } from "@/components/i18n/locale-provider"
import { GithubGlyph } from "@/components/layout/site-header"
import { BuildLoop } from "@/components/sections/build-loop"
import { LatestSignals } from "@/components/sections/latest-signals"
import { StackStrip } from "@/components/sections/stack-strip"
import { contactEmail, copy, githubOrg, products, repositories } from "@/lib/content"

const productMarks = ["ID", "PAY", "DOCK"] as const

export function Landing() {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const productStage = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll()
  const { scrollYProgress: productProgress } = useScroll({
    target: productStage,
    offset: ["start start", "end end"],
  })
  const productX = useTransform(productProgress, [0, 1], ["0vw", "-172vw"])
  const heroY = useTransform(scrollYProgress, [0, 0.16], ["0px", "90px"])
  const t = copy[locale]
  const ko = locale === "ko"
  const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: 24, filter: "blur(6px)" },
    whileInView: { opacity: 1, y: 0, filter: "blur(0px)" }, viewport: { once: true, amount: 0.2 },
    transition: { duration: reduced ? 0 : 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
  })
  const companyEnter = (delay = 0) => ({
    initial: { opacity: 0, x: 64, filter: "blur(2px)" },
    whileInView: { opacity: 1, x: 0, filter: "blur(0px)" },
    viewport: { once: true, amount: 0.42 },
    transition: { duration: reduced ? 0 : 0.72, delay, ease: [0.16, 1, 0.3, 1] as const },
  })

  return <main>
    <motion.div className="page-progress" style={{ scaleX: scrollYProgress }} />
    <section className="new-hero" id="top">
      <div className="hero-index mono">LAF / 001</div>
      <motion.div className="new-hero-copy" {...reveal()}>
        <p className="kicker">Independent software company · Seoul</p>
        <h1 aria-label={ko ? "제품에 필요한 다음을 만듭니다." : "We build what products need next."}>{ko ? <><span>제품에 필요한 다음을</span><span>만듭니다.</span></> : <><span>We build what</span><span>products need next.</span></>}</h1>
        <p>{ko ? "LafLabs는 더 나은 디지털 경험을 위한 제품과 기반 기술을 직접 설계하고 개발합니다." : "LafLabs designs and builds the products and infrastructure behind better digital experiences."}</p>
      </motion.div>
      <motion.div className="hero-block" style={{ y: heroY }} aria-hidden="true">
        <div className="hero-block-word">LAF</div><div className="hero-block-meta mono"><span>SOFTWARE</span><span>SEOUL / KR</span></div>
        <video className="hero-block-video" autoPlay muted playsInline preload="metadata" poster="/laf-system-loop-poster.png">
          <source src="/laf-system-loop.mp4" type="video/mp4" />
        </video>
      </motion.div>
      <a className="hero-scroll mono" href="#products"><ArrowDown size={16} /> SELECTED PRODUCTS</a>
    </section>

    <section className="manifesto">
      <p className="section-no mono">01 / COMPANY</p>
      <motion.h2 {...reveal()}>{ko ? <>분야를 가리지 않고,<br /><em>필요한 것</em>을 만듭니다.</> : <>We don&apos;t build for one category.<br />We build <em>what is needed.</em></>}</motion.h2>
      <div className="manifesto-copy"><motion.p data-company-line="copy" {...companyEnter()}>{ko ? "아이덴티티, 결제, 클라우드, 오픈소스. 문제는 달라도 만드는 원칙은 같습니다." : "Identity, payments, cloud, and open source. Different problems, one way of building."}</motion.p><motion.span className="mono" data-company-line="motto" {...companyEnter(0.12)}>BUILD QUIETLY.<br />WORK RELIABLY.</motion.span></div>
    </section>

    <StackStrip />

    <section className="product-stage" id="products" ref={productStage}>
      <div className="product-sticky">
      <div className="section-heading"><p className="section-no mono">02 / SELECTED PRODUCTS</p><h2>{ko ? "우리가 만드는 것" : "What we build"}</h2></div>
      <motion.div className="product-grid" style={{ "--track-x": productX } as never}>{products.map((product, index) => { const item = t.products[product.id]; return <motion.article className="product-panel" key={product.id} {...reveal(index * .07)}>
        <div className="product-top mono"><span>0{index + 1}</span><span>{item.layer}</span></div><div className="product-mark" aria-hidden="true">{productMarks[index]}</div>
        <div className="product-content"><p className="product-status mono">{item.status}</p><h3>{product.name}</h3><p>{item.description}</p>{product.href ? <a href={product.href} data-analytics-event="product_click" data-analytics-target={product.id}>{t.products.visit}<ArrowUpRight /></a> : <span className="product-soon">{t.products.soon}</span>}</div>
      </motion.article> })}</motion.div>
      <div className="product-progress" aria-hidden="true"><motion.span style={{ scaleX: productProgress }} /></div>
      </div>
    </section>

    <BuildLoop />

    <LatestSignals />

    <section className="open-stage" id="open-source">
      <div className="open-intro"><p className="section-no mono">03 / OPEN SOURCE</p><h2 aria-label={ko ? "직접 쓰고 검증한 코드를 공개합니다." : "Code that earned its place, open."}>{ko ? <>직접 쓰고 검증한<br />코드를 공개합니다.</> : <>Code that earned<br />its place, open.</>}</h2><a href={githubOrg} target="_blank" rel="noreferrer" data-analytics-event="github_click" data-analytics-target="laflabs-inc"><GithubGlyph /> GitHub <ArrowUpRight /></a></div>
      <div className="repo-list">{repositories.map((repo, index) => <motion.a href={repo.href} target="_blank" rel="noreferrer" key={repo.name} data-analytics-event="github_click" data-analytics-target={repo.name} {...reveal(index * .08)}><span className="mono">0{index + 1}</span><strong>{repo.name}</strong><p>{t.open.descriptions[repo.name]}</p><ArrowUpRight size={22} /></motion.a>)}</div>
    </section>

    <section className="principle-stage" id="principles">
      <p className="section-no mono">04 / OUR STANDARD</p><div className="principle-title"><h2>{ko ? "잘 만든 것은 제대로 작동합니다." : "Working is part of the design."}</h2><span className="square-seal mono">LAF<br />LABS</span></div>
      <div className="principle-grid">{t.principles.items.slice(0, 4).map((item, index) => <motion.div key={item.key} {...reveal(index * .07)}><span className="mono">0{index + 1}</span><h3>{item.key}</h3><p>{item.body}</p></motion.div>)}</div>
    </section>

    <section className="contact-stage" id="contact"><p className="section-no mono">05 / CONTACT</p><motion.div {...reveal()}><h2>{ko ? <>다음 제품을<br />함께 만듭시다.</> : <>Let&apos;s build<br />what&apos;s next.</>}</h2><a href={`mailto:${contactEmail}`} data-analytics-event="contact_click" data-analytics-target="email">{contactEmail}<ArrowRight /></a></motion.div><p>{ko ? "제품 도입, 기술 협업, 투자, 합류" : "Products, partnerships, investment, careers"}</p></section>
  </main>
}
