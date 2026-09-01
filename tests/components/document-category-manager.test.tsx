import { render as renderWithTestingLibrary, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const pageMocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getAdminLocale: vi.fn(),
  listCategories: vi.fn(),
}))

vi.mock("@/app/admin/admin.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: pageMocks.requireAdmin }))
vi.mock("@/lib/admin/locale", () => ({ getAdminLocale: pageMocks.getAdminLocale }))
vi.mock("@/lib/document-categories/service", () => ({
  createDocumentCategoryService: () => ({ list: pageMocks.listCategories }),
}))
vi.mock("@/lib/document-categories/store", () => ({ documentCategoryStore: {} }))

import DocumentCategoriesPage from "@/app/admin/(protected)/documents/categories/page"
import { DocumentCategoryManager } from "@/components/admin/document-category-manager"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import type { DocumentCategorySnapshot } from "@/lib/document-categories/types"

const general: DocumentCategorySnapshot = {
  id: "11111111-1111-4111-8111-111111111111",
  kind: "notice",
  slug: "general",
  labelKo: "일반",
  labelEn: "General",
  sortOrder: 0,
  active: true,
  version: 1,
}

const service: DocumentCategorySnapshot = {
  id: "22222222-2222-4222-8222-222222222222",
  kind: "notice",
  slug: "service",
  labelKo: "서비스",
  labelEn: "Service",
  sortOrder: 1,
  active: true,
  version: 2,
}

const privacy: DocumentCategorySnapshot = {
  id: "33333333-3333-4333-8333-333333333333",
  kind: "legal",
  slug: "privacy",
  labelKo: "개인정보 처리방침",
  labelEn: "Privacy",
  sortOrder: 0,
  active: false,
  version: 4,
}

const categories = [general, service, privacy]

function renderManager(locale: "ko" | "en" = "en") {
  return renderWithTestingLibrary(
    <LocaleProvider initialLocale={locale}>
      <DocumentCategoryManager initialCategories={categories} />
    </LocaleProvider>,
  )
}

function jsonResponse(payload: unknown, status = 200) {
  return Promise.resolve(Response.json(payload, { status }))
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal("fetch", vi.fn(() => jsonResponse({ categories })))
  vi.spyOn(window, "confirm").mockReturnValue(true)
  pageMocks.requireAdmin.mockReset().mockResolvedValue(undefined)
  pageMocks.getAdminLocale.mockReset().mockResolvedValue("en")
  pageMocks.listCategories.mockReset().mockResolvedValue(categories)
})

