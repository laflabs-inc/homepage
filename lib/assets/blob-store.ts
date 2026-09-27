import "server-only"

import {
  BlobNotFoundError,
  BlobPathnameMismatchError,
  BlobPreconditionFailedError,
  BlobServiceNotAvailable,
  BlobServiceRateLimited,
  del,
  get,
  head,
  put,
} from "@vercel/blob"
import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client"

import { MAX_ASSET_BYTES } from "@/lib/assets/policy"
import { getMediaEnv } from "@/lib/env"
import { readBoundedJson } from "@/lib/http/json-body"

const CALLBACK_MAX_BYTES = 64 * 1024
const IMMUTABLE_CACHE_SECONDS = 365 * 24 * 60 * 60
const UUID_PATTERN = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"
const STAGING_PATHNAME = new RegExp(`^staging/${UUID_PATTERN}/${UUID_PATTERN}$`, "i")

export type BlobStoreErrorCode = "unavailable" | "not_found" | "conflict" | "invalid_callback"

export class BlobStoreError extends Error {
  constructor(public readonly code: BlobStoreErrorCode) {
    super(code)
    this.name = "BlobStoreError"
  }
}

export type StagedBlob = {
  pathname: string
  url: string
  contentType: string
}

export type PublicBlob = StagedBlob & {
  size: number
  etag?: string
}

export type PrivateUploadToken = {
  pathname: string
  allowedContentTypes: string[]
  maximumSizeInBytes: number
  validUntil?: number
  tokenPayload: string
}

export type PrivateUploadCallbacks = {
  onBeforeGenerateToken(input: {
    pathname: string
    clientPayload: string | null
    multipart: boolean
  }): Promise<PrivateUploadToken>
  onUploadCompleted(input: {
    blob: StagedBlob
    tokenPayload: string | null
  }): Promise<void>
}

export type PrivateUploadResult =
  | { type: "blob.generate-client-token"; clientToken: string }
  | { type: "blob.upload-completed"; response: "ok" }

type MediaCredentials = ReturnType<typeof getMediaEnv>

function isStagingPathname(pathname: string): boolean {
  return STAGING_PATHNAME.test(pathname)
}

function mapStagedBlob(blob: {
  pathname: string
  url: string
  contentType: string
}): StagedBlob {
  if (!isStagingPathname(blob.pathname)) throw new BlobStoreError("invalid_callback")
  return {
    pathname: blob.pathname,
    url: blob.url,
    contentType: blob.contentType,
  }
}

function normalizeProviderError(error: unknown): BlobStoreError {
  if (error instanceof BlobStoreError) return error
  if (error instanceof BlobNotFoundError) return new BlobStoreError("not_found")
  if (error instanceof BlobPreconditionFailedError) return new BlobStoreError("conflict")
  if (error instanceof BlobPathnameMismatchError) return new BlobStoreError("invalid_callback")
  if (error instanceof BlobServiceNotAvailable || error instanceof BlobServiceRateLimited) {
    return new BlobStoreError("unavailable")
  }
  return new BlobStoreError("unavailable")
}

async function readStream(stream: ReadableStream<Uint8Array>, expectedSize: number): Promise<Uint8Array> {
  if (expectedSize > MAX_ASSET_BYTES) throw new BlobStoreError("conflict")

  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > MAX_ASSET_BYTES) {
        await reader.cancel()
        throw new BlobStoreError("conflict")
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  if (length !== expectedSize) throw new BlobStoreError("conflict")
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

export class BlobStore {
  constructor(private readonly credentials: MediaCredentials = getMediaEnv()) {}

  async handlePrivateClientUpload(
    request: Request,
    callbacks: PrivateUploadCallbacks,
  ): Promise<PrivateUploadResult> {
    const parsed = await readBoundedJson(request.clone(), CALLBACK_MAX_BYTES)
    if (!parsed.ok) throw new BlobStoreError("invalid_callback")

    try {
      return await handleUpload({
        token: this.credentials.BLOB_PRIVATE_READ_WRITE_TOKEN,
        request,
        body: parsed.value as HandleUploadBody,
        onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
          if (!isStagingPathname(pathname)) throw new BlobStoreError("invalid_callback")
          const policy = await callbacks.onBeforeGenerateToken({
            pathname,
            clientPayload,
            multipart,
          })
          if (policy.pathname !== pathname) throw new BlobStoreError("invalid_callback")
          return {
            allowedContentTypes: [...policy.allowedContentTypes],
            maximumSizeInBytes: policy.maximumSizeInBytes,
            validUntil: policy.validUntil,
            addRandomSuffix: false,
            allowOverwrite: false,
            tokenPayload: policy.tokenPayload,
          }
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
          await callbacks.onUploadCompleted({
            blob: mapStagedBlob(blob),
            tokenPayload: tokenPayload ?? null,
          })
        },
      })
    } catch (error) {
      throw normalizeProviderError(error)
    }
  }

  async readPrivate(pathname: string): Promise<Uint8Array> {
    try {
      const result = await get(pathname, {
        access: "private",
        token: this.credentials.BLOB_PRIVATE_READ_WRITE_TOKEN,
        useCache: false,
      })
      if (!result || result.statusCode === 304 || !result.stream) {
        throw new BlobStoreError("not_found")
      }
      if (result.blob.pathname !== pathname) throw new BlobStoreError("conflict")
      return await readStream(result.stream, result.blob.size)
    } catch (error) {
      throw normalizeProviderError(error)
    }
  }

  async putPublic(pathname: string, bytes: Uint8Array, contentType: string): Promise<PublicBlob> {
    try {
      const blob = await put(pathname, bytes as unknown as Parameters<typeof put>[1], {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: false,
        cacheControlMaxAge: IMMUTABLE_CACHE_SECONDS,
        contentType,
        token: this.credentials.BLOB_PUBLIC_READ_WRITE_TOKEN,
      })
      if (blob.pathname !== pathname) throw new BlobStoreError("conflict")
      return {
        pathname: blob.pathname,
        url: blob.url,
        contentType: blob.contentType,
        size: bytes.byteLength,
      }
    } catch (error) {
      throw normalizeProviderError(error)
    }
  }

  async headPublic(pathname: string): Promise<PublicBlob | null> {
    try {
      const blob = await head(pathname, { token: this.credentials.BLOB_PUBLIC_READ_WRITE_TOKEN })
      if (blob.pathname !== pathname) throw new BlobStoreError("conflict")
      return {
        pathname: blob.pathname,
        url: blob.url,
        contentType: blob.contentType,
        size: blob.size,
        etag: blob.etag,
      }
    } catch (error) {
      if (error instanceof BlobNotFoundError) return null
      throw normalizeProviderError(error)
    }
  }

  async deletePrivate(pathname: string): Promise<void> {
    await this.delete(pathname, this.credentials.BLOB_PRIVATE_READ_WRITE_TOKEN)
  }

  async deletePublic(pathname: string): Promise<void> {
    await this.delete(pathname, this.credentials.BLOB_PUBLIC_READ_WRITE_TOKEN)
  }

  private async delete(pathname: string, token: string): Promise<void> {
    try {
      await del(pathname, { token })
    } catch (error) {
      if (error instanceof BlobNotFoundError) return
      throw normalizeProviderError(error)
    }
  }
}
