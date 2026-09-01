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
} as const

export type DocumentCategory = (typeof categoriesByKind)[keyof typeof categoriesByKind][number]

const slugSchema = z.string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const categorySlugSchema = z.string()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const nullableDateSchema = z.coerce.date().nullable().optional()
const markdownParser = unified().use(remarkParse)
const SUMMARY_VISIBLE_CHARACTER_LIMIT = 240

function hasBoundedVisibleLength(value: string): boolean {
  return Array.from(value).length <= SUMMARY_VISIBLE_CHARACTER_LIMIT
}

export function truncateSummary(value: string): string {
  return Array.from(value).slice(0, SUMMARY_VISIBLE_CHARACTER_LIMIT).join("")
}

const draftFields = {
  kind: z.enum(documentKinds),
  locale: z.enum(documentLocales),
  slug: slugSchema,
  category: categorySlugSchema.nullable().optional(),
  pinned: z.boolean().optional(),
  title: z.string().min(1).max(160),
  summary: z.string().refine(hasBoundedVisibleLength),
  bodyMarkdown: z.string().min(1).max(200_000),
  effectiveAt: nullableDateSchema,
}

export const documentDraftSchema = z.object(draftFields).strict()

export const generatedSummarySchema = z.string().trim().min(1).regex(/^[^\r\n]*$/).refine(hasBoundedVisibleLength)

export const publishDocumentSchema = z.object({
  ...draftFields,
  summary: generatedSummarySchema,
}).strict().superRefine(({ bodyMarkdown }, context) => {
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
