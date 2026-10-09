import { CaretDown } from "@phosphor-icons/react/dist/ssr"

import { Button } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusLabel } from "@/components/ui/status-label"
import type { RecipeDemoProps } from "./recipe-demo-registry"
import styles from "./recipe-demos.module.css"

export function DocumentPublishingToolbarDemo({ locale, state = "draft" }: RecipeDemoProps) {
  const isPublishing = state === "publishing"
  const copy = locale === "ko"
    ? {
        status: isPublishing ? "발행 중" : "초안",
        group: "문서 발행",
        save: "초안 저장",
        publish: "문서 발행",
        options: "발행 옵션 열기",
        schedule: "예약 발행",
        preview: "미리보기 링크 복사",
      }
    : {
        status: isPublishing ? "Publishing" : "Draft",
        group: "Document publishing",
        save: "Save draft",
        publish: "Publish document",
        options: "Open publishing options",
        schedule: "Schedule publication",
        preview: "Copy preview link",
      }

  return (
    <div className={styles.toolbar}>
      <StatusLabel tone={isPublishing ? "info" : "neutral"}>{copy.status}</StatusLabel>
      <DropdownMenu>
        <ButtonGroup className={styles.toolbarActions} label={copy.group}>
          <Button disabled={isPublishing} variant="secondary">{copy.save}</Button>
          <Button loading={isPublishing}>{copy.publish}</Button>
          <ButtonGroupSeparator />
          <DropdownMenuTrigger asChild>
            <Button aria-label={copy.options} disabled={isPublishing} size="icon">
              <CaretDown aria-hidden weight="bold" />
            </Button>
          </DropdownMenuTrigger>
        </ButtonGroup>
        <DropdownMenuContent align="end" className={styles.popupLayer}>
          <DropdownMenuItem>{copy.schedule}</DropdownMenuItem>
          <DropdownMenuItem>{copy.preview}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
