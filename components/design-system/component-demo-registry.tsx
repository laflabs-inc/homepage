import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr"
import type { ComponentType } from "react"

import { CodeBlock, type CodeBlockCopyLabels } from "@/components/content/code-block"
import { Action } from "@/components/ui/action"
import { IconControl } from "@/components/ui/icon-control"
import { Logo } from "@/components/ui/logo"
import { TextLink } from "@/components/ui/text-link"
import type { DemoKey } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import { actionDemos } from "./component-demo-actions"
import { compositeDemos } from "./component-demo-composites"
import { feedbackDemos } from "./component-demo-feedback"
import { formDemos } from "./component-demo-forms"
import { selectionDemos } from "./component-demo-selection"
import { SegmentedToggleDemo } from "./component-demo-segmented-toggle"
import styles from "./design-system.module.css"

function LogoDemo({ state }: ComponentDemoProps) {
  return <Logo size={state === "compact" ? 16 : 24} />
}

function ActionDemo({ locale, state }: ComponentDemoProps) {
  if (state) {
    const labels = locale === "ko"
      ? {
        primary: "주요 동작",
        secondary: "보조 동작",
        inverse: "반전 동작",
        hover: "hover 동작",
        "focus-visible": "focus-visible 동작",
        disabled: "비활성 동작",
      }
      : {
        primary: "Primary action",
        secondary: "Secondary action",
        inverse: "Inverse action",
        hover: "Hover action",
        "focus-visible": "Focus-visible action",
        disabled: "Disabled action",
      }
    const variant = state === "secondary" ? "secondary" : state === "inverse" ? "inverse" : "primary"
    const action = (
      <Action type="button" variant={variant} disabled={state === "disabled"}>
        {labels[state as keyof typeof labels] ?? state}
      </Action>
    )

    return state === "inverse" ? <span className={styles.inverseDemo}>{action}</span> : action
  }

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

function IconControlDemo({ locale, state }: ComponentDemoProps) {
  const label = state === "disabled"
    ? locale === "ko" ? "비활성 아이콘 컨트롤" : "Disabled icon control"
    : state
      ? locale === "ko" ? `${state} 아이콘 컨트롤` : `${state} icon control`
      : locale === "ko" ? "검색 미리보기" : "Search preview"

  return (
    <IconControl label={label} disabled={state === "disabled"}>
      <MagnifyingGlass aria-hidden weight="bold" />
    </IconControl>
  )
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
  action: ActionDemo,
  "segmented-toggle": SegmentedToggleDemo,
  "icon-control": IconControlDemo,
  "text-link": TextLinkDemo,
  "code-block": CodeBlockDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>

export const componentDemos = {
  ...existingDemos,
  ...actionDemos,
  ...formDemos,
  ...selectionDemos,
  ...compositeDemos,
  ...feedbackDemos,
} satisfies Record<DemoKey, ComponentType<ComponentDemoProps>>
