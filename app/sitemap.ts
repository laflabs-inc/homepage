import type { MetadataRoute } from "next"

import { documentSections, siteUrl } from "@/lib/content"
import { listPublishedDocuments, type PublishedDocumentReader } from "@/lib/documents/cache"
import { documentStore } from "@/lib/documents/store"
import { documentKinds } from "@/lib/documents/types"

const homepage: MetadataRoute.Sitemap[number] = {
  url: siteUrl,
  changeFrequency: "monthly",
  priority: 1,
}

export async function buildSitemap(
  repository: PublishedDocumentReader = documentStore,
): Promise<MetadataRoute.Sitemap> {
  try {
    const entries: MetadataRoute.Sitemap = [homepage]

    for (const kind of documentKinds) {
      let before: { pinned: boolean; publishedAt: Date; id: string } | undefined
      do {
        const documents = await listPublishedDocuments({ kind, locale: "ko", limit: 50, before }, repository)
        for (const document of documents) {
          entries.push({
            url: `${siteUrl}${documentSections[kind].path}/${document.slug}`,
            lastModified: document.publishedAt,
            changeFrequency: "monthly",
            priority: 0.6,
          })
        }
        const last = documents.at(-1)
        before = documents.length === 50 && last
          ? { pinned: last.pinned, publishedAt: last.publishedAt, id: last.id }
          : undefined
      } while (before)
    }

    return entries
  } catch {
    return [homepage]
  }
}

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap()
}
