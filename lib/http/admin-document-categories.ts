import { revalidateTag } from "next/cache"

import {
  authorizeAdminApi,
  type AdminApiAuthorization,
} from "@/lib/auth/admin-api"
import {
  CategoryServiceError,
  createDocumentCategoryService,
} from "@/lib/document-categories/service"
import { documentCategoryStore } from "@/lib/document-categories/store"
import { isSameOriginRequest } from "@/lib/http/same-origin"
import { jsonNoStore, withNoStore } from "@/lib/http/json-body"

const service = createDocumentCategoryService(documentCategoryStore)

export type AdminCategoryDependencies = {
  authorize: () => Promise<AdminApiAuthorization>
  sameOrigin: (request: Request) => boolean
  service: Pick<typeof service, "list" | "create" | "update" | "reorder">
  revalidate: (tag: string, profile: "max") => void
}

export const adminCategoryDependencies: AdminCategoryDependencies = {
  authorize: authorizeAdminApi,
  sameOrigin: isSameOriginRequest,
  service,
  revalidate: revalidateTag,
}

export async function authorizeCategoryRead(
  dependencies: AdminCategoryDependencies,
) {
  const authorization = await dependencies.authorize()
  if (!authorization.ok) {
    return { ok: false as const, response: withNoStore(authorization.response) }
  }
  return authorization
}

export async function authorizeCategoryMutation(
  request: Request,
  dependencies: AdminCategoryDependencies,
) {
  const authorization = await authorizeCategoryRead(dependencies)
  if (!authorization.ok) return authorization
  if (!dependencies.sameOrigin(request)) {
    return { ok: false as const, response: jsonNoStore({ error: "forbidden" }, { status: 403 }) }
  }
  return authorization
}

export function categoryErrorResponse(error: unknown): Response {
  if (error instanceof CategoryServiceError) {
    const status = error.code === "not_found"
      ? 404
      : error.code === "invalid_category"
        ? 400
        : error.code === "unavailable"
          ? 503
          : 409
    return jsonNoStore({ error: error.code }, { status })
  }
  return jsonNoStore({ error: "unavailable" }, { status: 503 })
}

export function invalidateCategoryCache(
  dependencies: AdminCategoryDependencies,
): void {
  try {
    dependencies.revalidate("document-categories", "max")
  } catch {
    // The mutation is already committed; cache invalidation is best effort.
  }
}
