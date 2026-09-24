import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { NoticeToastProvider, useNoticeToast } from "@/components/ui/notice-toast"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

describe("Table", () => {
  it("preserves native table structure inside a horizontally scrollable surface", () => {
    render(
      <Table aria-label="Deployments">
        <TableCaption>Recent production deployments</TableCaption>
        <TableHeader>
          <TableRow><TableHead>Service</TableHead><TableHead>Status</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          <TableRow><TableCell>Laf ID</TableCell><TableCell>Ready</TableCell></TableRow>
        </TableBody>
      </Table>,
    )

    const table = screen.getByRole("table", { name: "Deployments" })
    expect(table.parentElement).toHaveAttribute("data-table-scroll")
    expect(within(table).getByRole("columnheader", { name: "Service" })).toHaveAttribute("scope", "col")
    expect(within(table).getByText("Recent production deployments")).toBeInTheDocument()
  })
})

type Deployment = Readonly<{ id: string; service: string; latency: number }>

const deploymentColumns: readonly DataTableColumn<Deployment>[] = [
  {
    id: "service",
    header: "Service",
    cell: (row) => row.service,
    sortValue: (row) => row.service,
  },
  {
    id: "latency",
    header: "Latency",
    cell: (row) => `${row.latency} ms`,
    sortValue: (row) => row.latency,
    align: "end",
  },
]

describe("DataTable", () => {
  it("sorts a real data set and reports the active column direction", async () => {
    const user = userEvent.setup()
    render(
      <DataTable
        aria-label="Service latency"
        columns={deploymentColumns}
        emptyText="No deployments"
        getRowKey={(row) => row.id}
        rows={[
          { id: "pay", service: "Laf Pay", latency: 180 },
          { id: "id", service: "Laf ID", latency: 90 },
        ]}
      />,
    )

    const table = screen.getByRole("table", { name: "Service latency" })
    const latencyHeader = within(table).getByRole("columnheader", { name: /Latency/ })
    await user.click(within(latencyHeader).getByRole("button"))

    expect(latencyHeader).toHaveAttribute("aria-sort", "ascending")
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("Laf ID")

    await user.click(within(latencyHeader).getByRole("button"))
    expect(latencyHeader).toHaveAttribute("aria-sort", "descending")
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("Laf Pay")
  })

  it("spans every column with a readable empty state", () => {
    render(
      <DataTable
        aria-label="Service latency"
        columns={deploymentColumns}
        emptyText="No deployments"
        getRowKey={(row) => row.id}
        rows={[]}
      />,
    )

    expect(screen.getByText("No deployments")).toHaveAttribute("colspan", "2")
  })
})

describe("Pagination", () => {
  it("identifies the current page and keeps navigation links explicit", () => {
    render(
      <Pagination aria-label="Notice pages">
        <PaginationContent>
          <PaginationItem><PaginationPrevious href="?page=1" label="Previous page">Previous</PaginationPrevious></PaginationItem>
          <PaginationItem><PaginationLink href="?page=1">1</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink href="?page=2" isCurrent>2</PaginationLink></PaginationItem>
          <PaginationItem><PaginationEllipsis label="More pages" /></PaginationItem>
          <PaginationItem><PaginationNext href="?page=3" label="Next page">Next</PaginationNext></PaginationItem>
        </PaginationContent>
      </Pagination>,
    )

    const navigation = screen.getByRole("navigation", { name: "Notice pages" })
    expect(within(navigation).getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page")
    expect(within(navigation).getByRole("link", { name: "Previous page" })).toHaveAttribute("href", "?page=1")
    expect(within(navigation).getByLabelText("More pages")).toBeInTheDocument()
  })
})

describe("Item", () => {
  it("composes a labelled list item without losing nested actions", () => {
    render(
      <ul>
        <Item as="li" aria-labelledby="lafetch-title" tone="subtle">
          <ItemMedia aria-hidden>LF</ItemMedia>
          <ItemContent>
            <ItemHeader><ItemTitle id="lafetch-title">lafetch</ItemTitle></ItemHeader>
            <ItemDescription>Typed fetch utilities for shared clients.</ItemDescription>
            <ItemFooter>TypeScript</ItemFooter>
          </ItemContent>
          <ItemActions><button type="button">Open repository</button></ItemActions>
        </Item>
      </ul>,
    )

    const item = screen.getByRole("listitem", { name: "lafetch" })
    expect(item).toHaveAttribute("data-tone", "subtle")
    expect(within(item).getByRole("button", { name: "Open repository" })).toBeInTheDocument()
    expect(within(item).getByText("TypeScript")).toBeInTheDocument()
  })
})

describe("Spinner", () => {
  it("announces compact loading without exposing its icon", () => {
    render(<Spinner label="Saving document" size="compact" />)

    const spinner = screen.getByRole("status", { name: "Saving document" })
    expect(spinner).toHaveAttribute("data-size", "compact")
    expect(spinner.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })
})

describe("Progress", () => {
  it("shows determinate native progress and its numeric value", () => {
    render(<Progress label="Upload" max={200} showValue value={50} />)

    const progress = screen.getByRole("progressbar", { name: "Upload" })
    expect(progress).toHaveAttribute("value", "50")
    expect(progress).toHaveAttribute("max", "200")
    expect(screen.getByText("25%", { selector: "output" })).toBeInTheDocument()
  })

  it("keeps indeterminate progress free of a false numeric value", () => {
    render(<Progress label="Connecting" />)

    expect(screen.getByRole("progressbar", { name: "Connecting" })).not.toHaveAttribute("value")
  })
})

function ToastTrigger() {
  const { notify } = useNoticeToast()
  return (
    <button
      type="button"
      onClick={() => notify({
        title: "Document published",
        description: "The public page is now available.",
        variant: "success",
        duration: 0,
      })}
    >
      Publish
    </button>
  )
}

describe("NoticeToast", () => {
  it("queues a transient notice and lets the user dismiss it", async () => {
    const user = userEvent.setup()
    render(
      <NoticeToastProvider closeLabel="Dismiss notice" viewportLabel="Notifications">
        <ToastTrigger />
      </NoticeToastProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Publish" }))
    const viewport = screen.getByRole("region", { name: "Notifications" })
    expect(within(viewport).getByRole("status")).toHaveTextContent("Document published")
    expect(within(viewport).getByText("The public page is now available.")).toBeInTheDocument()

    await user.click(within(viewport).getByRole("button", { name: "Dismiss notice" }))
    expect(screen.queryByText("Document published")).not.toBeInTheDocument()
  })
})
