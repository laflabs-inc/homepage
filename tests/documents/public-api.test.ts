import { describe, expect, it, vi } from "vitest"

import { handleContentDetail } from "@/app/api/content/[kind]/[slug]/route"
import { handleContentList } from "@/app/api/content/route"
import type { DocumentCategoryRepository } from "@/lib/document-categories/types"
import type { DocumentRepository, PublishedDocument } from "@/lib/documents/types"
import { decodePublishedCursor, encodePublishedCursor } from "@/lib/http/cursor"

const first: PublishedDocument = {
  id: "8ca55b3d-a4fc-4a41-b922-a0a9c32d7131",
  seriesId: "c5bcf607-a48f-42b9-af99-55c70ef48640",
  kind: "notice",
  locale: "ko",
  slug: "service-update",
  category: "service",
  pinned: true,
  revision: 2,
  title: "서비스 업데이트",
  summary: "변경 사항을 안내합니다.",
  bodyMarkdown: "## 변경 사항\n본문",
  effectiveAt: new Date("2026-09-01T00:00:00.000Z"),
  publishedAt: new Date("2026-08-23T12:00:00.000Z"),
}

const category = {
  id: "00000000-0000-4000-8000-000000000001",
  kind: "notice" as const,
  slug: "engineering",
  labelKo: "기술",
  labelEn: "Engineering",
  sortOrder: 0,
  active: true,
  version: 1,
  createdBy: "42",
  updatedBy: "42",
  createdAt: new Date("2026-08-31T00:00:00.000Z"),
  updatedAt: new Date("2026-08-31T00:00:00.000Z"),
}

function repository(overrides: Partial<Pick<DocumentRepository, "listPublished" | "getPublished">> = {}) {
  return {
    listPublished: vi.fn().mockResolvedValue([first]),
    getPublished: vi.fn().mockResolvedValue({ document: first, availableLocales: ["ko"] }),
    ...overrides,
  } as Pick<DocumentRepository, "listPublished" | "getPublished">
}

function categoryRepository(categories = [category]) {
  return {
    list: vi.fn().mockResolvedValue(categories),
  } as Pick<DocumentCategoryRepository, "list">
}

function publishedDocuments(count: number): PublishedDocument[] {
  return Array.from({ length: count }, (_, index) => ({
    ...first,
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    slug: `document-${index + 1}`,
    pinned: index < 2,
    publishedAt: new Date(Date.UTC(2026, 7, 23, 12, 0, -index)),
  }))
}

