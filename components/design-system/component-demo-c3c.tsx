import { CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr"
import type { ComponentType } from "react"

import {
  Alert,
  AlertAction,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Spinner } from "@/components/ui/spinner"
import { StatusLabel } from "@/components/ui/status-label"
import type { DemoKey } from "@/lib/design-system/schema"
import { ToastDemo } from "./component-demo-c3c-client"
import type { ComponentDemoProps } from "./component-demo-registry"
import styles from "./design-system.module.css"

function PaginationDemo({ locale, state }: ComponentDemoProps) {
  const boundary = state === "boundary"
  return (
    <Pagination aria-label={locale === "ko" ? "문서 목록 페이지" : "Document list pages"}>
      <PaginationContent>
        <PaginationItem><PaginationPrevious disabled={boundary} href={boundary ? undefined : "?page=1"} label={locale === "ko" ? "이전 페이지" : "Previous page"} /></PaginationItem>
        <PaginationItem><PaginationLink href="?page=1">1</PaginationLink></PaginationItem>
        <PaginationItem><PaginationLink href="?page=2" isCurrent>2</PaginationLink></PaginationItem>
        {state === "collapsed" ? <PaginationItem><PaginationEllipsis label={locale === "ko" ? "생략된 페이지" : "More pages"} /></PaginationItem> : null}
        <PaginationItem><PaginationLink href="?page=3">3</PaginationLink></PaginationItem>
        <PaginationItem><PaginationNext href="?page=3" label={locale === "ko" ? "다음 페이지" : "Next page"} /></PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function DialogDemo({ locale }: ComponentDemoProps) {
  return (
    <Dialog>
      <DialogTrigger asChild><Button>{locale === "ko" ? "문서 설정" : "Document settings"}</Button></DialogTrigger>
      <DialogContent closeLabel={locale === "ko" ? "설정 닫기" : "Close settings"} scroll="body" size="medium">
        <DialogHeader>
          <DialogTitle>{locale === "ko" ? "문서 설정" : "Document settings"}</DialogTitle>
          <DialogDescription>{locale === "ko" ? "목록에 표시할 정보를 수정합니다." : "Update the information shown in the list."}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel htmlFor="c3c-dialog-slug">{locale === "ko" ? "슬러그" : "Slug"}</FieldLabel>
            <Input defaultValue="design-system-update" id="c3c-dialog-slug" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild><Button variant="secondary">{locale === "ko" ? "취소" : "Cancel"}</Button></DialogClose>
          <DialogClose asChild><Button>{locale === "ko" ? "저장" : "Save"}</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AlertDialogDemo({ locale }: ComponentDemoProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="danger">{locale === "ko" ? "문서 보관" : "Archive document"}</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{locale === "ko" ? "문서를 보관할까요?" : "Archive this document?"}</AlertDialogTitle>
          <AlertDialogDescription>{locale === "ko" ? "공개 목록에서 즉시 내려갑니다." : "It will leave the public list immediately."}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogBody>{locale === "ko" ? "보관함에서 다시 초안으로 돌릴 수 있습니다." : "You can return it to draft from the archive."}</AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel>{locale === "ko" ? "취소" : "Cancel"}</AlertDialogCancel>
          <AlertDialogAction variant="destructive">{locale === "ko" ? "보관" : "Archive"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function SpinnerDemo({ locale, state }: ComponentDemoProps) {
  const size = state === "compact" || state === "large" ? state : "default"
  return (
    <Button disabled>
      <Spinner label={locale === "ko" ? "문서 저장 중" : "Saving document"} size={size} />
      {locale === "ko" ? "저장 중" : "Saving"}
    </Button>
  )
}

function AlertDemo({ locale, state }: ComponentDemoProps) {
  const error = state === "error" || state === "live"
  return (
    <Alert live={state === "live"} variant={error ? "error" : "success"}>
      <AlertIcon>{error ? <WarningCircle size={20} weight="bold" /> : <CheckCircle size={20} weight="bold" />}</AlertIcon>
      <AlertContent>
        <AlertTitle>{error ? (locale === "ko" ? "발행하지 못했습니다" : "Could not publish") : (locale === "ko" ? "발행 준비가 끝났습니다" : "Ready to publish")}</AlertTitle>
        <AlertDescription>{locale === "ko" ? "제목과 공개 날짜를 한 번 더 확인해 주세요." : "Check the title and publication date once more."}</AlertDescription>
      </AlertContent>
      <AlertAction><Button size="compact" variant="secondary">{locale === "ko" ? "검토" : "Review"}</Button></AlertAction>
    </Alert>
  )
}

function StatusLabelDemo({ locale, state }: ComponentDemoProps) {
  const tones = ["neutral", "info", "success", "warning", "error"] as const
  const selected = tones.includes(state as (typeof tones)[number]) ? state as (typeof tones)[number] : undefined
  const labels = locale === "ko"
    ? { neutral: "초안", info: "검토 중", success: "발행됨", warning: "확인 필요", error: "발행 실패" }
    : { neutral: "Draft", info: "In review", success: "Published", warning: "Needs review", error: "Publish failed" }
  const visible = selected ? [selected] : tones

  return <div className={styles.demoC3cStatuses}>{visible.map((tone) => <StatusLabel key={tone} tone={tone}>{labels[tone]}</StatusLabel>)}</div>
}

export const coreUiC3CDemos = {
  dialog: DialogDemo,
  "alert-dialog": AlertDialogDemo,
  pagination: PaginationDemo,
  spinner: SpinnerDemo,
  toast: ToastDemo,
  alert: AlertDemo,
  "status-label": StatusLabelDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>
