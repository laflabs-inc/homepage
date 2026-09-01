import { z } from "zod"

import { documentKinds } from "@/lib/documents/types"

const labelSchema = z.string().trim().min(1).max(80)
const slugSchema = z.string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const orderSchema = z.number().int().min(0).max(10_000)
const versionSchema = z.number().int().positive()

export const categoryCreateSchema = z.object({
  kind: z.enum(documentKinds),
  slug: slugSchema,
  labelKo: labelSchema,
  labelEn: labelSchema,
  sortOrder: orderSchema,
}).strict()

export const categoryUpdateSchema = z.object({
  labelKo: labelSchema,
  labelEn: labelSchema,
  sortOrder: orderSchema,
  active: z.boolean(),
  version: versionSchema,
}).strict()

export const categoryReorderSchema = z.object({
  kind: z.enum(documentKinds),
  items: z.array(z.object({
    id: z.uuid(),
    version: versionSchema,
  }).strict()).min(1).max(100),
}).strict().superRefine(({ items }, context) => {
  if (new Set(items.map(({ id }) => id)).size !== items.length) {
    context.addIssue({
      code: "custom",
      message: "Category IDs must be unique",
      path: ["items"],
    })
  }
})
