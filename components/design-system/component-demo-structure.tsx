import type { ComponentType } from "react"

import { Button } from "@/components/ui/button"
import {
  Panel,
  PanelAction,
  PanelContent,
  PanelDescription,
  PanelFooter,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel"
import { StatusLabel } from "@/components/ui/status-label"
import type { DemoKey } from "@/lib/design-system/schema"
import type { ComponentDemoProps } from "./component-demo-registry"
import styles from "./design-system.module.css"

function PanelDemo({ locale, state }: ComponentDemoProps) {
  const tone = state === "subtle" || state === "inverse" ? state : "default"
  const title = locale === "ko" ? "배포 설정" : "Deployment settings"
  const description = locale === "ko"
    ? "공개 전에 환경과 상태를 확인합니다."
    : "Review the environment and state before publishing."

  return (
    <div className={styles.demoPanel}>
      <Panel aria-labelledby={`panel-demo-${state ?? "default"}`} tone={tone}>
        <PanelHeader>
          <PanelTitle id={`panel-demo-${state ?? "default"}`}>{title}</PanelTitle>
          <PanelDescription>{description}</PanelDescription>
          {state === "action" ? (
            <PanelAction>
              <Button size="compact" variant="secondary">
                {locale === "ko" ? "설정 열기" : "Open settings"}
              </Button>
            </PanelAction>
          ) : null}
        </PanelHeader>
        <PanelContent>
          <StatusLabel variant="success">{locale === "ko" ? "준비됨" : "Ready"}</StatusLabel>
        </PanelContent>
        <PanelFooter>{locale === "ko" ? "마지막 확인 · 오늘" : "Last checked · today"}</PanelFooter>
      </Panel>
    </div>
  )
}

function StatusLabelDemo({ locale, state }: ComponentDemoProps) {
  const variants = ["neutral", "info", "success", "warning", "error"] as const
  const variant = variants.includes(state as (typeof variants)[number])
    ? state as (typeof variants)[number]
    : "neutral"
  const labels = locale === "ko"
    ? { neutral: "초안", info: "검토 중", success: "발행됨", warning: "확인 필요", error: "발행 실패" }
    : { neutral: "Draft", info: "In review", success: "Published", warning: "Needs review", error: "Publish failed" }

  return (
    <div className={styles.demoStatusLabels}>
      {state ? (
        <StatusLabel variant={variant}>{labels[variant]}</StatusLabel>
      ) : variants.map((item) => (
        <StatusLabel key={item} variant={item}>{labels[item]}</StatusLabel>
      ))}
    </div>
  )
}

export const structureDemos = {
  panel: PanelDemo,
  "status-label": StatusLabelDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>
