import type { ComponentType } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SidePanel,
  SidePanelContent,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
} from "@/components/ui/side-panel"
import type { DemoKey } from "@/lib/design-system/schema"
import type { ComponentDemoProps } from "./component-demo-registry"
import styles from "./design-system.module.css"

function AlertDialogDemo({ locale, state }: ComponentDemoProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={state === "destructive" ? "danger" : "secondary"}>
          {locale === "ko" ? "문서 삭제" : "Delete document"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{locale === "ko" ? "문서를 삭제할까요?" : "Delete this document?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {locale === "ko" ? "삭제한 문서는 복구할 수 없습니다." : "A deleted document cannot be restored."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{locale === "ko" ? "취소" : "Cancel"}</AlertDialogCancel>
          <AlertDialogAction variant="destructive">{locale === "ko" ? "삭제" : "Delete"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function PopoverDemo({ locale }: ComponentDemoProps) {
  return (
    <Popover>
      <PopoverTrigger asChild><Button variant="secondary">{locale === "ko" ? "필터" : "Filters"}</Button></PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>{locale === "ko" ? "문서 필터" : "Document filters"}</PopoverTitle>
          <PopoverDescription>{locale === "ko" ? "목록에 표시할 상태를 고릅니다." : "Choose which states appear in the list."}</PopoverDescription>
        </PopoverHeader>
        <Button>{locale === "ko" ? "적용" : "Apply"}</Button>
      </PopoverContent>
    </Popover>
  )
}

function SidePanelDemo({ locale, state }: ComponentDemoProps) {
  const side = state === "open" ? "right" : state === "closed" ? "right" : "left"
  return (
    <SidePanel>
      <SidePanelTrigger asChild><Button>{locale === "ko" ? "설정 열기" : "Open settings"}</Button></SidePanelTrigger>
      <SidePanelContent side={side} closeLabel={locale === "ko" ? "설정 닫기" : "Close settings"}>
        <SidePanelHeader>
          <SidePanelTitle>{locale === "ko" ? "문서 설정" : "Document settings"}</SidePanelTitle>
          <SidePanelDescription>{locale === "ko" ? "공개 범위와 메타데이터를 관리합니다." : "Manage visibility and metadata."}</SidePanelDescription>
        </SidePanelHeader>
        <SidePanelFooter>{locale === "ko" ? "변경 내용은 자동 저장됩니다." : "Changes save automatically."}</SidePanelFooter>
      </SidePanelContent>
    </SidePanel>
  )
}

function ComboboxDemo({ locale, state }: ComponentDemoProps) {
  return (
    <div className={styles.demoCompositeControl}>
      <Combobox
        aria-label={locale === "ko" ? "프레임워크" : "Framework"}
        emptyText={locale === "ko" ? "일치하는 항목이 없습니다." : "No matching option."}
        options={[
          { value: "next", label: "Next.js", keywords: ["React"] },
          { value: "astro", label: "Astro" },
          { value: "legacy", label: locale === "ko" ? "레거시 · 선택 불가" : "Legacy · unavailable", disabled: state === "open" || state === "closed" ? false : true },
        ]}
        placeholder={locale === "ko" ? "프레임워크 검색" : "Search frameworks"}
      />
    </div>
  )
}

function InputGroupDemo({ locale }: ComponentDemoProps) {
  return (
    <div className={styles.demoCompositeWide}>
      <InputGroup>
        <InputGroupAddon><InputGroupText>https://</InputGroupText></InputGroupAddon>
        <InputGroupInput aria-label={locale === "ko" ? "프로젝트 도메인" : "Project domain"} defaultValue="laflabs.co" />
        <InputGroupAddon placement="end"><InputGroupButton>{locale === "ko" ? "확인" : "Verify"}</InputGroupButton></InputGroupAddon>
      </InputGroup>
    </div>
  )
}

function BreadcrumbDemo({ locale, state }: ComponentDemoProps) {
  return (
    <Breadcrumb aria-label={locale === "ko" ? "현재 위치" : "Current location"}>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="/">{locale === "ko" ? "홈" : "Home"}</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        {state === "collapsed" ? (
          <>
            <BreadcrumbItem><BreadcrumbEllipsis label={locale === "ko" ? "중간 경로" : "Intermediate levels"} /></BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        ) : null}
        <BreadcrumbItem><BreadcrumbLink href="/design">Design</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>Breadcrumb</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export const coreExpansionDemos = {
  "alert-dialog": AlertDialogDemo,
  popover: PopoverDemo,
  "side-panel": SidePanelDemo,
  combobox: ComboboxDemo,
  "input-group": InputGroupDemo,
  breadcrumb: BreadcrumbDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>
