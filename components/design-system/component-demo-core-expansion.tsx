import type { ComponentType } from "react"

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
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox } from "@/components/ui/combobox"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
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
  SidePanelClose,
  SidePanelContent,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
} from "@/components/ui/side-panel"
import { Switch } from "@/components/ui/switch"
import type { DemoKey } from "@/lib/design-system/schema"
import type { ComponentDemoProps } from "./component-demo-registry"
import styles from "./design-system.module.css"

function PopoverDemo({ locale }: ComponentDemoProps) {
  const copy = locale === "ko"
    ? {
        trigger: "필터",
        title: "문서 필터",
        description: "목록에 표시할 상태를 고릅니다.",
        published: "발행됨",
        draft: "초안",
        archived: "보관됨",
        reset: "초기화",
        apply: "적용",
      }
    : {
        trigger: "Filters",
        title: "Document filters",
        description: "Choose which states appear in the list.",
        published: "Published",
        draft: "Draft",
        archived: "Archived",
        reset: "Reset",
        apply: "Apply",
      }

  return (
    <Popover>
      <PopoverTrigger asChild><Button variant="secondary">{copy.trigger}</Button></PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>{copy.title}</PopoverTitle>
          <PopoverDescription>{copy.description}</PopoverDescription>
        </PopoverHeader>
        <div className={styles.demoPopoverOptions}>
          <Checkbox defaultChecked label={copy.published} />
          <Checkbox defaultChecked label={copy.draft} />
          <Checkbox label={copy.archived} />
        </div>
        <div className={styles.demoPopoverActions}>
          <Button size="compact" variant="ghost">{copy.reset}</Button>
          <Button size="compact">{copy.apply}</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SidePanelDemo({ locale, state }: ComponentDemoProps) {
  const side = state === "open" ? "right" : state === "closed" ? "right" : "left"
  const copy = locale === "ko"
    ? {
        trigger: "설정 열기",
        close: "설정 닫기",
        title: "문서 설정",
        description: "공개 범위와 메타데이터를 관리합니다.",
        visibility: "공개 범위",
        public: "전체 공개",
        private: "비공개",
        slug: "문서 주소",
        search: "검색 결과에 표시",
        searchDescription: "공개된 문서를 사이트 검색에 포함합니다.",
        saved: "변경 내용은 자동 저장됩니다.",
        done: "완료",
      }
    : {
        trigger: "Open settings",
        close: "Close settings",
        title: "Document settings",
        description: "Manage visibility and metadata.",
        visibility: "Visibility",
        public: "Public",
        private: "Private",
        slug: "Document address",
        search: "Show in search results",
        searchDescription: "Include the published document in site search.",
        saved: "Changes save automatically.",
        done: "Done",
      }
  return (
    <SidePanel>
      <SidePanelTrigger asChild><Button>{copy.trigger}</Button></SidePanelTrigger>
      <SidePanelContent side={side} closeLabel={copy.close}>
        <SidePanelHeader>
          <SidePanelTitle>{copy.title}</SidePanelTitle>
          <SidePanelDescription>{copy.description}</SidePanelDescription>
        </SidePanelHeader>
        <div className={styles.demoSidePanelBody}>
          <FieldGroup>
            <Field>
              <FieldLabel>{copy.visibility}</FieldLabel>
              <NativeSelect defaultValue="public">
                <option value="public">{copy.public}</option>
                <option value="private">{copy.private}</option>
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel>{copy.slug}</FieldLabel>
              <Input defaultValue="operations-policy" />
            </Field>
            <Switch
              defaultChecked
              description={copy.searchDescription}
              label={copy.search}
            />
          </FieldGroup>
        </div>
        <SidePanelFooter>
          <span>{copy.saved}</span>
          <SidePanelClose asChild><Button size="compact">{copy.done}</Button></SidePanelClose>
        </SidePanelFooter>
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

function InputGroupDemo({ locale, state }: ComponentDemoProps) {
  const invalid = state === "invalid"
  return (
    <div className={styles.demoFormRecipe}>
      <Field>
        <FieldLabel>{locale === "ko" ? "프로젝트 도메인" : "Project domain"}</FieldLabel>
        <InputGroup>
          <InputGroupAddon placement="inline-start"><InputGroupText>https://</InputGroupText></InputGroupAddon>
          <InputGroupInput defaultValue="laflabs.co" />
          <InputGroupAddon placement="inline-end"><InputGroupButton>{locale === "ko" ? "확인" : "Verify"}</InputGroupButton></InputGroupAddon>
        </InputGroup>
      </Field>
      <Field invalid={invalid}>
        <FieldLabel>{locale === "ko" ? "문서 안내" : "Document guidance"}</FieldLabel>
        <InputGroup aria-invalid={invalid || undefined}>
          <InputGroupAddon placement="block-start">
            <InputGroupText>{locale === "ko" ? "마크다운 지원" : "Markdown supported"}</InputGroupText>
          </InputGroupAddon>
          <InputGroupTextarea defaultValue={locale === "ko" ? "변경 내용을 간결하게 적습니다." : "Describe the change concisely."} rows={4} />
          <InputGroupAddon placement="block-end"><InputGroupText>34 / 240</InputGroupText></InputGroupAddon>
        </InputGroup>
        <FieldDescription>
          {locale === "ko" ? "목록에서 먼저 읽히는 안내입니다." : "Shown first in document lists."}
        </FieldDescription>
        {invalid ? (
          <FieldError>{locale === "ko" ? "문서 안내를 확인해 주세요." : "Review the document guidance."}</FieldError>
        ) : null}
      </Field>
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
  popover: PopoverDemo,
  "side-panel": SidePanelDemo,
  combobox: ComboboxDemo,
  "input-group": InputGroupDemo,
  breadcrumb: BreadcrumbDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>
