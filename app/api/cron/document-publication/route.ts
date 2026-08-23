import { revalidateTag } from "next/cache"

import { documentService } from "@/lib/documents/service"
import { revalidatePublicRevision } from "@/lib/http/admin-documents"
import { authorizeCronRequest } from "@/lib/http/cron-auth"
import { jsonNoStore } from "@/lib/http/json-body"

type PublicationService = Pick<typeof documentService, "publishDue">
type Revalidate = (tag: string, profile: "max") => void

export async function handleDocumentPublication(
  request: Request,
  service: PublicationService = documentService,
  now: Date = new Date(),
  revalidate: Revalidate = revalidateTag,
): Promise<Response> {
  if (!authorizeCronRequest(request)) {
    return jsonNoStore({ error: "unauthorized" }, { status: 401 })
  }

  try {
    const result = await service.publishDue(now)
    const revalidationFailedIds: string[] = []
    for (const revision of result.publishedRevisions) {
      if (!revalidatePublicRevision(revision, revalidate)) {
        revalidationFailedIds.push(revision.id)
      }
    }
    const publishedIds = result.publishedRevisions.map(({ id }) => id)

    return jsonNoStore({
      publishedCount: publishedIds.length,
      failedCount: result.failedIds.length,
      revalidationFailedCount: revalidationFailedIds.length,
      publishedIds,
      failedIds: result.failedIds,
      revalidationFailedIds,
    })
  } catch {
    return jsonNoStore({ error: "unavailable" }, { status: 503 })
  }
}

export function GET(request: Request): Promise<Response> {
  return handleDocumentPublication(request)
}
