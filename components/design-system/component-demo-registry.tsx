import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr"
import type { ComponentType } from "react"

import { CodeBlock, type CodeBlockCopyLabels } from "@/components/content/code-block"
import { Action } from "@/components/ui/action"
import { IconControl } from "@/components/ui/icon-control"
import { Logo } from "@/components/ui/logo"
import { TextLink } from "@/components/ui/text-link"
import type { DemoKey } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import { SegmentedToggleDemo } from "./component-demo-segmented-toggle"
import styles from "./design-system.module.css"

function LogoDemo() {
  return <Logo />
}

function ActionDemo() {
  return (
    <div className={styles.demoCluster}>
      <Action type="button" variant="primary">Primary</Action>
      <Action type="button" variant="secondary">Secondary</Action>
      <span className={styles.inverseDemo}>
        <Action type="button" variant="inverse">Inverse</Action>
      </span>
    </div>
  )
}

function IconControlDemo({ locale }: ComponentDemoProps) {
  return (
    <IconControl label={locale === "ko" ? "검색 미리보기" : "Search preview"}>
      <MagnifyingGlass aria-hidden weight="bold" />
    </IconControl>
  )
}

function TextLinkDemo({ locale }: ComponentDemoProps) {
  return (
    <TextLink href="#text-link-preview">
      {locale === "ko" ? "컴포넌트 보기" : "View components"}
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

export type ComponentDemoProps = Readonly<{ locale: Locale }>

export const componentDemos = {
  logo: LogoDemo,
  action: ActionDemo,
  "segmented-toggle": SegmentedToggleDemo,
  "icon-control": IconControlDemo,
  "text-link": TextLinkDemo,
  "code-block": CodeBlockDemo,
} satisfies Record<DemoKey, ComponentType<ComponentDemoProps>>
