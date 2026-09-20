import type { MetadataRoute } from "next"

import { documentSections, siteUrl } from "@/lib/content"
import { designCatalog, designDiscoveryEntries } from "@/lib/design-system/catalog"
import { listPublishedSitemapDocuments, type PublishedDocumentReader } from "@/lib/documents/cache"
import { documentStore } from "@/lib/documents/store"

const homepage: MetadataRoute.Sitemap[number] = {
  url: siteUrl,
  changeFrequency: "monthly",
  priority: 1,
}

const designPages: MetadataRoute.Sitemap = designDiscoveryEntries.map((entry) => ({
  url: `${siteUrl}${entry.href}`,
  changeFrequency: "monthly",
  priority: entry.href === designCatalog.meta.canonicalPath ? 0.6 : 0.5,
}))

const staticEntries: MetadataRoute.Sitemap = [homepage, ...designPages]

export async function buildSitemap(
  repository: PublishedDocumentReader = documentStore,
): Promise<MetadataRoute.Sitemap> {
  try {
    const entries: MetadataRoute.Sitemap = [...staticEntries]

    const documents = await listPublishedSitemapDocuments(repository)
    for (const document of documents) {
      entries.push({
        url: `${siteUrl}${documentSections[document.kind].path}/${document.slug}`,
        lastModified: document.publishedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      })
    }

    return entries
  } catch {
    return [...staticEntries]
  }
}

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap()
}
