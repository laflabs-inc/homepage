import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  unstable_cache: (callback: unknown) => callback,
}))

import { handleCreateDocument, handleListDocuments } from "@/app/api/admin/documents/route"
import {
  handleDeleteDocument,
  handleGetDocument,
  handleUpdateDocument,
} from "@/app/api/admin/documents/[revisionId]/route"
import { handleScheduleDocument } from "@/app/api/admin/documents/[revisionId]/schedule/route"
import { handleUnscheduleDocument } from "@/app/api/admin/documents/[revisionId]/unschedule/route"
import { handlePublishDocument } from "@/app/api/admin/documents/[revisionId]/publish/route"
import { handleArchiveDocument } from "@/app/api/admin/documents/[revisionId]/archive/route"
import { handleNewRevision } from "@/app/api/admin/documents/[revisionId]/new-revision/route"
import { DocumentServiceError } from "@/lib/documents/service"
import type { DocumentRevision } from "@/lib/documents/types"

const actor = { githubId: "4242", name: "Laf Admin" }
const revisionId = "8ca55b3d-a4fc-4a41-b922-a0a9c32d7131"

const revision: DocumentRevision = {
  id: revisionId,
  seriesId: "c5bcf607-a48f-42b9-af99-55c70ef48640",
  kind: "notice",
  locale: "ko",
  slug: "service-update",
  category: "service",
  pinned: false,
  revision: 1,
  title: "서비스 업데이트",
  summary: "변경 사항을 안내합니다.",
  bodyMarkdown: "## 변경 사항\n본문입니다.",
  status: "draft",
  effectiveAt: null,
  scheduledAt: null,
  publishedAt: null,
  createdBy: "4242",
  updatedBy: "4242",
  publishedBy: null,
  createdAt: new Date("2026-08-23T09:00:00.000Z"),
  updatedAt: new Date("2026-08-23T09:00:00.000Z"),
}

const draftInput = {
  kind: "notice",
  locale: "ko",
  slug: "service-update",
  category: "service",
  pinned: false,
  title: "서비스 업데이트",
  summary: "변경 사항을 안내합니다.",
  bodyMarkdown: "## 변경 사항\n본문입니다.",
  effectiveAt: null,
}