describe("DocumentCategoryManager", () => {
  it("renders localized category rows, immutable slugs, and active state actions", () => {
    renderManager("ko")

    expect(screen.getByRole("heading", { level: 1, name: "문서 카테고리" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "공지사항" })).toBeInTheDocument()
    expect(screen.getByLabelText("general 한국어 이름")).toHaveValue("일반")
    expect(screen.getByLabelText("general 영어 이름")).toHaveValue("General")
    expect(screen.getByRole("button", { name: "일반 비활성화" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "개인정보 처리방침 활성화" })).toBeInTheDocument()
    expect(screen.getByText("general")).toBeInTheDocument()
  })

  it("creates a category at the end of its selected document kind", async () => {
    const user = userEvent.setup()
    const created = {
      ...general,
      id: "44444444-4444-4444-8444-444444444444",
      slug: "release",
      labelKo: "출시",
      labelEn: "Release",
      sortOrder: 2,
    }
    vi.mocked(fetch).mockImplementationOnce(() => jsonResponse({ category: created }, 201))
    renderManager()
    const createRegion = screen.getByRole("region", { name: "Add a category" })

    await user.selectOptions(within(createRegion).getByLabelText("Document kind"), "notice")
    await user.type(within(createRegion).getByLabelText("Slug"), "Release")
    await user.type(within(createRegion).getByLabelText("Korean label"), "출시")
    await user.type(within(createRegion).getByLabelText("English label"), "Release")
    await user.click(within(createRegion).getByRole("button", { name: "Add category" }))

    expect(fetch).toHaveBeenCalledWith("/api/admin/document-categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "notice",
        slug: "release",
        labelKo: "출시",
        labelEn: "Release",
        sortOrder: 2,
      }),
    })
    expect(await screen.findByRole("status")).toHaveTextContent("Category added.")
    expect(screen.getByLabelText("Korean label for release")).toHaveValue("출시")
  })

  it("saves inline labels with the current version and category state", async () => {
    const user = userEvent.setup()
    const updated = { ...general, labelEn: "Company", version: 2 }
    vi.mocked(fetch).mockImplementationOnce(() => jsonResponse({ category: updated }))
    renderManager()

    const label = screen.getByLabelText("English label for general")
    await user.clear(label)
    await user.type(label, "Company")
    await user.click(screen.getByRole("button", { name: "Save General" }))

    expect(fetch).toHaveBeenCalledWith("/api/admin/document-categories/" + general.id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        labelKo: "일반",
        labelEn: "Company",
        sortOrder: 0,
        active: true,
        version: 1,
      }),
    })
    expect(await screen.findByRole("status")).toHaveTextContent("Category saved.")
  })

  it("confirms before changing whether a category can be assigned", async () => {
    const user = userEvent.setup()
    const updated = { ...general, active: false, version: 2 }
    vi.mocked(fetch).mockImplementationOnce(() => jsonResponse({ category: updated }))
    renderManager()

    await user.click(screen.getByRole("button", { name: "Deactivate General" }))

    expect(window.confirm).toHaveBeenCalledWith(
      "Deactivate General? Existing documents keep this category, but it cannot be assigned to new documents.",
    )
    expect(fetch).toHaveBeenCalledWith("/api/admin/document-categories/" + general.id, expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({
        labelKo: "일반",
        labelEn: "General",
        sortOrder: 0,
        active: false,
        version: 1,
      }),
    }))
  })

  it("reorders a complete kind with keyboard-operable move controls", async () => {
    const user = userEvent.setup()
    const reordered = [
      { ...service, sortOrder: 0, version: 3 },
      { ...general, sortOrder: 1, version: 2 },
    ]
    vi.mocked(fetch).mockImplementationOnce(() => jsonResponse({ categories: reordered }))
    renderManager()

    const list = screen.getByRole("list", { name: "Notice category order" })
    expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent("general")
    await user.click(screen.getByRole("button", { name: "Move Service up" }))

    expect(fetch).toHaveBeenCalledWith("/api/admin/document-categories/reorder", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "notice",
        items: [
          { id: service.id, version: service.version },
          { id: general.id, version: general.version },
        ],
      }),
    })
    await waitFor(() => {
      expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent("service")
    })
  })

  it("refreshes the workspace and explains an optimistic version conflict", async () => {
    const user = userEvent.setup()
    const latest = [{ ...general, labelEn: "Latest label", version: 7 }, service, privacy]
    vi.mocked(fetch)
      .mockImplementationOnce(() => jsonResponse({ error: "version_conflict" }, 409))
      .mockImplementationOnce(() => jsonResponse({ categories: latest }))
    renderManager()

    await user.click(screen.getByRole("button", { name: "Save General" }))

    expect(fetch).toHaveBeenNthCalledWith(2, "/api/admin/document-categories", { cache: "no-store" })
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Categories changed elsewhere. The latest values were loaded; review them and try again.",
    )
    expect(screen.getByLabelText("English label for general")).toHaveValue("Latest label")
  })

  it("protects the server page and supplies category snapshots", async () => {
    renderWithTestingLibrary(
      <LocaleProvider initialLocale="en">
        {await DocumentCategoriesPage()}
      </LocaleProvider>,
    )

    expect(pageMocks.requireAdmin).toHaveBeenCalledOnce()
    expect(pageMocks.listCategories).toHaveBeenCalledWith()
    expect(screen.getByRole("heading", { level: 1, name: "Document categories" })).toBeInTheDocument()
    expect(screen.getByLabelText("English label for general")).toHaveValue("General")
  })
})
