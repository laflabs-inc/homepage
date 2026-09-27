import { beforeEach, describe, expect, it, vi } from "vitest"

const provider = vi.hoisted(() => ({
  del: vi.fn(),
  get: vi.fn(),
  handleUpload: vi.fn(),
  head: vi.fn(),
  put: vi.fn(),
}))

vi.mock("@vercel/blob", async (importOriginal) => {
  const original = await importOriginal<typeof import("@vercel/blob")>()
  return { ...original, del: provider.del, get: provider.get, head: provider.head, put: provider.put }
})

vi.mock("@vercel/blob/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@vercel/blob/client")>()
  return { ...original, handleUpload: provider.handleUpload }
})

import {
  BlobStore,
  BlobStoreError,
  type PrivateUploadCallbacks,
} from "@/lib/assets/blob-store"

const publicToken = "public-token"
const privateToken = "private-token"
const assetId = "018f47a3-321f-7a90-b123-123456789abc"
const uploadNonce = "018f47a3-321f-7a90-b123-abcdef012345"
const stagingPathname = `staging/${assetId}/${uploadNonce}`

function createStore() {
  return new BlobStore({
    BLOB_PUBLIC_READ_WRITE_TOKEN: publicToken,
    BLOB_PRIVATE_READ_WRITE_TOKEN: privateToken,
  })
}

beforeEach(() => vi.clearAllMocks())

describe("BlobStore", () => {
  it("writes public bytes without overwrite using only the public token", async () => {
    const bytes = new Uint8Array([1, 2, 3])
    const pathname = `media/${assetId}/hero.png`
    provider.put.mockResolvedValue({
      pathname,
      url: "https://public.example/hero.png",
      contentType: "image/png",
      contentDisposition: "inline",
      downloadUrl: "https://public.example/hero.png?download=1",
    })

    await expect(createStore().putPublic(pathname, bytes, "image/png")).resolves.toEqual({
      pathname,
      url: "https://public.example/hero.png",
      contentType: "image/png",
      size: 3,
    })
    expect(provider.put).toHaveBeenCalledWith(pathname, bytes, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 31_536_000,
      contentType: "image/png",
      token: publicToken,
    })
    expect(JSON.stringify(provider.put.mock.calls)).not.toContain(privateToken)
  })

  it("reads staged bytes using only the private token", async () => {
    provider.get.mockResolvedValue({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([4, 5, 6]))
          controller.close()
        },
      }),
      blob: {
        pathname: stagingPathname,
        url: "https://private.example/staged",
        contentType: "image/png",
        size: 3,
      },
      headers: new Headers(),
    })

    await expect(createStore().readPrivate(stagingPathname)).resolves.toEqual(new Uint8Array([4, 5, 6]))
    expect(provider.get).toHaveBeenCalledWith(stagingPathname, {
      access: "private",
      token: privateToken,
      useCache: false,
    })
    expect(JSON.stringify(provider.get.mock.calls)).not.toContain(publicToken)
  })

  it("normalizes a missing private blob", async () => {
    provider.get.mockResolvedValue(null)

    await expect(createStore().readPrivate(stagingPathname)).rejects.toMatchObject({
      code: "not_found",
      name: "BlobStoreError",
    })
  })

  it("maps signed upload callbacks without leaking provider values", async () => {
    const callbacks: PrivateUploadCallbacks = {
      onBeforeGenerateToken: vi.fn(async () => ({
        pathname: stagingPathname,
        allowedContentTypes: ["image/png"],
        maximumSizeInBytes: 1024,
        tokenPayload: JSON.stringify({ assetId }),
      })),
      onUploadCompleted: vi.fn(async () => undefined),
    }
    provider.handleUpload.mockImplementation(async (options) => {
      const tokenOptions = await options.onBeforeGenerateToken(
        stagingPathname,
        JSON.stringify({ assetId }),
        false,
      )
      expect(tokenOptions).toEqual({
        addRandomSuffix: false,
        allowOverwrite: false,
        allowedContentTypes: ["image/png"],
        maximumSizeInBytes: 1024,
        tokenPayload: JSON.stringify({ assetId }),
      })
      await options.onUploadCompleted({
        blob: {
          pathname: stagingPathname,
          url: "https://private.example/staged",
          contentType: "image/png",
          size: 512,
        },
        tokenPayload: JSON.stringify({ assetId }),
      })
      return { type: "blob.upload-completed", response: "ok" }
    })
    const request = new Request("https://laflabs.co/api/admin/assets/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "blob.generate-client-token", payload: {} }),
    })

    await expect(createStore().handlePrivateClientUpload(request, callbacks)).resolves.toEqual({
      type: "blob.upload-completed",
      response: "ok",
    })
    expect(provider.handleUpload).toHaveBeenCalledWith(expect.objectContaining({
      request,
      token: privateToken,
    }))
    expect(callbacks.onUploadCompleted).toHaveBeenCalledWith({
      blob: {
        pathname: stagingPathname,
        url: "https://private.example/staged",
        contentType: "image/png",
      },
      tokenPayload: JSON.stringify({ assetId }),
    })
  })

  it("rejects a callback pathname changed by application code", async () => {
    provider.handleUpload.mockImplementation(async (options) => options.onBeforeGenerateToken(
      stagingPathname,
      JSON.stringify({ assetId }),
      false,
    ))
    const callbacks: PrivateUploadCallbacks = {
      onBeforeGenerateToken: vi.fn(async () => ({
        pathname: `staging/${assetId}/different`,
        allowedContentTypes: ["image/png"],
        maximumSizeInBytes: 1024,
        tokenPayload: JSON.stringify({ assetId }),
      })),
      onUploadCompleted: vi.fn(async () => undefined),
    }
    const request = new Request("https://laflabs.co/api/admin/assets/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    })

    await expect(createStore().handlePrivateClientUpload(request, callbacks)).rejects.toEqual(
      new BlobStoreError("invalid_callback"),
    )
  })

  it("keeps deletes idempotent and credentials isolated", async () => {
    provider.del.mockResolvedValue(undefined)

    await createStore().deletePrivate(stagingPathname)
    await createStore().deletePublic(`media/${assetId}/hero.png`)

    expect(provider.del).toHaveBeenNthCalledWith(1, stagingPathname, { token: privateToken })
    expect(provider.del).toHaveBeenNthCalledWith(2, `media/${assetId}/hero.png`, { token: publicToken })
  })
})
