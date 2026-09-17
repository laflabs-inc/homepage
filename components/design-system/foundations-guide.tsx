import { ArrowRight, MagnifyingGlass, X } from "@phosphor-icons/react/dist/ssr"
import Image from "next/image"
import type { CSSProperties, ReactNode } from "react"

import { designCatalog, designPageEntries } from "@/lib/design-system/catalog"
import type { DesignToken, FoundationEntry } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import { FoundationMotionSample } from "./foundation-motion-sample"
import styles from "./design-system.module.css"

const pageEntry = designPageEntries.find((entry) => entry.id === "foundations")
const officialLogo = designCatalog.assets.find((asset) => asset.id === "official-logo")
const designTokens: readonly DesignToken[] = designCatalog.tokens

const currentColorTokens = designTokens.filter(
  (token) => token.group === "color" && token.legacy !== true,
)
const typographyTokens = designTokens.filter((token) => token.group === "typography")
const layoutTokens = designTokens.filter(
  (token) => token.group === "spacing" || token.group === "layout",
)
const shapeTokens = designTokens.filter((token) => token.group === "shape")
const motionTokens = designTokens.filter((token) => token.group === "motion")

function displayTokenValue(value: string): string {
  return value.startsWith("#") ? value.toUpperCase() : value
}

function Guidance({ foundation, locale }: { foundation: FoundationEntry; locale: Locale }) {
  return (
    <ul className={styles.guidanceList}>
      {foundation.guidance.map((guidance) => (
        <li key={guidance.en}>{guidance[locale]}</li>
      ))}
    </ul>
  )
}

