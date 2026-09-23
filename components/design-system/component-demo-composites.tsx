import { DotsThree, Info } from "@phosphor-icons/react/dist/ssr"
import type { ComponentType } from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { IconControl } from "@/components/ui/icon-control"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { DemoKey } from "@/lib/design-system/schema"
import type { ComponentDemoProps } from "./component-demo-registry"
import styles from "./design-system.module.css"

function SelectDemo({ locale, state }: ComponentDemoProps) {
  return (
    <div className={styles.demoCompositeControl}>
      <Select defaultValue="ko">
        <SelectTrigger aria-label={locale === "ko" ? "문서 언어" : "Document language"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{locale === "ko" ? "언어" : "Language"}</SelectLabel>
            <SelectItem value="ko">{locale === "ko" ? "한국어" : "Korean"}</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="ja" disabled={state === "disabled"}>
              {state === "disabled"
                ? locale === "ko" ? "일본어 · 준비 중" : "Japanese · unavailable"
                : locale === "ko" ? "일본어" : "Japanese"}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

function DropdownMenuDemo({ locale }: ComponentDemoProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">
          <DotsThree aria-hidden size={18} weight="bold" />
          {locale === "ko" ? "문서 메뉴" : "Document menu"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{locale === "ko" ? "문서" : "Document"}</DropdownMenuLabel>
        <DropdownMenuItem>{locale === "ko" ? "편집" : "Edit"}</DropdownMenuItem>
        <DropdownMenuItem>{locale === "ko" ? "복제" : "Duplicate"}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>{locale === "ko" ? "상단 고정" : "Pin to top"}</DropdownMenuCheckboxItem>
        <DropdownMenuItem disabled>{locale === "ko" ? "삭제 · 권한 필요" : "Delete · permission required"}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TabsDemo({ locale, state }: ComponentDemoProps) {
  return (
    <Tabs className={styles.demoCompositeWide} defaultValue={state === "selected" ? "api" : "overview"}>
      <TabsList aria-label={locale === "ko" ? "문서 보기" : "Document view"}>
        <TabsTrigger value="overview">{locale === "ko" ? "개요" : "Overview"}</TabsTrigger>
        <TabsTrigger value="api">API</TabsTrigger>
        <TabsTrigger value="history" disabled>{locale === "ko" ? "변경 이력" : "History"}</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">{locale === "ko" ? "핵심 목적과 사용 범위를 확인합니다." : "Review the purpose and intended scope."}</TabsContent>
      <TabsContent value="api">{locale === "ko" ? "공개 API와 상태를 확인합니다." : "Review the public API and states."}</TabsContent>
      <TabsContent value="history">—</TabsContent>
    </Tabs>
  )
}

function AccordionDemo({ locale, state }: ComponentDemoProps) {
  return (
    <div className={styles.demoCompositeWide}>
      <Accordion type="single" defaultValue={state === "closed" ? undefined : "build"} collapsible>
        <AccordionItem value="build">
          <AccordionTrigger>{locale === "ko" ? "어떻게 구축하나요?" : "How do we build?"}</AccordionTrigger>
          <AccordionContent>{locale === "ko" ? "제품에서 확인한 문제를 공통 기반으로 정리합니다." : "We turn product lessons into shared foundations."}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="operate" disabled={state === "disabled"}>
          <AccordionTrigger>{locale === "ko" ? "어떻게 운영하나요?" : "How do we operate?"}</AccordionTrigger>
          <AccordionContent>{locale === "ko" ? "직접 운영하며 실패 경로를 확인합니다." : "We operate it directly and inspect failure paths."}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

function DialogDemo({ locale }: ComponentDemoProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{locale === "ko" ? "문의 작성" : "Write inquiry"}</Button>
      </DialogTrigger>
      <DialogContent closeLabel={locale === "ko" ? "문의 닫기" : "Close inquiry"}>
        <DialogHeader>
          <DialogTitle>{locale === "ko" ? "프로젝트 문의" : "Project inquiry"}</DialogTitle>
          <DialogDescription>{locale === "ko" ? "필요한 내용과 연락처를 남겨 주세요." : "Leave the project context and a way to reach you."}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button>{locale === "ko" ? "보내기" : "Send"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TooltipDemo({ locale }: ComponentDemoProps) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <IconControl label={locale === "ko" ? "운영 상태" : "Operational status"}>
            <Info aria-hidden weight="bold" />
          </IconControl>
        </TooltipTrigger>
        <TooltipContent>{locale === "ko" ? "현재 정상 운영 중" : "All systems operational"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export const compositeDemos = {
  select: SelectDemo,
  "dropdown-menu": DropdownMenuDemo,
  tabs: TabsDemo,
  accordion: AccordionDemo,
  dialog: DialogDemo,
  tooltip: TooltipDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>
