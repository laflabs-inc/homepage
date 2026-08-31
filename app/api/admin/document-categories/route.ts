import { z } from "zod"

import {
  adminCategoryDependencies,
  authorizeCategoryMutation,
  authorizeCategoryRead,
  categoryErrorResponse,
  invalidateCategoryCache,
  type AdminCategoryDependencies,
} from "@/lib/http/admin-document-categories"
import { jsonNoStore, readBoundedJson } from "@/lib/http/json-body"
import { categoryCreateSchema } from "@/lib/document-categories/validation"
import { documentKinds } from "@/lib/documents/types"

const listSchema = z.object({
  kind: z.enum(documentKinds).optional(),
  active: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
}).strict()

export async function handleListCategories(
  request: Request,
  dependencies: AdminCategoryDependencies = adminCategoryDependencies,
): Promise<Response> {
  const authorization = await authorizeCategoryRead(dependencies)
  if (!authorization.ok) return authorization.response

  const query: Record<string, string> = {}
  for (const [key, value] of new URL(request.url).searchParams) {
    if (key in query) return jsonNoStore({ error: "invalid_request" }, { status: 400 })
    query[key] = value
  }
  const parsed = listSchema.safeParse(query)
  if (!parsed.success) return jsonNoStore({ error: "invalid_request" }, { status: 400 })

  try {
    return jsonNoStore({ categories: await dependencies.service.list(parsed.data) })
  } catch (error) {
    return categoryErrorResponse(error)
  }
}

export async function handleCreateCategory(
  request: Request,
  dependencies: AdminCategoryDependencies = adminCategoryDependencies,
): Promise<Response> {
  const authorization = await authorizeCategoryMutation(request, dependencies)
  if (!authorization.ok) return authorization.response
  const body = await readBoundedJson(request)
  if (!body.ok) return body.response
  const parsed = categoryCreateSchema.safeParse(body.value)
  if (!parsed.success) return jsonNoStore({ error: "invalid_request" }, { status: 400 })

  try {
    const category = await dependencies.service.create(parsed.data, authorization.actor)
    invalidateCategoryCache(dependencies)
    return jsonNoStore({ category }, { status: 201 })
  } catch (error) {
    return categoryErrorResponse(error)
  }
}

export function GET(request: Request) {
  return handleListCategories(request)
}

export function POST(request: Request) {
  return handleCreateCategory(request)
}
