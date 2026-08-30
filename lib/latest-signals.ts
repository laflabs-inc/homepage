import type { Locale } from "@/lib/i18n"

export const signalKinds = ["notice", "disclosure"] as const

export type LatestSignalKind = (typeof signalKinds)[number]

export type LatestSignal = {
  id: string
  kind: LatestSignalKind
  locale: Locale
  slug: string
  category: string | null
  title: string
  summary: string
  publishedAt: string
}

export type PublicSignalPage = {
  items: LatestSignal[]
}

const sectionByKind: Record<LatestSignalKind, string> = {
  notice: "/notices",
  disclosure: "/disclosures",
}

export function mergeLatestSignals(
  pages: readonly PublicSignalPage[],
  limit = 3,
): LatestSignal[] {
  return pages
    .flatMap(({ items }) => items)
    .filter((item): item is LatestSignal => signalKinds.includes(item.kind))
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt))
    .slice(0, limit)
}

export function getLatestSignalHref(
  signal: Pick<LatestSignal, "kind" | "slug">,
  locale: Locale,
): string {
  return `${sectionByKind[signal.kind]}/${signal.slug}?locale=${locale}`
}
