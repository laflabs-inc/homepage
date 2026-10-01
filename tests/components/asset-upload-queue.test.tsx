import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const uploadMocks = vi.hoisted(() => ({ uploadStagedAsset: vi.fn() }))

vi.mock("@/lib/assets/client-upload", () => uploadMocks)
vi.mock("@/components/admin/asset-library.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { AssetUploadQueue } from "@/components/admin/asset-upload-queue"
import { LocaleProvider } from "@/components/i18n/locale-provider"

const readyAsset = {
  id: "11111111-1111-4111-8111-111111111111",
  visibility: "public" as const,
  status: "ready" as const,
  originalFilename: "brand.png",
  safeFilename: "brand.png",
  declaredMediaType: "image/png",
  mediaType: "image/png" as const,
  byteSize: 68,
  width: 1,
  height: 1,
  checksumSha256: "abc",
  altKo: null,
  altEn: null,
  tags: [],
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

describe("AssetUploadQueue", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    uploadMocks.uploadStagedAsset.mockReset().mockImplementation(async ({ onProgress }) => {
      onProgress?.({ loaded: 68, total: 68, percentage: 100 })
    })
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith("/api/admin/assets/intents")) {
        return new Response(JSON.stringify({
          intent: {
            assetId: readyAsset.id,
            pathname: `staging/${readyAsset.id}/33333333-3333-4333-8333-333333333333`,
            acceptedTypes: ["image/png"],
            maxBytes: 10 * 1024 * 1024,
          },
        }), { status: 201, headers: { "content-type": "application/json" } })
      }
      if (url.endsWith(`/${readyAsset.id}/finalize`)) {
        return new Response(JSON.stringify({ asset: readyAsset }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      }
      if (url.endsWith(`/api/admin/assets/${readyAsset.id}`) && init?.method === "DELETE") {
        return new Response(JSON.stringify({ asset: { ...readyAsset, status: "deleted" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      }
      return new Response(JSON.stringify({ error: "unavailable" }), { status: 503 })
    }))
  })

  it("keeps mixed upload results independent", async () => {
    const user = userEvent.setup({ applyAccept: false })
    const onReady = vi.fn()
    render(
      <LocaleProvider initialLocale="en">
        <AssetUploadQueue onReady={onReady} />
      </LocaleProvider>,
    )

    const validPng = new File([new Uint8Array(68)], "brand.png", { type: "image/png" })
    const invalidGif = new File(["gif"], "motion.gif", { type: "image/gif" })
    await user.upload(screen.getByLabelText("Upload images", { selector: "input" }), [validPng, invalidGif])

    expect(await screen.findByText("Ready")).toBeInTheDocument()
    expect(screen.getByText("Unsupported file type")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remove failed upload" })).toBeEnabled()
    expect(onReady).toHaveBeenCalledWith(readyAsset)
    expect(uploadMocks.uploadStagedAsset).toHaveBeenCalledTimes(1)
  })

  it("can remove one failed upload without clearing completed rows", async () => {
    const user = userEvent.setup({ applyAccept: false })
    render(
      <LocaleProvider initialLocale="en">
        <AssetUploadQueue onReady={vi.fn()} />
      </LocaleProvider>,
    )

    await user.upload(screen.getByLabelText("Upload images", { selector: "input" }), [
      new File([new Uint8Array(68)], "brand.png", { type: "image/png" }),
      new File(["gif"], "motion.gif", { type: "image/gif" }),
    ])
    expect(await screen.findByText("Ready")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Remove failed upload" }))
    await waitFor(() => expect(screen.queryByText("motion.gif")).not.toBeInTheDocument())
    expect(screen.getByText("brand.png")).toBeInTheDocument()
  })

  it("deletes the pending server record when a staged upload fails", async () => {
    const user = userEvent.setup()
    uploadMocks.uploadStagedAsset.mockRejectedValueOnce(new Error("provider unavailable"))
    render(
      <LocaleProvider initialLocale="en">
        <AssetUploadQueue onReady={vi.fn()} />
      </LocaleProvider>,
    )

    await user.upload(
      screen.getByLabelText("Upload images", { selector: "input" }),
      new File([new Uint8Array(68)], "brand.png", { type: "image/png" }),
    )
    await screen.findByText("Upload failed. Try again.")
    await user.click(screen.getByRole("button", { name: "Remove failed upload" }))

    await waitFor(() => expect(screen.queryByText("brand.png")).not.toBeInTheDocument())
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      `/api/admin/assets/${readyAsset.id}`,
      expect.objectContaining({ method: "DELETE" }),
    )
  })

  it("sends the replacement target and limits the picker to one file", async () => {
    const user = userEvent.setup()
    render(
      <LocaleProvider initialLocale="en">
        <AssetUploadQueue
          replaceAssetId="22222222-2222-4222-8222-222222222222"
          multiple={false}
          onReady={vi.fn()}
        />
      </LocaleProvider>,
    )

    const input = screen.getByLabelText("Upload images", { selector: "input" })
    expect(input).not.toHaveAttribute("multiple")
    await user.upload(input, new File([new Uint8Array(68)], "brand-v2.png", { type: "image/png" }))
    await screen.findByText("Ready")

    const request = vi.mocked(fetch).mock.calls.find(([url]) => String(url).endsWith("/api/admin/assets/intents"))
    expect(JSON.parse(String((request?.[1] as RequestInit).body))).toMatchObject({
      replaceAssetId: "22222222-2222-4222-8222-222222222222",
    })
  })
})
