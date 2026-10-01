import type { ComponentType } from "react"
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
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
import { SegmentedControlDemo } from "./component-demo-segmented-control"
import styles from "./design-system.module.css"

function ButtonDemo({ locale, state }: ComponentDemoProps) {
  const label = locale === "ko" ? "변경 사항 저장" : "Save changes"
  if (state === "icon") {
    return (
      <Button aria-label={locale === "ko" ? "검색" : "Search"} size="icon" variant="secondary">
        <MagnifyingGlass aria-hidden weight="bold" />
      </Button>
    )
  }

  const variant = state === "secondary" || state === "inverse" || state === "ghost" || state === "danger"
    ? state
    : "primary"
  const button = (
    <Button
      disabled={state === "disabled"}
      loading={state === "loading"}
      variant={variant}
    >
      {label}
    </Button>
  )

  return state === "inverse"
    ? <span className={styles.inverseDemo}>{button}</span>
    : <div className={styles.demoCluster}>{button}</div>
}

function ButtonLinkDemo({ locale, state }: ComponentDemoProps) {
  const label = locale === "ko" ? "디자인 가이드 보기" : "View design guide"
  const variant = state === "secondary" || state === "inverse" || state === "ghost"
    ? state
    : "primary"

  if (state === "icon") {
    return (
      <ButtonLink aria-label={label} href="/design" size="icon" variant="secondary">
        <MagnifyingGlass aria-hidden weight="bold" />
      </ButtonLink>
    )
  }

  const link = <ButtonLink href="/design" variant={variant}>{label}</ButtonLink>
  return state === "inverse" ? <span className={styles.inverseDemo}>{link}</span> : link
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
  "button-link": ButtonLinkDemo,
  "button-group": ButtonGroupDemo,
  "segmented-control": SegmentedControlDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>
