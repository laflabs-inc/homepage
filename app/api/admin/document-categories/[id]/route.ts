import { z } from "zod"

import {
  adminCategoryDependencies,
  authorizeCategoryMutation,
  categoryErrorResponse,
  invalidateCategoryCache,
  type AdminCategoryDependencies,
} from "@/lib/http/admin-document-categories"
import { jsonNoStore, readBoundedJson } from "@/lib/http/json-body"
import { categoryUpdateSchema } from "@/lib/document-categories/validation"

const idSchema = z.uuid()

export async function handleUpdateCategory(
  request: Request,
  id: string,
  dependencies: AdminCategoryDependencies = adminCategoryDependencies,
): Promise<Response> {
  const authorization = await authorizeCategoryMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  if (!idSchema.safeParse(id).success) {
    return jsonNoStore({ error: "invalid_request" }, { status: 400 })
  }
  const body = await readBoundedJson(request)
  if (!body.ok) return body.response
  const parsed = categoryUpdateSchema.safeParse(body.value)
  if (!parsed.success) return jsonNoStore({ error: "invalid_request" }, { status: 400 })

  try {
    const category = await dependencies.service.update(id, parsed.data, authorization.actor)
    invalidateCategoryCache(dependencies, category.kind)
    return jsonNoStore({ category })
  } catch (error) {
    return categoryErrorResponse(error)
  }
}

type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: Context) {
  return handleUpdateCategory(request, (await context.params).id)
}
