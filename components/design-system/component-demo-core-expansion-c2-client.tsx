"use client"

import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import type { ComponentDemoProps } from "./component-demo-registry"
import styles from "./design-system.module.css"

type ServiceRow = Readonly<{ id: string; latency: number; service: string; status: string }>

export function DataTableDemo({ locale, state }: ComponentDemoProps) {
  const columns: readonly DataTableColumn<ServiceRow>[] = [
    { id: "service", header: locale === "ko" ? "서비스" : "Service", cell: (row) => row.service, sortValue: (row) => row.service },
    { id: "status", header: locale === "ko" ? "상태" : "Status", cell: (row) => row.status },
    { id: "latency", header: locale === "ko" ? "응답" : "Latency", cell: (row) => `${row.latency} ms`, sortValue: (row) => row.latency, align: "end" },
  ]
  const rows: readonly ServiceRow[] = state === "empty" ? [] : [
    { id: "laf-id", service: "Laf ID", status: locale === "ko" ? "정상" : "Ready", latency: 86 },
    { id: "lafetch", service: "lafetch", status: locale === "ko" ? "공개" : "Public", latency: 112 },
  ]

  return (
    <div className={styles.demoCompositeWide}>
      <DataTable
        aria-label={locale === "ko" ? "서비스 응답 상태" : "Service response status"}
        columns={columns}
        emptyText={locale === "ko" ? "표시할 서비스가 없습니다." : "No services to display."}
        getRowKey={(row) => row.id}
        rows={rows}
      />
    </div>
  )
}
