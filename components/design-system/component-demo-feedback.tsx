import type { ComponentType } from "react"

import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { DemoKey } from "@/lib/design-system/schema"
import type { ComponentDemoProps } from "./component-demo-registry"
import styles from "./design-system.module.css"

function AlertDemo({ locale, state }: ComponentDemoProps) {
  const variant = state === "success" || state === "warning" || state === "error" ? state : "info"
  return (
    <Alert
      live={state === "live"}
      title={locale === "ko" ? "상태를 확인해 주세요" : "Check this status"}
      variant={variant}
    >
      {locale === "ko" ? "다음 동작을 짧고 분명하게 안내합니다." : "Explain the next action briefly and clearly."}
    </Alert>
  )
}

function SkeletonDemo({ locale }: ComponentDemoProps) {
  return (
    <div aria-busy="true" aria-label={locale === "ko" ? "콘텐츠 불러오는 중" : "Loading content"} className={styles.demoSkeleton}>
      <Skeleton />
      <Skeleton />
      <Skeleton />
    </div>
  )
}

function EmptyStateDemo({ locale, state }: ComponentDemoProps) {
  return (
    <EmptyState
      action={state === "action" ? <Button>{locale === "ko" ? "새 문서 만들기" : "Create document"}</Button> : undefined}
      description={locale === "ko" ? "조건을 바꾸거나 새 문서를 만들 수 있습니다." : "Change the criteria or create a document."}
      title={locale === "ko" ? "표시할 문서가 없습니다" : "No documents to show"}
    />
  )
}

function SeparatorDemo({ state }: ComponentDemoProps) {
  const vertical = state === "vertical"
  return (
    <div className={vertical ? styles.demoVerticalSeparator : styles.demoSeparator}>
      <span>A</span>
      <Separator decorative={state === "decorative"} orientation={vertical ? "vertical" : "horizontal"} />
      <span>B</span>
    </div>
  )
}

export const feedbackDemos = {
  alert: AlertDemo,
  skeleton: SkeletonDemo,
  "empty-state": EmptyStateDemo,
  separator: SeparatorDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>
