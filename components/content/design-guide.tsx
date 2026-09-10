import Image from "next/image"

import type { Locale } from "@/lib/i18n"
import styles from "./design-guide.module.css"

type DesignGuideProps = {
  locale: Locale
}

const colors = [
  { name: "Primary Blue", value: "#2563EB", tone: "blue" },
  { name: "Deep Blue", value: "#1E40AF", tone: "deep" },
  { name: "Ink", value: "#0F172A", tone: "ink" },
  { name: "Paper", value: "#F8FAFC", tone: "paper" },
  { name: "Muted", value: "#64748B", tone: "muted" },
  { name: "Line", value: "#CBD5E1", tone: "line" },
] as const

const copy = {
  ko: {
    title: "디자인 가이드",
    intro: "LafLabs가 만드는 제품이 서로 다른 환경에서도 같은 인상을 남기도록, 가장 기본적인 시각 원칙과 에셋을 정리했습니다.",
    nav: ["로고", "컬러", "타이포그래피", "인터페이스", "에셋"],
    logo: {
      title: "로고",
      description: "공식 심볼은 형태를 바꾸거나 장식을 더하지 않습니다. 충분한 여백을 두고, 선명한 대비가 확보되는 배경 위에서 사용합니다.",
      dark: "DARK FIELD",
      primary: "PRIMARY FIELD",
      download: "PNG 다운로드",
    },
    color: {
      title: "컬러",
      description: "파란색은 LafLabs를 구분하는 핵심 색상입니다. 넓은 면적의 장식보다 정보의 구조, 선택된 상태, 중요한 흐름을 표시하는 데 우선 사용합니다.",
    },
    type: {
      title: "타이포그래피",
      description: "큰 제목은 짧고 단단하게, 본문은 읽기 쉽게 씁니다. 영문 숫자와 기술 정보에는 모노스페이스를 제한적으로 사용합니다.",
      display: "보이지 않는 복잡함을 다룹니다.",
      body: "서비스는 단순해 보여야 하고, 그 뒤의 기술은 오래 믿고 쓸 수 있어야 합니다.",
      mono: "BUILD / SHIP / OPERATE  —  2026.08",
    },
    interface: {
      title: "인터페이스 원칙",
      description: "사각형은 단순한 장식이 아니라 정보를 나누고 관계를 드러내는 기본 단위입니다. 선, 면, 움직임 모두 같은 질서를 따릅니다.",
      principles: [
        ["Square geometry", "모서리를 불필요하게 둥글리지 않고, 명확한 면과 경계로 구조를 보여줍니다."],
        ["One-pixel rules", "얇은 선을 여백과 함께 사용해 콘텐츠의 시작과 끝을 또렷하게 구분합니다."],
        ["Blue with purpose", "강조가 필요한 상태와 진행 방향에만 파란색을 사용해 시선을 이끕니다."],
      ],
    },
    assets: {
      title: "에셋",
      description: "홈페이지와 제품 화면에서 사용하는 현재 공식 리소스입니다. 원본 비율을 유지해 사용해 주세요.",
      items: [
        ["Official logo", "PNG · 460 × 460", "/laflabs-logo.png"],
        ["System loop poster", "PNG", "/laf-system-loop-poster.png"],
        ["System loop motion", "Transparent WebM", "/laf-system-loop.webm"],
        ["System loop motion", "MP4", "/laf-system-loop.mp4"],
      ],
      action: "다운로드",
    },
  },
  en: {
    title: "Design guide",
    intro: "The essential visual rules and assets that help every LafLabs product feel like part of the same system.",
    nav: ["Logo", "Color", "Typography", "Interface", "Assets"],
    logo: {
      title: "Logo",
      description: "Keep the official symbol intact and free from decorative effects. Give it room and place it only where contrast stays clear.",
      dark: "DARK FIELD",
      primary: "PRIMARY FIELD",
      download: "Download PNG",
    },
    color: {
      title: "Color",
      description: "Blue is our defining color. We use it to clarify structure, selected states, and important flows rather than as surface decoration.",
    },
    type: {
      title: "Typography",
      description: "Headlines stay short and assured. Body copy stays easy to read. Monospace is reserved for numbers and technical information.",
      display: "We handle invisible complexity.",
      body: "The service should feel simple. The technology behind it should remain reliable for years.",
      mono: "BUILD / SHIP / OPERATE  —  2026.08",
    },
    interface: {
      title: "Interface principles",
      description: "The square is more than a visual motif. It is the basic unit we use to separate information and reveal relationships.",
      principles: [
        ["Square geometry", "Clear surfaces and edges communicate structure without unnecessary rounding."],
        ["One-pixel rules", "Fine rules and measured space make the beginning and end of content unambiguous."],
        ["Blue with purpose", "Blue is reserved for priority, selected states, and direction of travel."],
      ],
    },
    assets: {
      title: "Assets",
      description: "Current official resources used across the website and product surfaces. Preserve the original proportions.",
      items: [
        ["Official logo", "PNG · 460 × 460", "/laflabs-logo.png"],
        ["System loop poster", "PNG", "/laf-system-loop-poster.png"],
        ["System loop motion", "Transparent WebM", "/laf-system-loop.webm"],
        ["System loop motion", "MP4", "/laf-system-loop.mp4"],
      ],
      action: "Download",
    },
  },
} as const

