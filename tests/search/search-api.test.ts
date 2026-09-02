import { beforeEach, describe, expect, it, vi } from "vitest"

import type { PublishedDocumentReader } from "@/lib/documents/cache"
import type { SiteSearchResponse } from "@/lib/search/types"

const { searchSiteMock } = vi.hoisted(() => ({
  searchSiteMock: vi.fn(),
}))

vi.mock("@/lib/search/site-search", () => ({ searchSite: searchSiteMock }))

import { handleSiteSearch } from "@/app/api/search/route"

function repository(): PublishedDocumentReader {
  return {
    listPublished: vi.fn(),
    getPublished: vi.fn(),
  }
}

function request(query = "q=Laf%20ID&locale=ko") {
  return new Request(`https://laflabs.co/api/search?${query}`)
}

const payload: SiteSearchResponse = {
  query: "Laf ID",
  results: [{
    id: "laf-id",
    group: "product",
    title: "Laf ID",
    description: "Identity infrastructure.",
    href: "/#products",
  }],
  partial: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  searchSiteMock.mockResolvedValue(payload)
})

describe("public site search API", () => {
  it.each([
    ["", "missing query"],
    ["q=a&locale=ko", "one-character query"],
    [`q=${"a".repeat(101)}&locale=ko`, "query above the cap"],
    ["q=Laf%20ID&q=other&locale=ko", "duplicate query"],
    ["q=Laf%20ID&locale=ko&extra=value", "unknown parameter"],
    ["q=Laf%20ID&locale=fr", "unsupported locale"],
  ])("rejects %s (%s) with a stable error body", async (query) => {
    const response = await handleSiteSearch(request(query), repository())

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "invalid_request" })
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(searchSiteMock).not.toHaveBeenCalled()
  })

  it("trims a valid query, forwards the locale and repository, and returns no-store search results", async () => {
    const repositoryOverride = repository()
    const response = await handleSiteSearch(
      request("q=%20Laf%20ID%20&locale=ko"),
      repositoryOverride,
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(searchSiteMock).toHaveBeenCalledWith("Laf ID", "ko", repositoryOverride)
    await expect(response.json()).resolves.toEqual(payload)
  })

  it("hides search failures behind an unavailable error", async () => {
    searchSiteMock.mockRejectedValueOnce(new Error("DATABASE_URL=postgres://secret"))

    const response = await handleSiteSearch(request(), repository())

    expect(response.status).toBe(503)
    expect(response.headers.get("cache-control")).toBe("no-store")
    const body = await response.text()
    expect(JSON.parse(body)).toEqual({ error: "unavailable" })
    expect(body).not.toContain("postgres")
    expect(body).not.toContain("secret")
  })
})
