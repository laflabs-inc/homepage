"use client"

import { CaretDown, CaretUp, CaretUpDown } from "@phosphor-icons/react"
import { useMemo, useState, type ComponentPropsWithoutRef, type ReactNode } from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"
import styles from "./data-table.module.css"

type SortValue = number | string

export type DataTableColumn<Row> = Readonly<{
  id: string
  header: ReactNode
  cell: (row: Row) => ReactNode
  sortValue?: (row: Row) => SortValue
  align?: "start" | "center" | "end"
}>

export type DataTableProps<Row> = Omit<ComponentPropsWithoutRef<"table">, "children"> & {
  columns: readonly DataTableColumn<Row>[]
  emptyText: string
  getRowKey: (row: Row) => string
  rows: readonly Row[]
}

type SortState = Readonly<{ columnId: string; direction: "ascending" | "descending" }>

function compareValues(left: SortValue, right: SortValue): number {
  if (typeof left === "number" && typeof right === "number") return left - right
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" })
}

export function DataTable<Row>({ columns, emptyText, getRowKey, rows, ...tableProps }: DataTableProps<Row>) {
  const [sort, setSort] = useState<SortState | null>(null)
  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const column = columns.find(({ id }) => id === sort.columnId)
    if (!column?.sortValue) return rows
    const direction = sort.direction === "ascending" ? 1 : -1
    return rows
      .map((row, index) => ({ row, index }))
      .sort((left, right) => {
        const compared = compareValues(column.sortValue!(left.row), column.sortValue!(right.row))
        return compared === 0 ? left.index - right.index : compared * direction
      })
      .map(({ row }) => row)
  }, [columns, rows, sort])

  function toggleSort(columnId: string) {
    setSort((current) => current?.columnId === columnId
      ? { columnId, direction: current.direction === "ascending" ? "descending" : "ascending" }
      : { columnId, direction: "ascending" })
  }

  return (
    <Table {...tableProps}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => {
            const direction = sort?.columnId === column.id ? sort.direction : undefined
            const SortIcon = direction === "ascending" ? CaretUp : direction === "descending" ? CaretDown : CaretUpDown
            return (
              <TableHead
                key={column.id}
                align={column.align}
                aria-sort={column.sortValue ? direction ?? "none" : undefined}
              >
                {column.sortValue ? (
                  <button className={styles.sort} type="button" onClick={() => toggleSort(column.id)}>
                    <span>{column.header}</span>
                    <SortIcon aria-hidden size={14} weight="bold" />
                  </button>
                ) : column.header}
              </TableHead>
            )
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRows.length > 0 ? sortedRows.map((row) => (
          <TableRow key={getRowKey(row)}>
            {columns.map((column) => (
              <TableCell key={column.id} align={column.align}>{column.cell(row)}</TableCell>
            ))}
          </TableRow>
        )) : (
          <TableRow>
            <TableCell className={styles.empty} colSpan={columns.length}>{emptyText}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
