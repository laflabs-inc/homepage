import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Panel,
  PanelAction,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel"
import { Alert, AlertAction } from "@/components/ui/alert"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusLabel } from "@/components/ui/status-label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { RecipeDemoProps } from "./recipe-demo-registry"
import styles from "./recipe-demos.module.css"

function LoadingState({ locale }: Pick<RecipeDemoProps, "locale">) {
  const label = locale === "ko" ? "문서 목록 불러오는 중" : "Loading document list"
  return (
    <div aria-label={label} className={styles.loadingRows} role="status">
      <Skeleton />
      <Skeleton />
      <Skeleton />
    </div>
  )
}

function PopulatedState({ locale }: Pick<RecipeDemoProps, "locale">) {
  const rows = locale === "ko"
    ? [
        { title: "운영 정책", status: "발행됨", tone: "success" as const, updated: "2026-10-07" },
        { title: "릴리스 안내", status: "초안", tone: "neutral" as const, updated: "2026-10-06" },
      ]
    : [
        { title: "Operations policy", status: "Published", tone: "success" as const, updated: "2026-10-07" },
        { title: "Release notes", status: "Draft", tone: "neutral" as const, updated: "2026-10-06" },
      ]

  return (
    <>
      <div className={styles.collectionTable}>
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{locale === "ko" ? "문서" : "Document"}</TableHead>
            <TableHead>{locale === "ko" ? "상태" : "Status"}</TableHead>
            <TableHead>{locale === "ko" ? "수정일" : "Updated"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{locale === "ko" ? "운영 정책" : "Operations policy"}</TableCell>
            <TableCell><StatusLabel tone="success">{locale === "ko" ? "발행됨" : "Published"}</StatusLabel></TableCell>
            <TableCell>2026-10-07</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{locale === "ko" ? "릴리스 안내" : "Release notes"}</TableCell>
            <TableCell><StatusLabel>{locale === "ko" ? "초안" : "Draft"}</StatusLabel></TableCell>
            <TableCell>2026-10-06</TableCell>
          </TableRow>
        </TableBody>
        </Table>
      </div>
      <div className={styles.mobileCollection}>
        {rows.map((row) => (
          <Item key={row.title}>
            <ItemContent>
              <ItemTitle>{row.title}</ItemTitle>
              <ItemDescription>{locale === "ko" ? `수정일 ${row.updated}` : `Updated ${row.updated}`}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <StatusLabel tone={row.tone}>{row.status}</StatusLabel>
            </ItemActions>
          </Item>
        ))}
      </div>
      <Pagination aria-label={locale === "ko" ? "문서 목록 페이지" : "Document list pages"}>
        <PaginationContent>
          <PaginationItem><PaginationPrevious disabled href="#" label={locale === "ko" ? "이전 페이지" : "Previous page"}>{locale === "ko" ? "이전" : "Previous"}</PaginationPrevious></PaginationItem>
          <PaginationItem><PaginationLink href="#" isCurrent>1</PaginationLink></PaginationItem>
          <PaginationItem><PaginationNext href="#" label={locale === "ko" ? "다음 페이지" : "Next page"}>{locale === "ko" ? "다음" : "Next"}</PaginationNext></PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  )
}

export function CollectionStateSurfaceDemo({ locale, state = "loading" }: RecipeDemoProps) {
  const labels = locale === "ko"
    ? {
        title: "문서 목록",
        description: "공개 상태와 최근 수정일을 확인합니다.",
        create: "문서 만들기",
        emptyTitle: "표시할 문서가 없습니다.",
        emptyDescription: "첫 문서를 만들면 이 목록에 표시됩니다.",
        errorTitle: "문서 목록을 불러오지 못했습니다.",
        errorDescription: "연결을 확인한 뒤 다시 시도해 주세요.",
        retry: "다시 시도",
        stateNames: { loading: "불러오는 중", populated: "결과 있음", empty: "비어 있음", error: "오류" },
      }
    : {
        title: "Documents",
        description: "Review publication status and recent updates.",
        create: "Create document",
        emptyTitle: "No documents to show.",
        emptyDescription: "Create the first document to add it to this list.",
        errorTitle: "Could not load the document list.",
        errorDescription: "Check the connection and try again.",
        retry: "Try again",
        stateNames: { loading: "loading", populated: "populated", empty: "empty", error: "error" },
      }

  return (
    <Panel
      aria-label={`${labels.stateNames[state as keyof typeof labels.stateNames]} ${locale === "ko" ? "문서 목록" : "document collection"}`}
      className={styles.collectionSurface}
    >
      <PanelHeader>
        <div>
          <PanelTitle>{labels.title}</PanelTitle>
          <PanelDescription>{labels.description}</PanelDescription>
        </div>
        {state === "populated" ? <PanelAction><Button size="compact">{labels.create}</Button></PanelAction> : null}
      </PanelHeader>
      <PanelContent className={styles.collectionContent}>
        {state === "loading" ? <LoadingState locale={locale} /> : null}
        {state === "populated" ? <PopulatedState locale={locale} /> : null}
        {state === "empty" ? (
          <EmptyState
            action={<Button>{labels.create}</Button>}
            description={labels.emptyDescription}
            title={labels.emptyTitle}
          />
        ) : null}
        {state === "error" ? (
          <Alert title={labels.errorTitle} variant="error">
            {labels.errorDescription}
            <AlertAction><Button variant="secondary">{labels.retry}</Button></AlertAction>
          </Alert>
        ) : null}
      </PanelContent>
    </Panel>
  )
}
