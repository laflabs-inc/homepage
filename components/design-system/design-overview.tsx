import Image from "next/image"
import Link from "next/link"

import { designCatalog, designPageEntries } from "@/lib/design-system/catalog"
import type { Locale } from "@/lib/i18n"
import { getDesignPageHref } from "./design-shell"
import styles from "./design-system.module.css"

const copy = {
  ko: {
    title: "LafLabs 디자인 시스템",
    description: "LafLabs 제품과 문서를 일관되게 설계하고 구현하기 위한 기준입니다.",
    metaLabels: ["시스템", "버전", "업데이트"],
    logoTitle: "공식 로고",
    logoAlt: "LafLabs 공식 로고",
    documentationTitle: "문서",
    startTitle: "시작 경로",
    starts: [
      { role: "Designer", href: "/design/foundations", label: "기초 원칙에서 시각 언어를 확인하세요." },
      { role: "Developer", href: "/design/components", label: "컴포넌트에서 지원 API를 확인하세요." },
      { role: "AI", href: "/design/ai", label: "AI 리소스를 작업 환경에 연결하세요." },
    ],
  },
  en: {
    title: "LafLabs Design System",
    description: "The shared standard for designing and building consistent LafLabs products and documentation.",
    metaLabels: ["System", "Version", "Updated"],
    logoTitle: "Official logo",
    logoAlt: "Official LafLabs logo",
    documentationTitle: "Documentation",
    startTitle: "Start here",
    starts: [
      { role: "Designer", href: "/design/foundations", label: "Begin with the visual foundations." },
      { role: "Developer", href: "/design/components", label: "Review the supported component APIs." },
      { role: "AI", href: "/design/ai", label: "Connect the AI resources to your workflow." },
    ],
  },
} as const

const officialLogo = designCatalog.assets.find((asset) => asset.id === "official-logo")

export function DesignOverview({ locale }: { locale: Locale }) {
  const text = copy[locale]
  const destinations = designPageEntries.filter((entry) => entry.id !== "overview")

  return (
    <article>
      <header className={styles.masthead}>
        <h1>{text.title}</h1>
        <p>{text.description}</p>
        <dl className={styles.metadata}>
          <div>
            <dt>{text.metaLabels[0]}</dt>
            <dd>{designCatalog.meta.name}</dd>
          </div>
          <div>
            <dt>{text.metaLabels[1]}</dt>
            <dd>{designCatalog.meta.version}</dd>
          </div>
          <div>
            <dt>{text.metaLabels[2]}</dt>
            <dd>
              <time dateTime={designCatalog.meta.updatedAt}>{designCatalog.meta.updatedAt}</time>
            </dd>
          </div>
        </dl>
      </header>

      {officialLogo ? (
        <section className={styles.section} aria-labelledby="design-logo-title">
          <h2 id="design-logo-title">{text.logoTitle}</h2>
          <figure className={styles.logoSpecimen}>
            <div className={styles.logoField}>
              <Image
                src={officialLogo.path}
                alt={text.logoAlt}
                width={460}
                height={460}
                sizes="(max-width: 720px) 45vw, 184px"
              />
            </div>
            <figcaption>
              <strong>{officialLogo.format} / {officialLogo.dimensions}</strong>
              <p>{officialLogo.usage[locale]}</p>
            </figcaption>
          </figure>
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="design-documentation-title">
        <h2 id="design-documentation-title">{text.documentationTitle}</h2>
        <div className={styles.destinationList}>
          {destinations.map((entry) => (
            <Link
              className={styles.destinationRow}
              href={getDesignPageHref(entry.href, locale)}
              aria-label={entry.title[locale]}
              key={entry.id}
            >
              <h3>{entry.title[locale]}</h3>
              <p>{entry.description[locale]}</p>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="design-start-title">
        <h2 id="design-start-title">{text.startTitle}</h2>
        <dl className={styles.startList}>
          {text.starts.map((start) => (
            <div className={styles.startRow} key={start.role}>
              <dt>{start.role}</dt>
              <dd>
                <Link href={getDesignPageHref(start.href, locale)}>
                  {start.label}
                  <span aria-hidden="true">→</span>
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  )
}
