import type { ComponentType } from "react"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { StatusLabel } from "@/components/ui/status-label"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { DemoKey } from "@/lib/design-system/schema"
import { DataTableDemo } from "./component-demo-core-expansion-c2-client"
import type { ComponentDemoProps } from "./component-demo-registry"
import styles from "./design-system.module.css"

function TableDemo({ locale }: ComponentDemoProps) {
  return (
    <div className={styles.demoCompositeWide}>
      <Table aria-label={locale === "ko" ? "최근 배포" : "Recent deployments"}>
        <TableCaption>{locale === "ko" ? "최근 운영 환경 배포" : "Recent production deployments"}</TableCaption>
        <TableHeader><TableRow><TableHead>{locale === "ko" ? "서비스" : "Service"}</TableHead><TableHead>{locale === "ko" ? "상태" : "Status"}</TableHead><TableHead align="end">Commit</TableHead></TableRow></TableHeader>
        <TableBody>
          <TableRow><TableCell>Laf ID</TableCell><TableCell>{locale === "ko" ? "정상" : "Ready"}</TableCell><TableCell align="end">8c2a4f</TableCell></TableRow>
          <TableRow><TableCell>lafetch</TableCell><TableCell>{locale === "ko" ? "공개" : "Public"}</TableCell><TableCell align="end">2f7d11</TableCell></TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

function ItemDemo({ locale, state }: ComponentDemoProps) {
  const tone = state === "inverse" ? "inverse" : state === "subtle" ? "subtle" : "default"
  return (
    <div className={styles.demoCompositeWide}>
      <Item aria-labelledby="demo-lafetch-title" tone={tone}>
        <ItemMedia aria-hidden>LF</ItemMedia>
        <ItemContent>
          <ItemTitle id="demo-lafetch-title">lafetch</ItemTitle>
          <ItemDescription>{locale === "ko" ? "여러 제품에서 함께 쓰는 typed fetch 유틸리티입니다." : "Typed fetch utilities shared across products."}</ItemDescription>
          <ItemFooter>TypeScript · MIT</ItemFooter>
        </ItemContent>
        <ItemActions><StatusLabel variant="success">{locale === "ko" ? "공개" : "Public"}</StatusLabel></ItemActions>
      </Item>
    </div>
  )
}

function ProgressDemo({ locale, state }: ComponentDemoProps) {
  return (
    <div className={styles.demoCompositeWide}>
      <Progress
        label={locale === "ko" ? "에셋 업로드" : "Asset upload"}
        showValue={state !== "indeterminate"}
        value={state === "indeterminate" ? undefined : 64}
      />
    </div>
  )
}

export const coreExpansionC2Demos = {
  table: TableDemo,
  "data-table": DataTableDemo,
  item: ItemDemo,
  progress: ProgressDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>
