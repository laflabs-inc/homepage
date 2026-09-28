import { z } from "zod"

import { authorizeAdminApi, type AdminActor, type AdminApiAuthorization } from "@/lib/auth/admin-api"
import { AssetError } from "@/lib/assets/errors"
import { toAdminAsset } from "@/lib/assets/admin-summary"
import { BlobStore, BlobStoreError, type PrivateUploadCallbacks } from "@/lib/assets/blob-store"
import { assetService, AssetServiceError } from "@/lib/assets/service"
import { jsonNoStore, readBoundedJson, withNoStore } from "@/lib/http/json-body"
import { isSameOriginRequest } from "@/lib/http/same-origin"

const assetIdSchema = z.uuid()
const clientPayloadSchema = z.object({ assetId: z.uuid() }).strict()
const tokenPayloadSchema = z.object({
  assetId: z.uuid(),
  pathname: z.string().min(1).max(256),
  actorId: z.string().min(1).max(160),
}).strict()

type AdminAssetService = Pick<
  typeof assetService,
  | "createIntent"
  | "get"
  | "recordUploadCompleted"
  | "finalize"
  | "list"
  | "updateMetadata"
  | "archive"
  | "restore"
  | "delete"
>

type AdminBlobStore = Pick<BlobStore, "handlePrivateClientUpload">

export type AdminAssetDependencies = {
  authorize: () => Promise<AdminApiAuthorization>
  sameOrigin: (request: Request) => boolean
  readBody: typeof readBoundedJson
  service: AdminAssetService
  blobStore: AdminBlobStore
}

export const adminAssetDependencies: AdminAssetDependencies = {
  authorize: authorizeAdminApi,
  sameOrigin: isSameOriginRequest,
  readBody: readBoundedJson,
  service: assetService,
  blobStore: new BlobStore(),
}

export async function authorizeAssetRead(
  dependencies: AdminAssetDependencies = adminAssetDependencies,
): Promise<{ ok: true; actor: AdminActor } | { ok: false; response: Response }> {
  const authorization = await dependencies.authorize()
  if (!authorization.ok) return { ok: false, response: withNoStore(authorization.response) }
  return authorization
}

export async function authorizeAssetMutation(
  request: Request,
  dependencies: AdminAssetDependencies = adminAssetDependencies,
): Promise<{ ok: true; actor: AdminActor } | { ok: false; response: Response }> {
  const authorization = await authorizeAssetRead(dependencies)
  if (!authorization.ok) return authorization
  if (!dependencies.sameOrigin(request)) {
    return { ok: false, response: jsonNoStore({ error: "forbidden" }, { status: 403 }) }
  }
  return authorization
}

export function assetErrorResponse(error: unknown): Response {
  if (error instanceof AssetError) {
    const status = error.code === "file_too_large"
      ? 413
      : error.code === "unsupported_type"
        ? 415
        : error.code === "invalid_input"
          ? 400
          : error.code === "processing_unavailable"
            ? 503
            : 422
    return jsonNoStore({ error: error.code }, { status })
  }
  if (error instanceof AssetServiceError) {
    const status = error.code === "not_found"
      ? 404
      : error.code === "unavailable"
        ? 503
        : 409
    return jsonNoStore({ error: error.code }, { status })
  }
  if (error instanceof BlobStoreError) {
    const status = error.code === "not_found" ? 404 : error.code === "unavailable" ? 503 : 409
    return jsonNoStore({ error: error.code }, { status })
  }
  return jsonNoStore({ error: "unavailable" }, { status: 503 })
}

export function invalidAssetIdResponse(assetId: string): Response | null {
  return assetIdSchema.safeParse(assetId).success
    ? null
    : jsonNoStore({ error: "invalid_request" }, { status: 400 })
}

export { toAdminAsset } from "@/lib/assets/admin-summary"

export async function handleCreateAssetIntent(
  request: Request,
  dependencies: AdminAssetDependencies = adminAssetDependencies,
): Promise<Response> {
  const authorization = await authorizeAssetMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  const body = await dependencies.readBody(request)
  if (!body.ok) return body.response
  try {
    const intent = await dependencies.service.createIntent(body.value, authorization.actor)
    return jsonNoStore({ intent }, { status: 201 })
  } catch (error) {
    return assetErrorResponse(error)
  }
}

function parseJsonPayload<T>(value: string | null, schema: z.ZodType<T>): T {
  if (!value || value.length > 1024) throw new BlobStoreError("invalid_callback")
  try {
    return schema.parse(JSON.parse(value))
  } catch {
    throw new BlobStoreError("invalid_callback")
  }
}

export async function handleAssetUpload(
  request: Request,
  dependencies: AdminAssetDependencies = adminAssetDependencies,
): Promise<Response> {
  const callbacks: PrivateUploadCallbacks = {
    async onBeforeGenerateToken({ pathname, clientPayload, multipart }) {
      const authorization = await authorizeAssetMutation(request, dependencies)
      if (!authorization.ok) throw new BlobStoreError("invalid_callback")
      if (multipart) throw new BlobStoreError("invalid_callback")
      const { assetId } = parseJsonPayload(clientPayload, clientPayloadSchema)
      const asset = await dependencies.service.get(assetId)
      if (
        asset.status !== "pending" ||
        asset.stagingPathname !== pathname ||
        asset.createdBy !== authorization.actor.githubId
      ) {
        throw new BlobStoreError("invalid_callback")
      }
      return {
        pathname,
        allowedContentTypes: [asset.declaredMediaType],
        maximumSizeInBytes: 10 * 1024 * 1024,
        tokenPayload: JSON.stringify({ assetId, pathname, actorId: asset.createdBy }),
      }
    },
    async onUploadCompleted({ blob, tokenPayload }) {
      const payload = parseJsonPayload(tokenPayload, tokenPayloadSchema)
      const asset = await dependencies.service.get(payload.assetId)
      if (
        payload.pathname !== blob.pathname ||
        asset.stagingPathname !== blob.pathname ||
        asset.createdBy !== payload.actorId ||
        asset.status !== "pending"
      ) {
        throw new BlobStoreError("invalid_callback")
      }
      await dependencies.service.recordUploadCompleted(
        asset.id,
        blob.pathname,
        blob.url,
        { githubId: payload.actorId, name: asset.createdByName },
      )
    },
  }

  try {
    const result = await dependencies.blobStore.handlePrivateClientUpload(request, callbacks)
    return jsonNoStore(result)
  } catch (error) {
    return assetErrorResponse(error)
  }
}

export async function handleFinalizeAsset(
  request: Request,
  assetId: string,
  dependencies: AdminAssetDependencies = adminAssetDependencies,
): Promise<Response> {
  const authorization = await authorizeAssetMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  const invalidId = invalidAssetIdResponse(assetId)
  if (invalidId) return invalidId
  try {
    const asset = await dependencies.service.finalize(assetId, authorization.actor)
    return jsonNoStore({ asset: toAdminAsset(asset) })
  } catch (error) {
    return assetErrorResponse(error)
  }
}
