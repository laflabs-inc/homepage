import type { ComponentType } from "react"

import { CodeBlock, type CodeBlockCopyLabels } from "@/components/content/code-block"
import { Logo } from "@/components/ui/logo"
import { TextLink } from "@/components/ui/text-link"
import type { DemoKey } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import { actionDemos } from "./component-demo-actions"
import { compositeDemos } from "./component-demo-composites"
import { coreExpansionDemos } from "./component-demo-core-expansion"
import { coreExpansionC2Demos } from "./component-demo-core-expansion-c2"
import { feedbackDemos } from "./component-demo-feedback"
import { formDemos } from "./component-demo-forms"
import { selectionDemos } from "./component-demo-selection"
import { structureDemos } from "./component-demo-structure"
import styles from "./design-system.module.css"

function LogoDemo({ state }: ComponentDemoProps) {
  return <Logo size={state === "compact" ? 16 : 24} />
}

function TextLinkDemo({ locale, state }: ComponentDemoProps) {
  const label = state
    ? locale === "ko" ? `${state} 링크 살펴보기` : `Inspect ${state} link`
    : locale === "ko" ? "컴포넌트 보기" : "View components"

  return (
    <TextLink href={state ? "/design/components" : "#text-link-preview"}>
      {label}
    </TextLink>
  )
}

const codeBlockCopyLabels = {
  ko: {
    buttonLabel: "TypeScript 코드 복사",
    copyText: "복사",
    copiedText: "복사됨",
    retryText: "다시 시도",
    copiedStatus: "TypeScript 코드를 클립보드에 복사했습니다.",
    errorStatus: "TypeScript 코드를 복사하지 못했습니다. 다시 시도해 주세요.",
  },
  en: {
    buttonLabel: "Copy TypeScript code",
    copyText: "COPY",
    copiedText: "COPIED",
    retryText: "RETRY",
    copiedStatus: "TypeScript code copied to clipboard.",
    errorStatus: "Could not copy TypeScript code. Try again.",
  },
} as const satisfies Record<Locale, CodeBlockCopyLabels>

function CodeBlockDemo({ locale }: ComponentDemoProps) {
  const source = "const surface = 'paper'"

  return (
    <div className={styles.demoCodeBlock}>
      <CodeBlock language="ts" source={source} copyLabels={codeBlockCopyLabels[locale]}>
        <code>{source}</code>
      </CodeBlock>
    </div>
  )
}

export type ComponentDemoProps = Readonly<{ locale: Locale; state?: string }>

const existingDemos = {
  logo: LogoDemo,
  "text-link": TextLinkDemo,
  "code-block": CodeBlockDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>

export const componentDemos = {
  ...existingDemos,
  ...actionDemos,
  ...formDemos,
  ...selectionDemos,
  ...compositeDemos,
  ...coreExpansionDemos,
  ...coreExpansionC2Demos,
  ...feedbackDemos,
  ...structureDemos,
} satisfies Record<DemoKey, ComponentType<ComponentDemoProps>>
