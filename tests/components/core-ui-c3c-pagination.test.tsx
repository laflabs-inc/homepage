import { createRef } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

describe("Pagination", () => {
  it("does not synthesize event handlers for server-rendered direction links", () => {
    const previous = PaginationPrevious({ href: "?page=1", label: "Previous page" })
    const next = PaginationNext({ disabled: true, href: "?page=3", label: "Next page" })

    expect(previous.props.onClick).toBeUndefined()
    expect(next.props.onClick).toBeUndefined()
  })

  it("renders a connected current-page rail with real navigation links", () => {
    render(
      <Pagination aria-label="Notice pages">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="?page=1" label="Previous page">Previous</PaginationPrevious>
          </PaginationItem>
          <PaginationItem><PaginationLink href="?page=1">1</PaginationLink></PaginationItem>
          <PaginationItem><PaginationLink href="?page=2" isCurrent>2</PaginationLink></PaginationItem>
          <PaginationItem><PaginationEllipsis label="More pages" /></PaginationItem>
          <PaginationItem>
            <PaginationNext href="?page=3" label="Next page">Next</PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    )

    const navigation = screen.getByRole("navigation", { name: "Notice pages" })
    const rail = within(navigation).getByRole("list")

    expect(rail).toHaveAttribute("data-pagination-rail")
    expect(within(navigation).getByRole("link", { name: "Previous page" })).toHaveAttribute("href", "?page=1")
    expect(within(navigation).getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page")
    expect(within(navigation).getByRole("link", { name: "Next page" })).toHaveAttribute("href", "?page=3")
    expect(within(navigation).getByLabelText("More pages")).toBeInTheDocument()
  })

  it("keeps a disabled boundary visible without exposing a destination", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <Pagination aria-label="First result page">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious disabled href="?page=0" label="Previous page" onClick={onClick}>
              Previous
            </PaginationPrevious>
          </PaginationItem>
          <PaginationItem><PaginationLink href="?page=1" isCurrent>1</PaginationLink></PaginationItem>
        </PaginationContent>
      </Pagination>,
    )

    const previous = screen.getByLabelText("Previous page")
    expect(previous).toHaveAttribute("aria-disabled", "true")
    expect(previous).not.toHaveAttribute("href")

    await user.click(previous)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("preserves caller-provided native anchor props and refs", () => {
    const ref = createRef<HTMLAnchorElement>()

    render(
      <PaginationLink ref={ref} href="?page=4" rel="next" target="_self">
        4
      </PaginationLink>,
    )

    const link = screen.getByRole("link", { name: "4" })
    expect(ref.current).toBe(link)
    expect(link).toHaveAttribute("rel", "next")
    expect(link).toHaveAttribute("target", "_self")
  })
})
