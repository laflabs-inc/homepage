import { revalidateTag } from "next/cache"

import { documentService } from "@/lib/documents/service"
import type { DocumentRevision } from "@/lib/documents/types"
import { revalidatePublicRevision } from "@/lib/http/admin-documents"
import { authorizeCronRequest } from "@/lib/http/cron-auth"
import { jsonNoStore } from "@/lib/http/json-body"

type PublicationService = Pick<typeof documentService, "listAdmin" | "publishDue">
type Revalidate = (tag: string, profile: "max") => void

function revalidateUnknownPublication(revalidate: Revalidate): void {
  for (const tag of ["documents", "documents:sitemap"]) {
    try {
      revalidate(tag, "max")
    } catch {
      // The publication is committed and remains a success even if cache invalidation is unavailable.
    }
  }
}

export async function handleDocumentPublication(
  request: Request,
  service: PublicationService = documentService,
  now: Date = new Date(),
  revalidate: Revalidate = revalidateTag,
): Promise<Response> {
  if (!authorizeCronRequest(request)) {
    return jsonNoStore({ error: "unauthorized" }, { status: 401 })
  }

  let scheduled: DocumentRevision[] = []
  try {
    scheduled = await service.listAdmin({ status: "scheduled" })
  } catch {
    // Publication remains available if the optional cache metadata read fails.
  }

  try {
    const result = await service.publishDue(now)
    const metadata = new Map(scheduled.map((revision) => [revision.id, revision]))
    for (const id of result.publishedIds) {
      const revision = metadata.get(id)
      if (revision) revalidatePublicRevision(revision, revalidate)
      else revalidateUnknownPublication(revalidate)
    }

    return jsonNoStore({
      publishedCount: result.publishedIds.length,
      failedCount: result.failedIds.length,
      publishedIds: result.publishedIds,
      failedIds: result.failedIds,
    })
  } catch {
    return jsonNoStore({ error: "unavailable" }, { status: 503 })
  }
}

export function GET(request: Request): Promise<Response> {
  return handleDocumentPublication(request)
}
