import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  AdminPage,
  AdminPageHeader,
  AdminSection,
  AdminToolbar,
} from "@/components/admin/admin-page"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Panel } from "@/components/ui/panel"

describe("Admin page composition", () => {
  it("keeps one page heading with optional supporting regions", () => {
    render(
      <AdminPage className="page-extension" data-testid="admin-page">
        <AdminPageHeader
          eyebrow="Content / Documents"
          title="Documents"
          description="Create and publish company documents."
          breadcrumbs={<nav aria-label="Breadcrumb">Home</nav>}
          actions={<Button variant="primary">New document</Button>}
        />
        <AdminToolbar label="Document controls" data-testid="toolbar">
          <Field><FieldLabel>Search</FieldLabel><input /></Field>
        </AdminToolbar>
        <AdminSection
          title="Published documents"
          description="Publicly visible entries."
          actions={<Button variant="secondary">Export</Button>}
          data-testid="section"
        >
          <Panel data-testid="panel">Collection</Panel>
        </AdminSection>
      </AdminPage>,
    )

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(screen.getByRole("heading", { level: 1, name: "Documents" })).toBeInTheDocument()
    expect(screen.getByText("Create and publish company documents.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "New document" })).toHaveAttribute("data-variant", "primary")
    expect(screen.getByRole("region", { name: "Document controls" })).toBe(screen.getByTestId("toolbar"))
    expect(screen.getByRole("heading", { level: 2, name: "Published documents" })).toBeInTheDocument()
    expect(screen.getByTestId("section")).toHaveAccessibleName("Published documents")
    expect(screen.getByTestId("admin-page")).toHaveClass("page-extension")
    expect(screen.getByTestId("panel")).toHaveAttribute("data-tone", "default")
    expect(screen.getByText("Search")).toBeInTheDocument()
  })

  it("renders minimal page and section composition without empty wrappers", () => {
    const { container } = render(
      <AdminPage>
        <AdminPageHeader title="Media" />
        <AdminSection>Assets</AdminSection>
      </AdminPage>,
    )

    expect(screen.getByRole("heading", { level: 1, name: "Media" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument()
    expect(container.querySelectorAll("section")).toHaveLength(2)
  })
})