describe("public content list API", () => {
  it.each([
    ["/api/content?locale=ko", "missing kind"],
    ["/api/content?kind=private&locale=ko", "unknown kind"],
    ["/api/content?kind=notice", "missing locale"],
    ["/api/content?kind=notice&locale=fr", "unknown locale"],
    ["/api/content?kind=notice&locale=ko&limit=0", "zero limit"],
    ["/api/content?kind=notice&locale=ko&limit=51", "limit above cap"],
    ["/api/content?kind=notice&locale=ko&limit=2.5", "fractional limit"],
    ["/api/content?kind=notice&locale=ko&sort=popular", "unknown sort"],
    [`/api/content?kind=notice&locale=ko&q=${"a".repeat(101)}`, "search above cap"],
    ["/api/content?kind=notice&locale=ko&kind=legal", "duplicate parameter"],
    ["/api/content?kind=notice&locale=ko&unknown=value", "unknown parameter"],
  ])("rejects %s (%s)", async (path) => {
    const store = repository()
    const response = await handleContentList(new Request(`https://laflabs.co${path}`), store)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "invalid_request" })
    expect(store.listPublished).not.toHaveBeenCalled()
  })

  it("rejects malformed and structurally incomplete opaque cursors", async () => {
    const missingPinned = Buffer.from(JSON.stringify({
      publishedAt: "2026-08-23T12:00:00.000Z",
      id: first.id,
    })).toString("base64url")

    for (const cursor of ["not-base64!", missingPinned]) {
      const response = await handleContentList(
        new Request(`https://laflabs.co/api/content?kind=notice&locale=ko&cursor=${encodeURIComponent(cursor)}`),
        repository(),
      )
      expect(response.status).toBe(400)
    }
  })

  it("rejects categories missing from the managed taxonomy before reading documents", async () => {
    const store = repository()
    const response = await handleContentList(
      new Request("https://laflabs.co/api/content?kind=notice&locale=ko&category=missing"),
      store,
      categoryRepository([]),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "invalid_category" })
    expect(store.listPublished).not.toHaveBeenCalled()
  })

  it("passes an exact managed category to the repository", async () => {
    const store = repository()
    const response = await handleContentList(
      new Request("https://laflabs.co/api/content?kind=notice&locale=ko&category=engineering"),
      store,
      categoryRepository(),
    )

    expect(response.status).toBe(200)
    expect(store.listPublished).toHaveBeenCalledWith({
      kind: "notice",
      locale: "ko",
      category: "engineering",
      sort: "latest",
      limit: 21,
      before: undefined,
    })
  })

  it("accepts an inactive managed category for historical direct links", async () => {
    const store = repository()
    const response = await handleContentList(
      new Request("https://laflabs.co/api/content?kind=notice&locale=ko&category=engineering"),
      store,
      categoryRepository([{ ...category, active: false }]),
    )

    expect(response.status).toBe(200)
    expect(store.listPublished).toHaveBeenCalledWith(expect.objectContaining({
      category: "engineering",
    }))
  })

  it("trims bounded search, applies oldest ordering, and disables shared response caching", async () => {
    const store = repository()
    const response = await handleContentList(
      new Request("https://laflabs.co/api/content?kind=notice&locale=ko&sort=oldest&q=%20%20routing%20%20"),
      store,
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(store.listPublished).toHaveBeenCalledWith({
      kind: "notice",
      locale: "ko",
      sort: "oldest",
      search: "routing",
      limit: 21,
      before: undefined,
    })
  })

  it.each([49, 50, 51])("only emits a next cursor when record %i has a successor", async (count) => {
    const documents = publishedDocuments(count)
    const listPublished = vi.fn(async (filter: Parameters<DocumentRepository["listPublished"]>[0]) => {
      const start = filter.before
        ? documents.findIndex((document) => document.id === filter.before?.id) + 1
        : 0
      return documents.slice(start, start + (filter.limit ?? 20))
    })
    const response = await handleContentList(
      new Request("https://laflabs.co/api/content?kind=notice&locale=ko&limit=50"),
      repository({ listPublished }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(Math.min(count, 50))
    if (count <= 50) {
      expect(body.nextCursor).toBeNull()
    } else {
      expect(decodePublishedCursor(body.nextCursor)).toEqual({
        pinned: documents[49].pinned,
        publishedAt: documents[49].publishedAt,
        id: documents[49].id,
      })
    }
  })

  it("normalizes repository failures without exposing their messages", async () => {
    const store = repository({ listPublished: vi.fn().mockRejectedValue(new Error("database password leaked")) })
    const response = await handleContentList(
      new Request("https://laflabs.co/api/content?kind=notice&locale=ko"),
      store,
    )

    expect(response.status).toBe(503)
    expect(response.headers.get("cache-control")).toBe("no-store")
    const body = await response.text()
    expect(JSON.parse(body)).toEqual({ error: "unavailable" })
    expect(body).not.toContain("password")
  })

  it("roundtrips the complete repository ordering key through the opaque cursor", async () => {
    const cursor = encodePublishedCursor({
      pinned: true,
      publishedAt: first.publishedAt,
      id: first.id,
    })
    expect(cursor).not.toContain(first.id)
    expect(decodePublishedCursor(cursor)).toEqual({
      pinned: true,
      publishedAt: first.publishedAt,
      id: first.id,
    })

    const store = repository()
    const response = await handleContentList(
      new Request(`https://laflabs.co/api/content?kind=notice&locale=ko&limit=1&cursor=${cursor}`),
      store,
    )

    expect(response.status).toBe(200)
    expect(store.listPublished).toHaveBeenCalledWith({
      kind: "notice",
      locale: "ko",
      sort: "latest",
      limit: 2,
      before: { pinned: true, publishedAt: first.publishedAt, id: first.id },
    })
  })

  it("returns exact published list DTOs, a next cursor, and public cache headers", async () => {
    const second = {
      ...first,
      id: "53f843e6-9b98-477d-9ddf-8a15c06905c2",
      slug: "maintenance",
      pinned: false,
      bodyMarkdown: "not returned from a list",
      publishedAt: new Date("2026-08-22T12:00:00.000Z"),
    }
    const store = repository({ listPublished: vi.fn().mockResolvedValue([first, second]) })

    const response = await handleContentList(
      new Request("https://laflabs.co/api/content?kind=notice&locale=ko&limit=1"),
      store,
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("public, max-age=60, s-maxage=300, stale-while-revalidate=600")
    expect(response.headers.get("etag")).toMatch(/^"[a-f0-9]{64}"$/)
    expect(await response.json()).toEqual({
      items: [{
        id: first.id,
        kind: "notice",
        locale: "ko",
        slug: "service-update",
        category: "service",
        pinned: true,
        revision: 2,
        title: "서비스 업데이트",
        summary: "변경 사항을 안내합니다.",
        effectiveAt: "2026-09-01T00:00:00.000Z",
        publishedAt: "2026-08-23T12:00:00.000Z",
      }],
      nextCursor: encodePublishedCursor({
        pinned: true,
        publishedAt: first.publishedAt,
        id: first.id,
      }),
    })
  })

  it("uses weak If-None-Match comparison for list revalidation", async () => {
    const url = "https://laflabs.co/api/content?kind=notice&locale=ko"
    const initial = await handleContentList(new Request(url), repository())
    const etag = initial.headers.get("etag")!

    for (const validator of [etag, `W/${etag}`, `"different", W/${etag}`, "*"]) {
      const response = await handleContentList(
        new Request(url, { headers: { "if-none-match": validator } }),
        repository(),
      )
      expect(response.status, validator).toBe(304)
      expect(response.headers.get("etag")).toBe(etag)
      expect(await response.text()).toBe("")
    }

    const changed = await handleContentList(
      new Request(url, { headers: { "if-none-match": "W/\"different\"" } }),
      repository(),
    )
    expect(changed.status).toBe(200)
  })
})

describe("public content detail API", () => {
  it("normalizes repository failures without exposing their messages", async () => {
    const store = repository({ getPublished: vi.fn().mockRejectedValue(new Error("connection secret")) })
    const response = await handleContentDetail(
      new Request("https://laflabs.co/api/content/notice/service-update?locale=ko"),
      { kind: "notice", slug: "service-update" },
      store,
    )

    expect(response.status).toBe(503)
    expect(response.headers.get("cache-control")).toBe("no-store")
    const body = await response.text()
    expect(JSON.parse(body)).toEqual({ error: "unavailable" })
    expect(body).not.toContain("secret")
  })

  it("returns 404 instead of falling back when the requested locale is unpublished", async () => {
    const store = repository({
      getPublished: vi.fn().mockResolvedValue({ document: null, availableLocales: ["ko"] }),
    })
    const response = await handleContentDetail(
      new Request("https://laflabs.co/api/content/notice/service-update?locale=en"),
      { kind: "notice", slug: "service-update" },
      store,
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: "not_found" })
    expect(store.getPublished).toHaveBeenCalledWith("notice", "service-update", "en")
  })

  it("returns the exact detail DTO with a stable ETag and supports revalidation", async () => {
    const request = new Request("https://laflabs.co/api/content/notice/service-update?locale=ko")
    const initial = await handleContentDetail(request, { kind: "notice", slug: "service-update" }, repository())
    const etag = initial.headers.get("etag")

    expect(initial.status).toBe(200)
    expect(initial.headers.get("cache-control")).toBe("public, max-age=60, s-maxage=300, stale-while-revalidate=600")
    expect(await initial.json()).toEqual({
      document: {
        id: first.id,
        kind: "notice",
        locale: "ko",
        slug: "service-update",
        category: "service",
        pinned: true,
        revision: 2,
        title: "서비스 업데이트",
        summary: "변경 사항을 안내합니다.",
        bodyMarkdown: "## 변경 사항\n본문",
        effectiveAt: "2026-09-01T00:00:00.000Z",
        publishedAt: "2026-08-23T12:00:00.000Z",
      },
      availableLocales: ["ko"],
    })

    const repeated = await handleContentDetail(request, { kind: "notice", slug: "service-update" }, repository())
    expect(repeated.headers.get("etag")).toBe(etag)

    const conditional = await handleContentDetail(
      new Request(request.url, { headers: { "if-none-match": `"other", W/${etag}` } }),
      { kind: "notice", slug: "service-update" },
      repository(),
    )
    expect(conditional.status).toBe(304)
    expect(await conditional.text()).toBe("")
  })

  it("validates kind, slug, and locale before reading the repository", async () => {
    for (const [url, params] of [
      ["https://laflabs.co/api/content/private/x?locale=ko", { kind: "private", slug: "x" }],
      ["https://laflabs.co/api/content/notice/Bad%20Slug?locale=ko", { kind: "notice", slug: "Bad Slug" }],
      ["https://laflabs.co/api/content/notice/service-update?locale=fr", { kind: "notice", slug: "service-update" }],
    ] as const) {
      const store = repository()
      const response = await handleContentDetail(new Request(url), params, store)
      expect(response.status).toBe(400)
      expect(store.getPublished).not.toHaveBeenCalled()
    }
  })
})
