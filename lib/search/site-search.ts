import "server-only"

import { copy, documentSections, products, repositories } from "@/lib/content"
import {
  listPublishedDocuments,
  type PublishedDocumentReader,
} from "@/lib/documents/cache"
import { documentStore } from "@/lib/documents/store"
import { documentKinds } from "@/lib/documents/types"
import type { Locale } from "@/lib/i18n"

import type {
  SiteSearchResponse,
  SiteSearchResult,
} from "./types"

type SearchableResult = SiteSearchResult & { keywords?: string[] }

function normalize(value: string, locale: Locale) {
  return value.normalize("NFKC").toLocaleLowerCase(locale)
}

function scoreResult(result: SearchableResult, query: string, locale: Locale) {
  const title = normalize(result.title, locale)
  if (title === query) return 0
  if (title.startsWith(query)) return 1
  if (title.includes(query)) return 2
  if (result.keywords?.some((keyword) => normalize(keyword, locale).includes(query))) return 3
  if (normalize(result.description, locale).includes(query)) return 4
  return null
}

function staticResults(locale: Locale): SearchableResult[] {
  const t = copy[locale]

  return [
    {
      id: "home",
      group: "page",
      title: "LafLabs",
      description: t.hero.lede,
      href: "/",
      keywords: ["home", "homepage", "홈", "홈페이지"],
    },
    {
      id: "products",
      group: "page",
      title: t.nav.products,
      description: t.products.lede,
      href: "/#products",
      keywords: ["products", "product", "제품", "identity", "payments", "cloud", "신원", "결제", "클라우드"],
    },
    {
      id: "open-source",
      group: "page",
      title: t.nav.open,
      description: t.open.lede,
      href: "/#open-source",
      keywords: ["open source", "opensource", "오픈소스", "github"],
    },
    {
      id: "principles",
      group: "page",
      title: t.nav.principles,
      description: t.principles.lede,
      href: "/#principles",
      keywords: ["principles", "원칙"],
    },
    {
      id: "contact",
      group: "page",
      title: t.nav.contact,
      description: t.cta.lede,
      href: "/#contact",
      keywords: ["contact", "문의"],
    },
    {
      id: "design",
      group: "page",
      title: t.footer.links.design,
      description: locale === "ko" ? "LafLabs의 디자인 가이드입니다." : "The LafLabs design guide.",
      href: "/design",
      keywords: ["design", "guide", "디자인", "가이드"],
    },
    ...documentKinds.map((kind) => ({
      id: `${kind}-index`,
      group: kind,
      title: documentSections[kind].localized[locale].title,
      description: documentSections[kind].localized[locale].description,
      href: `${documentSections[kind].path}?locale=${locale}`,
      keywords: [kind],
    })),
    ...products.map((product) => ({
      id: product.id,
      group: "product" as const,
      title: product.name,
      description: t.products[product.id].description,
      href: "/#products",
      keywords: [product.id, t.products[product.id].layer, t.products[product.id].tagline],
    })),
    ...repositories.map((repository) => ({
      id: repository.name,
      group: "open-source" as const,
      title: repository.name,
      description: t.open.descriptions[repository.name],
      href: repository.href,
      keywords: [repository.language, "github"],
    })),
  ]
}

function documentResult(
  document: Awaited<ReturnType<PublishedDocumentReader["listPublished"]>>[number],
  locale: Locale,
): SiteSearchResult {
  return {
    id: document.id,
    group: document.kind,
    title: document.title,
    description: document.summary,
    href: `${documentSections[document.kind].path}/${document.slug}?locale=${locale}`,
  }
}

export async function searchSite(
  query: string,
  locale: Locale,
  repository: PublishedDocumentReader = documentStore,
): Promise<SiteSearchResponse> {
  const normalizedQuery = normalize(query, locale)
  const results = staticResults(locale)
    .flatMap((result) => {
      const score = scoreResult(result, normalizedQuery, locale)
      return score === null ? [] : [{ result, score }]
    })
    .sort((left, right) => left.score - right.score)
    .map(({ result }) => {
      const { keywords: _keywords, ...searchResult } = result
      return searchResult
    })

  try {
    const documentLists = await Promise.all(documentKinds.map((kind) => listPublishedDocuments({
      kind,
      locale,
      search: query,
      limit: 6,
    }, repository)))

    return {
      query,
      results: [...results, ...documentLists.flat().map((document) => documentResult(document, locale))],
      partial: false,
    }
  } catch {
    return { query, results, partial: true }
  }
}
