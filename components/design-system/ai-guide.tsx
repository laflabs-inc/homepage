import { CodeBlock } from "@/components/content/code-block"
import { designCatalog } from "@/lib/design-system/catalog"
import type { Locale } from "@/lib/i18n"
import styles from "./design-system.module.css"

const installCommand = `mkdir -p "$CODEX_HOME/skills"
curl -fsSL https://laflabs.co/design/skill.zip -o /tmp/laflabs-web-design.zip
unzip -q /tmp/laflabs-web-design.zip -d "$CODEX_HOME/skills"`

const copy = {
  ko: {
    title: "AI에서 사용하기",
    description: "LafLabs Web Design을 AI 작업 환경에 연결할 때 쓸 공개 Markdown, token, Skill 리소스입니다.",
    metaLabels: ["시스템", "버전", "업데이트"],
    resourcesTitle: "직접 리소스",
    resourceDescriptions: [
      "모든 제공자에서 읽을 수 있는 디자인 가이드입니다.",
      "버전과 업데이트 날짜를 포함한 기계 판독용 token 문서입니다.",
      "점진적으로 읽을 수 있는 Skill의 시작 문서입니다.",
      "설치할 수 있는 다섯 파일 Skill 아카이브입니다.",
    ],
    resourceLabels: ["가이드 Markdown", "버전별 token JSON", "Skill 시작 문서", "Skill ZIP"],
    installTitle: "Skill 설치",
    installDescription: "아래 명령을 복사해 로컬 Codex Skill 디렉터리에 설치합니다. 이 페이지는 명령을 실행하지 않습니다.",
    download: "Skill 다운로드",
    neutralTitle: "어떤 AI 도구에서든 사용하기",
    neutralDescription: "도구에 가이드 Markdown과 versioned token JSON을 제공한 뒤, 요청한 작업에 관련된 Skill 참고 문서만 읽도록 안내하세요.",
    guideLink: "가이드 Markdown",
    tokensLink: "버전별 token JSON",
  },
  en: {
    title: "Use with AI",
    description: "Public Markdown, token, and Skill resources for connecting LafLabs Web Design to an AI workflow.",
    metaLabels: ["System", "Version", "Updated"],
    resourcesTitle: "Direct resources",
    resourceDescriptions: [
      "A design guide that any provider can read.",
      "A machine-readable token document with its version and update date.",
      "The progressive-disclosure entry document for the Skill.",
      "The five-file Skill archive for installation.",
    ],
    resourceLabels: ["Guide Markdown", "Versioned token JSON", "Skill entry document", "Skill ZIP"],
    installTitle: "Install the Skill",
    installDescription: "Copy this command to install the Skill in your local Codex Skill directory. This page does not execute the command.",
    download: "Download Skill",
    neutralTitle: "Use with any AI provider",
    neutralDescription: "Give your tool the guide Markdown and versioned token JSON, then direct it to read only the Skill references relevant to the requested work.",
    guideLink: "Guide Markdown",
    tokensLink: "Versioned token JSON",
  },
} as const

const resourcePaths = [
  "/design/guide.md",
  "/design/tokens.json",
  "/design/skill/SKILL.md",
  "/design/skill.zip",
] as const

const publicOrigin = "https://laflabs.co"

export function AiGuide({ locale }: { locale: Locale }) {
  const text = copy[locale]
  const resources = resourcePaths.map((path, index) => ({
    href: `${publicOrigin}${path}`,
    label: text.resourceLabels[index],
    description: text.resourceDescriptions[index],
  }))

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

      <section className={styles.section} aria-labelledby="ai-resources-title">
        <h2 id="ai-resources-title">{text.resourcesTitle}</h2>
        <dl className={styles.aiResourceList}>
          {resources.map((resource) => (
            <div className={styles.aiResourceRow} key={resource.href}>
              <dt>{resource.label}</dt>
              <dd>
                <p>{resource.description}</p>
                <a href={resource.href}>{resource.href}</a>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="ai-install-title">
        <h2 id="ai-install-title">{text.installTitle}</h2>
        <p className={styles.aiSectionDescription}>{text.installDescription}</p>
        <CodeBlock language="bash" source={installCommand}>
          <code>{installCommand}</code>
        </CodeBlock>
        <a className={styles.downloadLink} href="/design/skill.zip" download>
          {text.download}
          <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className={styles.section} aria-labelledby="ai-neutral-title">
        <h2 id="ai-neutral-title">{text.neutralTitle}</h2>
        <p className={styles.aiSectionDescription}>{text.neutralDescription}</p>
        <ul className={styles.aiGuideLinks}>
          <li>
            <a href={`${publicOrigin}/design/guide.md`}>{text.guideLink}</a>
          </li>
          <li>
            <a href={`${publicOrigin}/design/tokens.json`}>{text.tokensLink}</a>
          </li>
        </ul>
      </section>
    </article>
  )
}