function TokenRows({ tokens, locale }: { tokens: readonly DesignToken[]; locale: Locale }) {
  return (
    <dl className={styles.tokenList}>
      {tokens.map((token) => (
        <div className={styles.tokenRow} key={token.id}>
          <dt><code>{token.id}</code></dt>
          <dd className={styles.tokenValue}>
            <code>{displayTokenValue(token.value)}</code>
            {token.cssVariable ? <code>{token.cssVariable}</code> : null}
          </dd>
          <dd className={styles.tokenPurpose}>
            <p>{token.purpose[locale]}</p>
            {token.contrast ? <p>{token.contrast[locale]}</p> : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function IdentitySpecimen({ locale }: { locale: Locale }) {
  if (!officialLogo) return null

  const identity = designCatalog.foundations.find((foundation) => foundation.id === "identity")

  return (
    <figure className={styles.identitySpecimen}>
      <div className={styles.clearSpaceField}>
        <Image
          src={officialLogo.path}
          alt={officialLogo.name}
          width={460}
          height={460}
          sizes="(max-width: 720px) 42vw, 152px"
        />
      </div>
      <div className={styles.contrastField}>
        <Image
          src={officialLogo.path}
          alt=""
          width={460}
          height={460}
          sizes="(max-width: 720px) 42vw, 152px"
        />
      </div>
      <figcaption>
        <code>{officialLogo.format} / {officialLogo.dimensions}</code>
        {identity ? <p>{identity.guidance[1][locale]}</p> : null}
      </figcaption>
    </figure>
  )
}

function ColorSpecimen({ locale }: { locale: Locale }) {
  return (
    <dl className={styles.colorList}>
      {currentColorTokens.map((token) => (
        <div className={styles.colorRow} key={token.id}>
          <dt>
            <span
              className={styles.colorSwatch}
              style={{ backgroundColor: token.value }}
              aria-hidden="true"
            />
            <code>{token.id}</code>
          </dt>
          <dd className={styles.tokenValue}>
            <code>{displayTokenValue(token.value)}</code>
            {token.cssVariable ? <code>{token.cssVariable}</code> : null}
          </dd>
          <dd className={styles.tokenPurpose}>
            <p>{token.purpose[locale]}</p>
            {token.contrast ? <p>{token.contrast[locale]}</p> : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function typographyStyle(token: DesignToken): CSSProperties | undefined {
  if (token.id === "typography.family-sans") {
    return { fontFamily: 'var(--font-geist-sans), "Pretendard", sans-serif' }
  }
  if (token.id === "typography.family-mono") {
    return { fontFamily: "var(--font-geist-mono), monospace" }
  }
  if (/^(?:clamp\(|\d+px$)/.test(token.value)) return { fontSize: token.value }
  return undefined
}

function TypographySpecimen({ foundation, locale }: { foundation: FoundationEntry; locale: Locale }) {
  return (
    <div className={styles.typeList}>
      {typographyTokens.map((token) => (
        <figure className={styles.typeRow} key={token.id}>
          <figcaption>
            <code>{token.id}</code>
            <code>{token.value}</code>
            <p>{token.purpose[locale]}</p>
          </figcaption>
          <p className={styles.typeSample} style={typographyStyle(token)}>
            {foundation.title[locale]}
          </p>
        </figure>
      ))}
    </div>
  )
}

function LayoutSpecimen({ locale }: { locale: Locale }) {
  const shell = layoutTokens.find((token) => token.id === "layout.shell")
  const gutter = layoutTokens.find((token) => token.id === "layout.gutter")

  return (
    <>
      {shell && gutter ? (
        <div className={styles.layoutStage} aria-hidden="true" style={{ paddingInline: gutter.value }}>
          <div className={styles.layoutShell} style={{ width: shell.value }}>
            <code>{shell.value}</code>
          </div>
        </div>
      ) : null}
      <TokenRows tokens={layoutTokens} locale={locale} />
    </>
  )
}

function ShapeSpecimen({ locale }: { locale: Locale }) {
  const radius = shapeTokens.find((token) => token.id === "shape.radius")
  const rule = shapeTokens.find((token) => token.id === "shape.rule")

  return (
    <>
      {radius && rule ? (
        <div
          className={styles.shapeSpecimen}
          style={{ borderRadius: radius.value, borderWidth: rule.value }}
          aria-hidden="true"
        />
      ) : null}
      <TokenRows tokens={shapeTokens} locale={locale} />
    </>
  )
}

function IconSpecimen() {
  return (
    <div className={styles.iconSpecimen} aria-hidden="true">
      <ArrowRight />
      <MagnifyingGlass />
      <X />
    </div>
  )
}

function MotionSpecimen({ foundation, locale }: { foundation: FoundationEntry; locale: Locale }) {
  return (
    <div className={styles.motionSpecimen}>
      <FoundationMotionSample label={foundation.title[locale]} />
      <TokenRows tokens={motionTokens} locale={locale} />
    </div>
  )
}

function FoundationSpecimen({ foundation, locale }: { foundation: FoundationEntry; locale: Locale }): ReactNode {
  switch (foundation.id) {
    case "identity":
      return <IdentitySpecimen locale={locale} />
    case "color":
      return <ColorSpecimen locale={locale} />
    case "typography":
      return <TypographySpecimen foundation={foundation} locale={locale} />
    case "spacing-layout":
      return <LayoutSpecimen locale={locale} />
    case "shape":
      return <ShapeSpecimen locale={locale} />
    case "iconography":
      return <IconSpecimen />
    case "motion":
      return <MotionSpecimen foundation={foundation} locale={locale} />
    default:
      return null
  }
}

export function FoundationsGuide({ locale }: { locale: Locale }) {
  if (!pageEntry) return null

  return (
    <article>
      <header className={styles.masthead}>
        <h1>{pageEntry.title[locale]}</h1>
        <p>{pageEntry.description[locale]}</p>
      </header>

      {designCatalog.foundations.map((foundation) => (
        <section
          className={`${styles.section} ${styles.foundationSection}`}
          aria-labelledby={`foundation-${foundation.id}`}
          key={foundation.id}
        >
          <div className={styles.foundationHeading}>
            <h2 id={`foundation-${foundation.id}`}>{foundation.title[locale]}</h2>
            <p>{foundation.summary[locale]}</p>
          </div>
          <FoundationSpecimen foundation={foundation} locale={locale} />
          <Guidance foundation={foundation} locale={locale} />
        </section>
      ))}
    </article>
  )
}
