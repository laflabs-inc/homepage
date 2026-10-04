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

export const structureDemos = {
  panel: PanelDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>
