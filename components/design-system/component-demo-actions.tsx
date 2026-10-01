import type { ComponentType } from "react"
import { CaretDown } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@/components/ui/button-group"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupInput,
} from "@/components/ui/input-group"
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

  if (state === "wrapped") {
    return (
      <ButtonGroup
        aria-label={locale === "ko" ? "문서 검색" : "Document search"}
        className={styles.demoWrappedGroup}
      >
        <InputGroup data-slot="input-group">
          <InputGroupInput
            aria-label={locale === "ko" ? "검색어" : "Search query"}
            placeholder={locale === "ko" ? "문서 검색" : "Search documents"}
          />
        </InputGroup>
        <Button>{locale === "ko" ? "검색" : "Search"}</Button>
      </ButtonGroup>
    )
  }

  if (vertical) {
    return (
      <ButtonGroup
        label={locale === "ko" ? "문서 동작" : "Document actions"}
        orientation="vertical"
      >
        <Button>{locale === "ko" ? "저장" : "Save"}</Button>
        <Button variant="secondary">{locale === "ko" ? "초안 닫기" : "Close draft"}</Button>
      </ButtonGroup>
    )
  }

  return (
    <div className={styles.demoCluster}>
      <ButtonGroup label={locale === "ko" ? "문서 저장" : "Document save"}>
        <ButtonGroupText>{locale === "ko" ? "초안" : "DRAFT"}</ButtonGroupText>
        <Button variant="secondary">{locale === "ko" ? "저장" : "Save"}</Button>
        <Button>{locale === "ko" ? "발행" : "Publish"}</Button>
      </ButtonGroup>

      <DropdownMenu>
        <ButtonGroup label={locale === "ko" ? "발행 방식" : "Publish options"}>
          <Button>{locale === "ko" ? "지금 발행" : "Publish now"}</Button>
          <ButtonGroupSeparator />
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={locale === "ko" ? "발행 옵션 열기" : "Open publish options"}
              size="icon"
            >
              <CaretDown aria-hidden weight="bold" />
            </Button>
          </DropdownMenuTrigger>
        </ButtonGroup>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>{locale === "ko" ? "예약 발행" : "Schedule"}</DropdownMenuItem>
          <DropdownMenuItem>{locale === "ko" ? "미리보기 링크 복사" : "Copy preview link"}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export const actionDemos = {
  button: ButtonDemo,
  "button-group": ButtonGroupDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>