function jsonRequest(path: string, body: unknown, init: RequestInit = {}) {
  return new Request(`https://laflabs.co${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://laflabs.co" },
    body: JSON.stringify(body),
    ...init,
  })
}

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    authorize: vi.fn().mockResolvedValue({ ok: true, actor }),
    sameOrigin: vi.fn().mockReturnValue(true),
    service: {
      createDraft: vi.fn().mockResolvedValue(revision),
      createEnglishDraft: vi.fn().mockResolvedValue({ ...revision, locale: "en" }),
      updateDraft: vi.fn().mockResolvedValue(revision),
      deleteDraft: vi.fn().mockResolvedValue(undefined),
      schedule: vi.fn().mockResolvedValue({ ...revision, status: "scheduled" }),
      returnScheduledToDraft: vi.fn().mockResolvedValue(revision),
      publish: vi.fn().mockResolvedValue({ ...revision, status: "published" }),
      archive: vi.fn().mockResolvedValue({ ...revision, status: "archived" }),
      createNextDraft: vi.fn().mockResolvedValue({ ...revision, revision: 2 }),
      listAdmin: vi.fn().mockResolvedValue([revision]),
    },
    revalidate: vi.fn(),
    ...overrides,
  }
}

async function expectNoStore(response: Response) {
  expect(response.headers.get("cache-control")).toBe("no-store")
}

beforeEach(() => vi.restoreAllMocks())

describe("admin document collection", () => {
  it("authenticates list reads and returns only revisions with no-store", async () => {
    const deps = dependencies()
    const response = await handleListDocuments(
      new Request("https://laflabs.co/api/admin/documents?kind=notice&locale=ko&status=draft"),
      deps,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ revisions: [expect.objectContaining({ id: revisionId })] })
    expect(deps.service.listAdmin).toHaveBeenCalledWith({ kind: "notice", locale: "ko", status: "draft" })
    await expectNoStore(response)
  })

  it("returns the existing 401 decision before checking origin or reading the body", async () => {
    const calls: string[] = []
    const deps = dependencies({
      authorize: vi.fn(async () => {
        calls.push("authorize")
        return { ok: false as const, response: Response.json({ error: "unauthenticated" }, { status: 401 }) }
      }),
      sameOrigin: vi.fn(() => {
        calls.push("origin")
        return true
      }),
    })
    const request = jsonRequest("/api/admin/documents", draftInput)
    const text = vi.spyOn(request, "text")

    const response = await handleCreateDocument(request, deps)

    expect(response.status).toBe(401)
    expect(calls).toEqual(["authorize"])
    expect(text).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ error: "unauthenticated" })
    await expectNoStore(response)
  })

  it("preserves the existing 403 authorization decision", async () => {
    const deps = dependencies({
      authorize: vi.fn().mockResolvedValue({
        ok: false,
        response: Response.json({ error: "forbidden" }, { status: 403 }),
      }),
    })

    const response = await handleCreateDocument(jsonRequest("/api/admin/documents", draftInput), deps)

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "forbidden" })
    await expectNoStore(response)
  })

  it("rejects cross-origin mutation before reading JSON or calling the service", async () => {
    const deps = dependencies({ sameOrigin: vi.fn().mockReturnValue(false) })
    const request = jsonRequest("/api/admin/documents", draftInput, {
      headers: { "content-type": "application/json", origin: "https://attacker.example" },
    })
    const text = vi.spyOn(request, "text")

    const response = await handleCreateDocument(request, deps)

    expect(response.status).toBe(403)
    expect(text).not.toHaveBeenCalled()
    expect(deps.service.createDraft).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ error: "forbidden" })
    await expectNoStore(response)
  })

  it("rejects non-JSON content before parsing", async () => {
    const deps = dependencies()
    const request = new Request("https://laflabs.co/api/admin/documents", {
      method: "POST",
      headers: { "content-type": "text/plain", origin: "https://laflabs.co" },
      body: JSON.stringify(draftInput),
    })
    const text = vi.spyOn(request, "text")

    const response = await handleCreateDocument(request, deps)

    expect(response.status).toBe(415)
    expect(text).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ error: "unsupported_media_type" })
    await expectNoStore(response)
  })

  it("rejects a declared body above one MiB before reading it", async () => {
    const deps = dependencies()
    const request = jsonRequest("/api/admin/documents", draftInput, {
      headers: {
        "content-type": "application/json",
        origin: "https://laflabs.co",
        "content-length": String(1024 * 1024 + 1),
      },
    })
    const text = vi.spyOn(request, "text")

    const response = await handleCreateDocument(request, deps)

    expect(response.status).toBe(413)
    expect(text).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ error: "payload_too_large" })
  })

  it("measures the actual UTF-8 body and rejects an undeclared body above one MiB", async () => {
    const deps = dependencies()
    const request = jsonRequest("/api/admin/documents", {
      ...draftInput,
      bodyMarkdown: "한".repeat(350_000),
    })

    const response = await handleCreateDocument(request, deps)

    expect(response.status).toBe(413)
    expect(deps.service.createDraft).not.toHaveBeenCalled()
  })

  it("accepts a valid maximum-length Korean document below one MiB", async () => {
    const deps = dependencies()
    const body = { ...draftInput, bodyMarkdown: "한".repeat(200_000) }

    const response = await handleCreateDocument(jsonRequest("/api/admin/documents", body), deps)

    expect(response.status).toBe(201)
    expect(deps.service.createDraft).toHaveBeenCalledWith(body, actor)
  })

  it("rejects malformed JSON without calling the service", async () => {
    const deps = dependencies()
    const request = new Request("https://laflabs.co/api/admin/documents", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://laflabs.co" },
      body: "{",
    })

    const response = await handleCreateDocument(request, deps)

    expect(response.status).toBe(400)
    expect(deps.service.createDraft).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ error: "invalid_request" })
  })

  it("rejects schema-invalid JSON before calling the service", async () => {
    const deps = dependencies()
    const response = await handleCreateDocument(jsonRequest("/api/admin/documents", {
      ...draftInput,
      locale: "fr",
    }), deps)

    expect(response.status).toBe(400)
    expect(deps.service.createDraft).not.toHaveBeenCalled()
    expect(deps.service.createEnglishDraft).not.toHaveBeenCalled()
  })

  it("validates after parsing and forwards the stable actor to draft creation", async () => {
    const calls: string[] = []
    const deps = dependencies({
      authorize: vi.fn(async () => {
        calls.push("authorize")
        return { ok: true as const, actor }
      }),
      sameOrigin: vi.fn(() => {
        calls.push("origin")
        return true
      }),
    })
    deps.service.createDraft.mockImplementation(async () => {
      calls.push("service")
      return revision
    })

    const response = await handleCreateDocument(jsonRequest("/api/admin/documents", draftInput), deps)

    expect(response.status).toBe(201)
    expect(calls).toEqual(["authorize", "origin", "service"])
    expect(deps.service.createDraft).toHaveBeenCalledWith(draftInput, actor)
    await expect(response.json()).resolves.toEqual({ revision: expect.objectContaining({ id: revisionId }) })
    await expectNoStore(response)
  })
})

describe("admin document revision actions", () => {
  it("rejects malformed revision IDs before dispatching any service method", async () => {
    const deps = dependencies()
    const malformedId = "not-a-uuid"
    const responses = [
      await handleGetDocument(
        new Request(`https://laflabs.co/api/admin/documents/${malformedId}`),
        malformedId,
        deps,
      ),
      await handleUpdateDocument(
        jsonRequest(`/api/admin/documents/${malformedId}`, draftInput, { method: "PATCH" }),
        malformedId,
        deps,
      ),
      await handleDeleteDocument(
        jsonRequest(`/api/admin/documents/${malformedId}`, {}, { method: "DELETE" }),
        malformedId,
        deps,
      ),
      await handleScheduleDocument(
        jsonRequest(`/api/admin/documents/${malformedId}/schedule`, { scheduledAt: "2099-01-01T00:00:00.000Z" }),
        malformedId,
        deps,
      ),
      await handleUnscheduleDocument(
        jsonRequest(`/api/admin/documents/${malformedId}/unschedule`, {}),
        malformedId,
        deps,
      ),
      await handlePublishDocument(
        jsonRequest(`/api/admin/documents/${malformedId}/publish`, {}),
        malformedId,
        deps,
      ),
      await handleArchiveDocument(
        jsonRequest(`/api/admin/documents/${malformedId}/archive`, {}),
        malformedId,
        deps,
      ),
      await handleNewRevision(
        jsonRequest(`/api/admin/documents/${malformedId}/new-revision`, {}),
        malformedId,
        deps,
      ),
    ]

    expect(responses.map(({ status }) => status)).toEqual([400, 400, 400, 400, 400, 400, 400, 400])
    for (const response of responses) {
      await expect(response.json()).resolves.toEqual({ error: "invalid_request" })
    }
    for (const method of Object.values(deps.service)) expect(method).not.toHaveBeenCalled()
  })

  it("gets one revision through the authenticated admin reader", async () => {
    const deps = dependencies()
    const response = await handleGetDocument(
      new Request(`https://laflabs.co/api/admin/documents/${revisionId}`),
      revisionId,
      deps,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ revision: expect.objectContaining({ id: revisionId }) })
    await expectNoStore(response)
  })

  it("maps immutable updates to a safe conflict without leaking the service message", async () => {
    const deps = dependencies()
    deps.service.updateDraft.mockRejectedValue(
      new DocumentServiceError("immutable_revision", "secret stored details"),
    )
    const request = jsonRequest(`/api/admin/documents/${revisionId}`, draftInput, { method: "PATCH" })

    const response = await handleUpdateDocument(request, revisionId, deps)

    expect(response.status).toBe(409)
    const payload = await response.json()
    expect(payload).toEqual({ error: "immutable_revision" })
    expect(JSON.stringify(payload)).not.toContain("secret stored details")
    await expectNoStore(response)
  })

  it("deletes only through the service with the authorized actor", async () => {
    const deps = dependencies()
    const response = await handleDeleteDocument(
      jsonRequest(`/api/admin/documents/${revisionId}`, {}, { method: "DELETE" }),
      revisionId,
      deps,
    )

    expect(response.status).toBe(200)
    expect(deps.service.deleteDraft).toHaveBeenCalledWith(revisionId, actor)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it("schedules with a validated date and does not invalidate public cache", async () => {
    const deps = dependencies()
    const scheduledAt = "2099-01-01T00:00:00.000Z"
    const response = await handleScheduleDocument(
      jsonRequest(`/api/admin/documents/${revisionId}/schedule`, { scheduledAt }),
      revisionId,
      deps,
    )

    expect(response.status).toBe(200)
    expect(deps.service.schedule).toHaveBeenCalledWith(revisionId, new Date(scheduledAt), actor)
    expect(deps.revalidate).not.toHaveBeenCalled()
  })

  it("returns a future scheduled revision to draft with the authorized actor", async () => {
    const deps = dependencies()
    const response = await handleUnscheduleDocument(
      jsonRequest(`/api/admin/documents/${revisionId}/unschedule`, {}),
      revisionId,
      deps,
    )

    expect(response.status).toBe(200)
    expect(deps.service.returnScheduledToDraft).toHaveBeenCalledWith(revisionId, actor)
    expect(deps.revalidate).not.toHaveBeenCalled()
  })

  it("invalidates exact public tags only after publication commits", async () => {
    const events: string[] = []
    const deps = dependencies({ revalidate: vi.fn((tag: string) => events.push(tag)) })
    deps.service.publish.mockImplementation(async () => {
      events.push("commit")
      return { ...revision, status: "published" as const }
    })

    const response = await handlePublishDocument(
      jsonRequest(`/api/admin/documents/${revisionId}/publish`, {}),
      revisionId,
      deps,
    )

    expect(response.status).toBe(200)
    expect(deps.service.publish).toHaveBeenCalledWith(revisionId, actor)
    expect(events[0]).toBe("commit")
    expect(events.slice(1)).toEqual([
      "documents",
      "documents:sitemap",
      "documents:index:notice",
      "documents:index:notice:ko",
      "documents:detail:notice:service-update",
      "documents:detail:notice:service-update:ko",
    ])
    expect(deps.revalidate.mock.calls.every(([, profile]) => profile === "max")).toBe(true)
  })

  it("does not invalidate public tags when publication fails", async () => {
    const deps = dependencies()
    deps.service.publish.mockRejectedValue(new DocumentServiceError("conflict", "not ready"))

    const response = await handlePublishDocument(
      jsonRequest(`/api/admin/documents/${revisionId}/publish`, {}),
      revisionId,
      deps,
    )

    expect(response.status).toBe(409)
    expect(deps.revalidate).not.toHaveBeenCalled()
  })

  it("archives and invalidates only after the committed public change", async () => {
    const deps = dependencies()
    const response = await handleArchiveDocument(
      jsonRequest(`/api/admin/documents/${revisionId}/archive`, {}),
      revisionId,
      deps,
    )

    expect(response.status).toBe(200)
    expect(deps.service.archive).toHaveBeenCalledWith(revisionId, actor)
    expect(deps.revalidate).toHaveBeenCalledTimes(6)
  })

  it("creates a new editable revision from immutable content", async () => {
    const deps = dependencies()
    const response = await handleNewRevision(
      jsonRequest(`/api/admin/documents/${revisionId}/new-revision`, {}),
      revisionId,
      deps,
    )

    expect(response.status).toBe(201)
    expect(deps.service.createNextDraft).toHaveBeenCalledWith(revisionId, actor)
    await expect(response.json()).resolves.toEqual({ revision: expect.objectContaining({ revision: 2 }) })
  })

  it("fails closed with a safe unavailable response for unexpected errors", async () => {
    const deps = dependencies()
    deps.service.archive.mockRejectedValue(new Error("postgres://secret-host/database"))

    const response = await handleArchiveDocument(
      jsonRequest(`/api/admin/documents/${revisionId}/archive`, {}),
      revisionId,
      deps,
    )

    expect(response.status).toBe(503)
    const payload = await response.json()
    expect(payload).toEqual({ error: "unavailable" })
    expect(JSON.stringify(payload)).not.toContain("secret-host")
    await expectNoStore(response)
  })
})
