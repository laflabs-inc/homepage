import { beforeEach, describe, expect, it, vi } from "vitest"

const upload = vi.hoisted(() => vi.fn())

vi.mock("@vercel/blob/client", () => ({ upload }))

import { uploadStagedAsset } from "@/lib/assets/client-upload"

const assetId = "018f47a3-321f-7a90-b123-123456789abc"
const uploadNonce = "018f47a3-321f-7a90-b123-abcdef012345"
const pathname = `staging/${assetId}/${uploadNonce}`

beforeEach(() => vi.clearAllMocks())

describe("uploadStagedAsset", () => {
  it("uploads to the exact private pathname and exposes only normalized progress", async () => {
    upload.mockImplementation(async (_pathname, _file, options) => {
      options.onUploadProgress({ loaded: 2, total: 4, percentage: 50 })
      return { pathname, url: "https://private.example/provider-result" }
    })
    const file = new File([new Uint8Array([1, 2, 3, 4])], "hero.png", { type: "image/png" })
    const onProgress = vi.fn()

    await expect(uploadStagedAsset({ file, pathname, assetId, onProgress })).resolves.toBeUndefined()
    expect(upload).toHaveBeenCalledWith(pathname, file, {
      access: "private",
      clientPayload: JSON.stringify({ assetId }),
      contentType: "image/png",
      handleUploadUrl: "/api/admin/assets/upload",
      onUploadProgress: expect.any(Function),
    })
    expect(onProgress).toHaveBeenCalledWith({ loaded: 2, total: 4, percentage: 50 })
  })

  it.each([
    ["not-a-uuid", pathname],
    [assetId, `staging/${assetId}/../escape`],
    [assetId, `staging/another/${uploadNonce}`],
  ])("rejects an invalid asset ID or staging pathname before upload", async (invalidId, invalidPathname) => {
    const file = new File(["x"], "hero.png", { type: "image/png" })

    await expect(uploadStagedAsset({ file, pathname: invalidPathname, assetId: invalidId })).rejects.toThrow(
      /invalid_upload_intent/,
    )
    expect(upload).not.toHaveBeenCalled()
  })
})
