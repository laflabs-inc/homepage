import { revalidateTag } from "next/cache"

import { authorizeAdminApi, type AdminActor, type AdminApiAuthorization } from "@/lib/auth/admin-api"
import { documentCacheTags } from "@/lib/documents/cache"
import { documentService, DocumentServiceError } from "@/lib/documents/service"
import type { DocumentRevision } from "@/lib/documents/types"
import { jsonNoStore, withNoStore } from "@/lib/http/json-body"
import { isSameOriginRequest } from "@/lib/http/same-origin"

export type AdminDocumentService = Pick<typeof documentService,
  | "createDraft"
  | "createEnglishDraft"
  | "updateDraft"
  | "deleteDraft"
  | "schedule"
  | "returnScheduledToDraft"
  | "publish"
  | "archive"
  | "createNextDraft"
  | "listAdmin"
>

export type AdminDocumentDependencies = {
  authorize: () => Promise<AdminApiAuthorization>
  sameOrigin: (request: Request) => boolean
  service: AdminDocumentService
  revalidate: (tag: string, profile: "max") => void
}

export const adminDocumentDependencies: AdminDocumentDependencies = {
  authorize: authorizeAdminApi,
  sameOrigin: isSameOriginRequest,
  service: documentService,
  revalidate: revalidateTag,
}

export async function authorizeRead(
  dependencies: AdminDocumentDependencies,
): Promise<{ ok: true; actor: AdminActor } | { ok: false; response: Response }> {
  const authorization = await dependencies.authorize()
  if (!authorization.ok) return { ok: false, response: withNoStore(authorization.response) }
  return authorization
}

export async function authorizeMutation(
  request: Request,
  dependencies: AdminDocumentDependencies,
): Promise<{ ok: true; actor: AdminActor } | { ok: false; response: Response }> {
  const authorization = await authorizeRead(dependencies)
  if (!authorization.ok) return authorization
  if (!dependencies.sameOrigin(request)) {
    return { ok: false, response: jsonNoStore({ error: "forbidden" }, { status: 403 }) }
  }
  return authorization
}

export function serviceErrorResponse(error: unknown): Response {
  if (error instanceof DocumentServiceError) {
    const status = error.code === "not_found"
      ? 404
      : error.code === "unavailable"
        ? 503
        : 409
    return jsonNoStore({ error: error.code }, { status })
  }
  return jsonNoStore({ error: "unavailable" }, { status: 503 })
}

export function revalidatePublicRevision(
  revision: DocumentRevision,
  revalidate: AdminDocumentDependencies["revalidate"],
): void {
  const tags = new Set([
    ...documentCacheTags.index(revision.kind, revision.locale),
    ...documentCacheTags.detail(revision.kind, revision.slug, revision.locale),
  ])
  for (const tag of tags) {
    try {
      revalidate(tag, "max")
    } catch {
      // The public change is already committed. A cache failure must not report the mutation as failed.
    }
  }
}
