import {
  adminCategoryDependencies,
  authorizeCategoryMutation,
  categoryErrorResponse,
  invalidateCategoryCache,
  type AdminCategoryDependencies,
} from "@/lib/http/admin-document-categories"
import { jsonNoStore, readBoundedJson } from "@/lib/http/json-body"
import { categoryReorderSchema } from "@/lib/document-categories/validation"

export async function handleReorderCategories(
  request: Request,
  dependencies: AdminCategoryDependencies = adminCategoryDependencies,
): Promise<Response> {
  const authorization = await authorizeCategoryMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  const body = await readBoundedJson(request)
  if (!body.ok) return body.response
  const parsed = categoryReorderSchema.safeParse(body.value)
  if (!parsed.success) return jsonNoStore({ error: "invalid_request" }, { status: 400 })

  try {
    const categories = await dependencies.service.reorder(parsed.data, authorization.actor)
    invalidateCategoryCache(dependencies, parsed.data.kind)
    return jsonNoStore({ categories })
  } catch (error) {
    return categoryErrorResponse(error)
  }
}

export function POST(request: Request) {
  return handleReorderCategories(request)
}
