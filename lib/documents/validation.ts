import { z } from "zod"

import { documentKinds, documentLocales } from "@/lib/documents/types"

export const revisionIdSchema = z.uuid()

export const categoriesByKind = {
  notice: ["general", "service", "maintenance", "security"],
  legal: ["privacy", "terms", "cookies", "policy"],
  disclosure: ["corporate", "financial", "governance", "material"],
  design: ["foundation", "brand", "component", "resource"],
} as const

const slugSchema = z.string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const nullableDateSchema = z.coerce.date().nullable().optional()

const draftFields = {
  kind: z.enum(documentKinds),
  locale: z.enum(documentLocales),
  slug: slugSchema,
  category: z.string().nullable().optional(),
  pinned: z.boolean().optional(),
  title: z.string().min(1).max(160),
  summary: z.string().max(240),
  bodyMarkdown: z.string().min(1).max(200_000),
  effectiveAt: nullableDateSchema,
}

function categoryMatchesKind(value: { kind: keyof typeof categoriesByKind; category?: string | null }): boolean {
  return value.category == null
    || (categoriesByKind[value.kind] as readonly string[]).includes(value.category)
}

export const documentDraftSchema = z.object(draftFields).strict().refine(categoryMatchesKind, {
  message: "Category is not allowed for this document kind",
  path: ["category"],
})

export const publishDocumentSchema = z.object({
  ...draftFields,
  summary: z.string().min(1).max(240),
}).strict().refine(categoryMatchesKind, {
  message: "Category is not allowed for this document kind",
  path: ["category"],
})

export const scheduleDocumentSchema = z.object({
  scheduledAt: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
    message: "Scheduled publication must be in the future",
  }),
}).strict()
