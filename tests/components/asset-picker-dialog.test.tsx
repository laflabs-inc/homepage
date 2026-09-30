import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/admin/asset-picker-dialog.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/components/admin/asset-library.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { AssetPickerDialog } from "@/components/admin/asset-picker-dialog"
import { LocaleProvider } from "@/components/i18n/locale-provider"

const asset = {
  id: "11111111-1111-4111-8111-111111111111",
  visibility: "public" as const,
  status: "ready" as const,
  originalFilename: "architecture.png",
  safeFilename: "architecture.png",
  declaredMediaType: "image/png",
  mediaType: "image/png" as const,
  byteSize: 100,
  width: 800,
  height: 600,
  checksumSha256: "abc",
  altKo: "시스템 구조",
  altEn: "System architecture",
  tags: ["architecture"],
  familyId: "11111111-1111-4111-8111-111111111111",
  previousAssetId: null,
  version: 1,
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
  readyAt: "2026-09-29T00:00:00.000Z",
  archivedAt: null,
  deletedAt: null,
  src: "/media/11111111-1111-4111-8111-111111111111/architecture.png",
}

describe("AssetPickerDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).startsWith("/api/admin/assets?")) {
        return new Response(JSON.stringify({ assets: [asset], nextCursor: null }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      }
      return new Response(JSON.stringify({ asset }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    }))
  })

  it("loads ready assets, prefills localized alt text, and returns only the stable reference", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <LocaleProvider initialLocale="en">
        <AssetPickerDialog open onOpenChange={vi.fn()} documentLocale="ko" onSelect={onSelect} />
      </LocaleProvider>,
    )

    await user.click(await screen.findByRole("button", { name: "architecture.png" }))
    expect(screen.getByRole("textbox", { name: "Alternative text" })).toHaveValue("시스템 구조")
    await user.click(screen.getByRole("button", { name: "Insert image" }))

    expect(onSelect).toHaveBeenCalledWith({ src: asset.src, alt: "시스템 구조" })
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("status=ready"), expect.any(Object))
  })

  it("updates the current-locale alt text before insertion when it changes", async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider initialLocale="en">
        <AssetPickerDialog open onOpenChange={vi.fn()} documentLocale="en" onSelect={vi.fn()} />
      </LocaleProvider>,
    )

    await user.click(await screen.findByRole("button", { name: "architecture.png" }))
    const alt = screen.getByRole("textbox", { name: "Alternative text" })
    await user.clear(alt)
    await user.type(alt, "Updated architecture")
    await user.click(screen.getByRole("button", { name: "Insert image" }))

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      `/api/admin/assets/${asset.id}`,
      expect.objectContaining({ method: "PATCH" }),
    ))
  })
})
