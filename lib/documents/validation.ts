import { z } from "zod"
import { unified } from "unified"
import remarkParse from "remark-parse"
import { visit } from "unist-util-visit"

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
const markdownParser = unified().use(remarkParse)

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
  summary: z.string().trim().min(1).max(240).regex(/^[^\r\n]*$/),
}).strict().refine(categoryMatchesKind, {
  message: "Category is not allowed for this document kind",
  path: ["category"],
}).superRefine(({ bodyMarkdown }, context) => {
  const tree = markdownParser.parse(bodyMarkdown)
  visit(tree, (node) => {
    if (node.type !== "image" && node.type !== "imageReference") return
    const alt = (node as { alt?: unknown }).alt
    if (typeof alt !== "string" || alt.trim().length === 0) {
      context.addIssue({
        code: "custom",
        message: "Markdown images require meaningful alternative text",
        path: ["bodyMarkdown"],
      })
    }
  })
})

export const scheduleDocumentSchema = z.object({
  scheduledAt: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
    message: "Scheduled publication must be in the future",
  }),
}).strict()
