import type { ComponentType } from "react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import type { DemoKey } from "@/lib/design-system/schema"
import type { ComponentDemoProps } from "./component-demo-registry"
import styles from "./design-system.module.css"

function ButtonDemo({ locale, state }: ComponentDemoProps) {
  const label = locale === "ko" ? "변경 사항 저장" : "Save changes"
  const button = (
    <Button
      disabled={state === "disabled"}
      loading={state === "loading"}
      variant={state === "danger" ? "danger" : state === "default" ? "secondary" : "primary"}
    >
      {label}
    </Button>
  )

  return state === "danger" ? button : <div className={styles.demoCluster}>{button}</div>
}

function ButtonGroupDemo({ locale, state }: ComponentDemoProps) {
  const vertical = state === "vertical"
  return (
    <ButtonGroup
      className={state === "wrapped" ? styles.demoWrappedGroup : undefined}
      label={locale === "ko" ? "문서 동작" : "Document actions"}
      orientation={vertical ? "vertical" : "horizontal"}
    >
      <Button>{locale === "ko" ? "저장" : "Save"}</Button>
      <Button variant="secondary">{locale === "ko" ? "발행" : "Publish"}</Button>
    </ButtonGroup>
  )
}

export const actionDemos = {
  button: ButtonDemo,
  "button-group": ButtonGroupDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>
