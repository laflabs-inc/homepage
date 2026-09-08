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
  const company = locale === "ko" ? {
    title: "분야를 가리지 않고, 필요한 것을 만듭니다.",
    description: "아이덴티티, 결제, 클라우드, 오픈소스. 문제는 달라도 만드는 원칙은 같습니다.",
  } : {
    title: "We don't build for one category. We build what is needed.",
    description: "Identity, payments, cloud, and open source. Different problems, one way of building.",
  }

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
      id: "company",
      group: "page",
      title: company.title,
      description: company.description,
      href: "/#company",
      keywords: ["company", "회사", "BUILD QUIETLY", "WORK RELIABLY"],
    },
    {
      id: "build-loop",
      group: "page",
      title: t.buildLoop.title,
      description: t.buildLoop.lede,
      href: "/#build-loop",
      keywords: t.buildLoop.steps.flatMap((step) => [step.title, step.body, step.caption]),
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