export function DesignGuide({ locale }: DesignGuideProps) {
  const text = copy[locale]

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
        </div>
        <div className={styles.heroMark} aria-hidden="true">
          <span>LAF</span>
          <small>DESIGN SYSTEM / 2026</small>
        </div>
      </section>

      <nav className={styles.localNav} aria-label={locale === "ko" ? "디자인 가이드 목차" : "Design guide contents"}>
        {text.nav.map((label, index) => (
          <a key={label} href={`#${["logo", "color", "type", "interface", "assets"][index]}`}>
            {label}
          </a>
        ))}
      </nav>

      <section className={styles.section} id="logo">
        <div className={styles.sectionIntro}>
          <h2>{text.logo.title}</h2>
          <p>{text.logo.description}</p>
        </div>
        <div className={styles.logoGrid}>
          <figure className={`${styles.logoField} ${styles.logoFieldDark}`}>
            <Image src="/laflabs-logo.png" alt="LafLabs official logo" width={460} height={460} />
            <figcaption>{text.logo.dark}</figcaption>
          </figure>
          <figure className={`${styles.logoField} ${styles.logoFieldBlue}`}>
            <Image src="/laflabs-logo.png" alt="" width={460} height={460} />
            <figcaption>{text.logo.primary}</figcaption>
          </figure>
        </div>
        <a className={styles.downloadLink} href="/laflabs-logo.png" download>
          {text.logo.download}<span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className={styles.section} id="color">
        <div className={styles.sectionIntro}>
          <h2>{text.color.title}</h2>
          <p>{text.color.description}</p>
        </div>
        <div className={styles.colorList}>
          {colors.map((color) => (
            <div className={styles.colorRow} key={color.value}>
              <i className={styles[color.tone]} aria-hidden="true" />
              <strong>{color.name}</strong>
              <code>{color.value}</code>
              <span className={styles.colorLine} style={{ backgroundColor: color.value }} />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} id="type">
        <div className={styles.sectionIntro}>
          <h2>{text.type.title}</h2>
          <p>{text.type.description}</p>
        </div>
        <div className={styles.typeSamples}>
          <div className={styles.displaySample}>
            <span>DISPLAY / PRETENDARD</span>
            <p>{text.type.display}</p>
          </div>
          <div className={styles.bodySample}>
            <span>BODY / PRETENDARD</span>
            <p>{text.type.body}</p>
          </div>
          <div className={styles.monoSample}>
            <span>MONO / GEIST MONO</span>
            <p>{text.type.mono}</p>
          </div>
        </div>
      </section>

      <section className={styles.section} id="interface">
        <div className={styles.sectionIntro}>
          <h2>{text.interface.title}</h2>
          <p>{text.interface.description}</p>
        </div>
        <div className={styles.principleList}>
          {text.interface.principles.map(([title, description], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div className={styles.principleDemo} aria-hidden="true">
                <i /><i /><i />
              </div>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.assetsSection}`} id="assets">
        <div className={styles.sectionIntro}>
          <h2>{text.assets.title}</h2>
          <p>{text.assets.description}</p>
        </div>
        <div className={styles.assetList}>
          {text.assets.items.map(([name, meta, href]) => (
            <a href={href} download key={href}>
              <strong>{name}</strong>
              <span>{meta}</span>
              <b>{text.assets.action} ↓</b>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
