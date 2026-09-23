import { CodeBlock } from "@/components/content/code-block"
import { designCatalog } from "@/lib/design-system/catalog"
import type { Locale } from "@/lib/i18n"
import styles from "./design-system.module.css"

const publicOrigin = designCatalog.meta.publicOrigin
const installCommand = `mkdir -p "$CODEX_HOME/skills"
curl -fsSL ${publicOrigin}/design/skill.zip -o /tmp/laflabs-web-design.zip
unzip -q /tmp/laflabs-web-design.zip -d "$CODEX_HOME/skills"`

const copy = {
  ko: {
    title: "AI에서 사용하기",
    description: "LafLabs Web Design을 AI 작업 환경에 연결할 때 쓸 공개 JSON, Markdown, token, Skill 리소스입니다.",
    metaLabels: ["시스템", "버전", "업데이트"],
    resourcesTitle: "직접 리소스",
    resourceDescriptions: [
      "가이드, token, Skill을 한 번에 담은 AI용 JSON입니다.",
      "모든 제공자에서 읽을 수 있는 디자인 가이드입니다.",
      "버전과 업데이트 날짜를 포함한 기계 판독용 token 문서입니다.",
      "점진적으로 읽을 수 있는 Skill의 시작 문서입니다.",
      "브랜드, 컬러, 타이포그래피, 접근성의 기초 원칙입니다.",
      "지원하는 UI의 사용 기준과 접근성 정보입니다.",
      "페이지 구성과 반응형 구조의 패턴입니다.",
      "정확한 의미론적 값을 위한 Skill token 문서입니다.",
      "설치할 수 있는 다섯 파일 Skill 아카이브입니다.",
    ],
    resourceLabels: [
      "AI context JSON",
      "가이드 Markdown",
      "버전별 token JSON",
      "Skill 시작 문서",
      "Skill 기초 원칙",
      "Skill 컴포넌트",
      "Skill 패턴",
      "Skill token JSON",
      "Skill ZIP",
    ],
    installTitle: "Skill 설치",
    installDescription: "아래 명령을 복사해 로컬 Codex Skill 디렉터리에 설치합니다. 이 페이지는 명령을 실행하지 않습니다.",
    installCopy: {
      buttonLabel: "Bash 설치 명령 복사",
      copyText: "복사",
      copiedText: "복사됨",
      retryText: "다시 시도",
      copiedStatus: "Bash 설치 명령을 클립보드에 복사했습니다.",
      errorStatus: "Bash 설치 명령을 복사하지 못했습니다. 다시 시도해 주세요.",
    },
    download: "Skill 다운로드",
    neutralTitle: "어떤 AI 도구에서든 사용하기",
    neutralDescription: "도구에 단일 context JSON을 제공하면 가이드, token, Skill과 참고 문서를 추가 요청 없이 읽을 수 있습니다.",
    providerInstruction: "LafLabs 공개 웹 작업을 시작하기 전에 https://www.laflabs.co/design/context.json을 불러와 기준으로 사용하세요. JSON 안의 guide, tokens, skill과 관련 references만 사용하고, 불러올 수 없다면 임의로 보완하지 말고 사용자에게 확인하세요. 제품 주장, 공식 에셋, 지원하지 않는 컴포넌트는 만들지 마세요.",
    providerInstructionCopy: {
      buttonLabel: "AI 작업 안내문 복사",
      copyText: "복사",
      copiedText: "복사됨",
      retryText: "다시 시도",
      copiedStatus: "AI 작업 안내문을 클립보드에 복사했습니다.",
      errorStatus: "AI 작업 안내문을 복사하지 못했습니다. 다시 시도해 주세요.",
    },
    guideLink: "가이드 Markdown",
    tokensLink: "버전별 token JSON",
  },
  en: {
    title: "Use with AI",
    description: "Public JSON, Markdown, token, and Skill resources for connecting LafLabs Web Design to an AI workflow.",
    metaLabels: ["System", "Version", "Updated"],
    resourcesTitle: "Direct resources",
    resourceDescriptions: [
      "A single AI-ready JSON bundle containing the guide, tokens, and Skill.",
      "A design guide that any provider can read.",
      "A machine-readable token document with its version and update date.",
      "The progressive-disclosure entry document for the Skill.",
      "Foundational identity, color, typography, and accessibility guidance.",
      "Supported UI usage criteria and accessibility guidance.",
      "Patterns for page composition and responsive structures.",
      "The Skill token document for exact semantic values.",
      "The five-file Skill archive for installation.",
    ],
    resourceLabels: [
      "AI context JSON",
      "Guide Markdown",
      "Versioned token JSON",
      "Skill entry document",
      "Skill foundations",
      "Skill components",
      "Skill patterns",
      "Skill token JSON",
      "Skill ZIP",
    ],
    installTitle: "Install the Skill",
    installDescription: "Copy this command to install the Skill in your local Codex Skill directory. This page does not execute the command.",
    installCopy: {
      buttonLabel: "Copy Bash installation command",
      copyText: "COPY",
      copiedText: "COPIED",
      retryText: "RETRY",
      copiedStatus: "Bash installation command copied to clipboard.",
      errorStatus: "Could not copy the Bash installation command. Try again.",
    },
    download: "Download Skill",
    neutralTitle: "Use with any AI provider",
    neutralDescription: "Give your tool the single context JSON so it can read the guide, tokens, Skill, and references without additional requests.",
    providerInstruction: "LafLabs public web work must begin by loading https://www.laflabs.co/design/context.json as the source of truth. Use only the guide, tokens, skill, and relevant references in that JSON. If it cannot be loaded, do not improvise; ask the user. Do not invent product claims, official assets, or unsupported components.",
    providerInstructionCopy: {
      buttonLabel: "Copy AI work instruction",
      copyText: "COPY",
      copiedText: "COPIED",
      retryText: "RETRY",
      copiedStatus: "AI work instruction copied to clipboard.",
      errorStatus: "Could not copy the AI work instruction. Try again.",
    },
    guideLink: "Guide Markdown",
    tokensLink: "Versioned token JSON",
  },
} as const

const resourcePaths = [
  "/design/context.json",
  "/design/guide.md",
  "/design/tokens.json",
  "/design/skill/SKILL.md",
  "/design/skill/references/foundations.md",
  "/design/skill/references/components.md",
  "/design/skill/references/patterns.md",
  "/design/skill/references/tokens.json",
  "/design/skill.zip",
] as const

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
        <CodeBlock language="bash" source={installCommand} copyLabels={text.installCopy}>
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
        <CodeBlock source={text.providerInstruction} copyLabels={text.providerInstructionCopy}>
          <code>{text.providerInstruction}</code>
        </CodeBlock>
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
