import "server-only"

import { copy, documentSections } from "@/lib/content"
import {
  listPublishedDocuments,
  type PublishedDocumentReader,
} from "@/lib/documents/cache"
import { documentStore } from "@/lib/documents/store"
import { documentKinds } from "@/lib/documents/types"
import type { Locale } from "@/lib/i18n"
import { homepageCopy, openSourceRows, workItems } from "@/lib/homepage"

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

function toSiteSearchResult(result: SearchableResult): SiteSearchResult {
  return {
    id: result.id,
    group: result.group,
    title: result.title,
    description: result.description,
    href: result.href,
  }
}

function staticResults(locale: Locale): SearchableResult[] {
  const t = copy[locale]
  const home = homepageCopy[locale]

  return [
    {
      id: "home",
      group: "page",
      title: "LafLabs",
      description: home.hero.lede,
      href: "/",
      keywords: ["home", "homepage", "홈", "홈페이지"],
    },
    {
      id: "company",
      group: "page",
      title: home.company.title,
      description: home.company.lede,
      href: "/#company",
      keywords: [
        "company",
        "회사",
        "BUILD QUIETLY",
        "WORK RELIABLY",
        ...home.company.scopes.flatMap((scope) => [scope.title, scope.body]),
      ],
    },
    {
      id: "work-method",
      group: "page",
      title: home.method.title,
      description: home.method.lede,
      href: "/#work-method",
      keywords: home.method.items.flatMap((item) => [item.mark, item.title, item.body]),
    },
    {
      id: "latest-signals",
      group: "page",
      title: t.signals.title,
      description: t.signals.lede,
      href: "/#latest-signals",
      keywords: [
        t.signals.label,
        t.signals.listTitle,
        ...Object.values(t.signals.kinds),
      ],
    },
    {
      id: "work",
      group: "page",
      title: home.work.title,
      description: home.work.lede,
      href: "/#work",
      keywords: ["work", "selected work", "작업", "제품", "오픈소스"],
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
      id: "contact",
      group: "page",
      title: t.nav.contact,
      description: home.contact.lede,
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
    ...workItems.filter((item) => item.category === "product").map((item) => ({
      id: item.slug,
      group: "product" as const,
      title: item.title,
      description: item.summary[locale],
      href: "/#work",
      keywords: [item.slug, ...item.tags],
    })),
    ...openSourceRows.filter((row) => row.public && row.href).map((row) => ({
      id: row.id,
      group: "open-source" as const,
      title: row.title[locale],
      description: row.description[locale],
      href: row.href!,
      keywords: [row.language ?? "", "github"],
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
    .map(({ result }) => toSiteSearchResult(result))

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
