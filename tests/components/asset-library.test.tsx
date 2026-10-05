import { readFileSync } from "node:fs"
import { join } from "node:path"

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const navigationMocks = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => navigationMocks,
}))
vi.mock("@/components/admin/asset-library.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { AssetLibrary, type AdminAssetSummary } from "@/components/admin/asset-library"
import { LocaleProvider } from "@/components/i18n/locale-provider"

const asset: AdminAssetSummary = {
  id: "11111111-1111-4111-8111-111111111111",
  visibility: "public",
  status: "ready",
  originalFilename: "brand.png",
  safeFilename: "brand.png",
  declaredMediaType: "image/png",
  mediaType: "image/png",
  byteSize: 2048,
  width: 1200,
  height: 800,
  checksumSha256: "abc",
  altKo: "브랜드 이미지",
  altEn: "Brand image",
  tags: ["brand"],
  familyId: "22222222-2222-4222-8222-222222222222",
  previousAssetId: null,
  version: 1,
  createdAt: "2026-09-27T00:00:00.000Z",
  updatedAt: "2026-09-27T00:00:00.000Z",
  readyAt: "2026-09-27T00:00:00.000Z",
  archivedAt: null,
  deletedAt: null,
  src: "/media/11111111-1111-4111-8111-111111111111/brand.png",
}

describe("AssetLibrary", () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    navigationMocks.replace.mockReset()
    navigationMocks.refresh.mockReset()
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it("updates immediate filters in the URL and debounces search", async () => {
    render(
      <LocaleProvider initialLocale="en">
        <AssetLibrary assets={[asset]} nextCursor={null} initialFilters={{}} />
      </LocaleProvider>,
    )

    const user = userEvent.setup()
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Status" }),
      "ready",
    )
    expect(navigationMocks.replace).toHaveBeenLastCalledWith("/admin/assets?status=ready")

    await user.type(
      screen.getByRole("searchbox", { name: "Search assets" }),
      "brand",
    )
    expect(navigationMocks.replace).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(navigationMocks.replace).toHaveBeenLastCalledWith("/admin/assets?search=brand&status=ready")
    })
  })

  it("copies the stable delivery path and exposes replacement", async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, "writeText")
    render(
      <LocaleProvider initialLocale="en">
        <AssetLibrary assets={[asset]} nextCursor={null} initialFilters={{}} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Copy path for brand.png" }))
    expect(writeText).toHaveBeenCalledWith(asset.src)
    expect(screen.getByText("Stable path copied.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Replace brand.png" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "View usage for brand.png" })).toBeEnabled()
  })

  it("explains that archiving preserves existing stable delivery paths", async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider initialLocale="en">
        <AssetLibrary assets={[asset]} nextCursor={null} initialFilters={{}} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Archive" }))

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "It will be hidden from new selection while existing stable paths keep working.",
    )
  })

  it("offers permanent cleanup for an interrupted pending upload", () => {
    render(
      <LocaleProvider initialLocale="en">
        <AssetLibrary assets={[{ ...asset, status: "pending", src: null }]} nextCursor={null} initialFilters={{}} />
      </LocaleProvider>,
    )

    expect(screen.getByRole("button", { name: "Cancel upload and delete" })).toBeEnabled()
  })

  it("uses an explicit single-column mobile contract without horizontal overflow", () => {
    render(
      <LocaleProvider initialLocale="ko">
        <AssetLibrary assets={[asset]} nextCursor={null} initialFilters={{}} />
      </LocaleProvider>,
    )

    expect(screen.getByTestId("asset-library")).toHaveAttribute("data-mobile-layout", "single-column")
    expect(screen.getByRole("heading", { name: "미디어 라이브러리" })).toBeInTheDocument()
  })

  it("edits bilingual metadata through the protected asset endpoint", async () => {
    const user = userEvent.setup()
    const updated = { ...asset, altKo: "새 한국어 설명", tags: ["brand", "hero"] }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ asset: updated }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }))
    vi.stubGlobal("fetch", fetchMock)
    render(
      <LocaleProvider initialLocale="en">
        <AssetLibrary assets={[asset]} nextCursor={null} initialFilters={{}} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Edit brand.png" }))
    const metadataDialog = screen.getByRole("dialog", { name: "Edit metadata" })
    expect(metadataDialog.querySelector("[data-dialog-body]")).toContainElement(
      screen.getByRole("textbox", { name: "Korean alternative text" }),
    )
    const koreanAlt = screen.getByRole("textbox", { name: "Korean alternative text" })
    await user.clear(koreanAlt)
    await user.type(koreanAlt, "새 한국어 설명")
    const tags = screen.getByRole("textbox", { name: "Tags" })
    await user.clear(tags)
    await user.type(tags, "brand, hero")
    await user.click(screen.getByRole("button", { name: "Save metadata" }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      `/api/admin/assets/${asset.id}`,
      expect.objectContaining({ method: "PATCH" }),
    ))
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual({
      altKo: "새 한국어 설명",
      altEn: "Brand image",
      tags: ["brand", "hero"],
    })
    expect(await screen.findByText("Metadata saved.")).toBeInTheDocument()
  })

  it("uses the recommended StatusLabel tone API", () => {
    const source = readFileSync(
      join(process.cwd(), "components/admin/asset-library.tsx"),
      "utf8",
    )

    expect(source).not.toContain('StatusLabelProps["variant"]')
    expect(source).not.toMatch(/<StatusLabel[\s\S]{0,180}\bvariant=/)
  })

  it("shows linked document usage in a focused dialog", async () => {
    const user = userEvent.setup()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      references: [{
        revisionId: "33333333-3333-4333-8333-333333333333",
        kind: "notice",
        locale: "ko",
        title: "서비스 공지",
        status: "draft",
        field: "body_markdown",
        updatedAt: "2026-09-29T10:00:00.000Z",
      }],
    }), { status: 200, headers: { "content-type": "application/json" } })))
    render(
      <LocaleProvider initialLocale="en">
        <AssetLibrary assets={[asset]} nextCursor={null} initialFilters={{}} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole("button", { name: "View usage for brand.png" }))

    const dialog = await screen.findByRole("dialog", { name: "Document usage" })
    expect(dialog).toHaveTextContent("서비스 공지")
    expect(dialog).toHaveTextContent("KO · Draft")
    expect(screen.getByRole("link", { name: "Open 서비스 공지" })).toHaveAttribute(
      "href",
      "/admin/documents/33333333-3333-4333-8333-333333333333",
    )
  })

  it("opens usage guidance when deletion is blocked by references", async () => {
    const user = userEvent.setup()
    const archived = { ...asset, status: "archived" as const }
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "DELETE") {
        return new Response(JSON.stringify({ error: "asset_referenced" }), {
          status: 409,
          headers: { "content-type": "application/json" },
        })
      }
      return new Response(JSON.stringify({ references: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    }))
    render(
      <LocaleProvider initialLocale="en">
        <AssetLibrary assets={[archived]} nextCursor={null} initialFilters={{}} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Delete permanently" }))
    await user.click(screen.getByRole("button", { name: "Delete permanently" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Review Document usage")
    expect(await screen.findByRole("dialog", { name: "Document usage" })).toBeInTheDocument()
  })
})
