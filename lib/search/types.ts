export type SiteSearchGroup =
  | "page"
  | "product"
  | "open-source"
  | "notice"
  | "legal"
  | "disclosure"

export type SiteSearchResult = {
  id: string
  group: SiteSearchGroup
  title: string
  description: string
  href: string
}

export type SiteSearchResponse = {
  query: string
  results: SiteSearchResult[]
  partial: boolean
}
