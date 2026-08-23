import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  unstable_cache: (callback: unknown) => callback,
}))

import { handleDocumentPublication } from "@/app/api/cron/document-publication/route"
import { handleAnalyticsRetention } from "@/app/api/cron/analytics-retention/route"
import type { DocumentRevision } from "@/lib/documents/types"

const now = new Date("2026-08-23T12:00:00.000Z")
const dueId = "8ca55b3d-a4fc-4a41-b922-a0a9c32d7131"
const failedId = "8ca55b3d-a4fc-4a41-b922-a0a9c32d7132"
const futureId = "8ca55b3d-a4fc-4a41-b922-a0a9c32d7133"

function scheduled(id: string, scheduledAt: Date, overrides: Partial<DocumentRevision> = {}): DocumentRevision {
  return {
    id,
    seriesId: "c5bcf607-a48f-42b9-af99-55c70ef48640",
    kind: "notice",
    locale: "ko",
    slug: `notice-${id.at(-1)}`,
    category: "service",
    pinned: false,
    revision: 1,
    title: "Sensitive title",
    summary: "Sensitive summary",
    bodyMarkdown: "Sensitive document contents",
    status: "scheduled",
    effectiveAt: null,
    scheduledAt,
    publishedAt: null,
    createdBy: "4242",
    updatedBy: "4242",
    publishedBy: null,
    createdAt: new Date("2026-08-23T09:00:00.000Z"),
    updatedAt: new Date("2026-08-23T09:00:00.000Z"),
    ...overrides,
  }
}

function request(secret = "cron-secret-that-is-long-enough") {
  return new Request("https://laflabs.co/api/cron/document-publication", {
    headers: { authorization: `Bearer ${secret}` },
  })
}

function reference(value: DocumentRevision) {
  return { id: value.id, kind: value.kind, locale: value.locale, slug: value.slug }
}

function service(result = {
  publishedRevisions: [reference(scheduled(dueId, new Date(now.getTime() - 60_000)))],
  failedIds: [] as string[],
}) {
  return {
    publishDue: vi.fn().mockResolvedValue(result),
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe("document publication cron", () => {
  it("rejects an invalid bearer with a no-store 401", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret-that-is-long-enough")
    const documentService = service()

    const response = await handleDocumentPublication(request("wrong-secret"), documentService, now, vi.fn())

    expect(response.status).toBe(401)
    expect(response.headers.get("cache-control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" })
    expect(documentService.publishDue).not.toHaveBeenCalled()
  })

  it("publishes due snapshots while future snapshots remain untouched", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret-that-is-long-enough")
    const documentService = service()
    const revalidate = vi.fn()

    const response = await handleDocumentPublication(request(), documentService, now, revalidate)

    expect(documentService.publishDue).toHaveBeenCalledWith(now)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      publishedCount: 1,
      failedCount: 0,
      revalidationFailedCount: 0,
      publishedIds: [dueId],
      failedIds: [],
      revalidationFailedIds: [],
    })
    expect(revalidate.mock.calls.flatMap(([tag]) => tag)).not.toContain(`documents:detail:notice:notice-${futureId.at(-1)}:ko`)
  })

  it("does not hide successful IDs when another due publication fails", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret-that-is-long-enough")
    const documentService = service({
      publishedRevisions: [reference(scheduled(dueId, new Date(now.getTime() - 60_000)))],
      failedIds: [failedId],
    })
    const revalidate = vi.fn()

    const response = await handleDocumentPublication(request(), documentService, now, revalidate)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      publishedCount: 1,
      failedCount: 1,
      revalidationFailedCount: 0,
      publishedIds: [dueId],
      failedIds: [failedId],
      revalidationFailedIds: [],
    })
    expect(revalidate.mock.calls.some(([tag]) => String(tag).includes(`notice-${dueId.at(-1)}`))).toBe(true)
    expect(revalidate.mock.calls.some(([tag]) => String(tag).includes(`notice-${failedId.at(-1)}`))).toBe(false)
  })

  it("returns only allowlisted counts and IDs, never errors or document content", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret-that-is-long-enough")
    const documentService = service({
      publishedRevisions: [reference(scheduled(dueId, new Date(now.getTime() - 60_000)))],
      failedIds: [failedId],
    })

    const response = await handleDocumentPublication(request(), documentService, now, vi.fn())
    const raw = await response.text()
    const payload = JSON.parse(raw) as Record<string, unknown>

    expect(Object.keys(payload).sort()).toEqual([
      "failedCount",
      "failedIds",
      "publishedCount",
      "publishedIds",
      "revalidationFailedCount",
      "revalidationFailedIds",
    ])
    expect(raw).not.toContain("Sensitive")
    expect(raw).not.toContain("contents")
    expect(raw).not.toContain("error")
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("keeps a committed success visible when cache revalidation fails", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret-that-is-long-enough")
    const revalidate = vi.fn(() => { throw new Error("cache unavailable") })

    const response = await handleDocumentPublication(request(), service(), now, revalidate)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      publishedIds: [dueId],
      revalidationFailedCount: 1,
      revalidationFailedIds: [dueId],
    })
  })

  it("uses committed publication metadata for exact tags when a separate metadata read fails", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret-that-is-long-enough")
    const documentService = service({
      publishedRevisions: [{ id: dueId, kind: "notice", locale: "ko", slug: "notice-1" }],
      failedIds: [],
    })
    const revalidate = vi.fn()

    const response = await handleDocumentPublication(request(), documentService, now, revalidate)

    expect(response.status).toBe(200)
    expect(revalidate).toHaveBeenCalledWith("documents:index:notice:ko", "max")
    expect(revalidate).toHaveBeenCalledWith("documents:detail:notice:notice-1:ko", "max")
    expect(revalidate).toHaveBeenCalledTimes(6)
  })

  it("returns a safe 503 when publication storage fails", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret-that-is-long-enough")
    const documentService = service()
    documentService.publishDue.mockRejectedValue(new Error("postgres://secret-host/private"))

    const response = await handleDocumentPublication(request(), documentService, now, vi.fn())

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: "unavailable" })
  })

  it("keeps analytics retention on the same extracted timing-safe bearer boundary", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret-that-is-long-enough")
    const store = {
      collectEvents: vi.fn(),
      withdrawVisitorAnalytics: vi.fn(),
      deleteBefore: vi.fn().mockResolvedValue({ events: 0, windows: 0 }),
    }

    const invalid = await handleAnalyticsRetention(new Request(
      "https://laflabs.co/api/cron/analytics-retention",
      { headers: { authorization: "Bearer wrong-secret" } },
    ), store)
    const valid = await handleAnalyticsRetention(new Request(
      "https://laflabs.co/api/cron/analytics-retention",
      { headers: { authorization: "Bearer cron-secret-that-is-long-enough" } },
    ), store, now)

    expect(invalid.status).toBe(401)
    expect(valid.status).toBe(200)
    expect(store.deleteBefore).toHaveBeenCalled()
  })
})
