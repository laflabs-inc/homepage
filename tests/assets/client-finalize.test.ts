import { describe, expect, it, vi } from "vitest"

import { finalizeUploadedAsset } from "@/lib/assets/client-finalize"

const asset = {
  id: "11111111-1111-4111-8111-111111111111",
  status: "ready" as const,
}

describe("finalizeUploadedAsset", () => {
  it("waits for the asynchronous Blob completion callback before giving up", async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "invalid_state" }), {
        status: 409,
        headers: { "content-type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ asset }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }))
    const wait = vi.fn(async () => undefined)

    await expect(finalizeUploadedAsset(asset.id, { request, wait })).resolves.toEqual(asset)
    expect(request).toHaveBeenCalledTimes(2)
    expect(wait).toHaveBeenCalledTimes(1)
  })

  it("does not retry permanent finalization failures", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "invalid_image" }), {
      status: 422,
      headers: { "content-type": "application/json" },
    }))
    const wait = vi.fn(async () => undefined)

    await expect(finalizeUploadedAsset(asset.id, { request, wait })).rejects.toThrow("invalid_image")
    expect(request).toHaveBeenCalledTimes(1)
    expect(wait).not.toHaveBeenCalled()
  })
})
