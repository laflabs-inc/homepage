import { describe, expect, it, vi } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

import { handleGenerateDocumentSummary } from "@/app/api/admin/documents/[revisionId]/summary/route"
import type { AdminActor } from "@/lib/auth/admin-api"
import { AiQuotaError } from "@/lib/ai/quota"
import { SummaryGenerationError } from "@/lib/ai/summary"

const revisionId = "8ca55b3d-a4fc-4a41-b922-a0a9c32d7131"
const actor: AdminActor = { githubId: "github:42", name: "Admin" }
const remainingMonthlyBudget = {
  month: "2026-08",
  limitMicrousd: 50_000_000,
  actualCostMicrousd: 10_000,
  reservedCostMicrousd: 0,
  remainingMicrousd: 49_990_000,
  exhausted: false,
}

function request(body = "{}") {
  return new Request(`https://laflabs.com/api/admin/documents/${revisionId}/summary`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://laflabs.com" },
    body,
  })
}

function dependencies() {
  return {
    authorize: vi.fn(async () => ({ ok: true as const, actor })),
    sameOrigin: vi.fn(() => true),
    generate: vi.fn(async () => ({ summary: "Generated summary", remainingMonthlyBudget })),
  }
}

describe("admin document summary route", () => {
  it("checks authorization before origin, body, UUID, and service work", async () => {
    const deps = dependencies()
    deps.authorize.mockResolvedValue({
      ok: false as const,
      response: Response.json({ error: "unauthorized" }, { status: 401 }),
    } as never)

    const response = await handleGenerateDocumentSummary(request("not-json"), "not-a-uuid", deps)

    expect(response.status).toBe(401)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(deps.sameOrigin).not.toHaveBeenCalled()
    expect(deps.generate).not.toHaveBeenCalled()
  })

  it("checks same-origin before parsing the request body", async () => {
    const deps = dependencies()
    deps.sameOrigin.mockReturnValue(false)

    const response = await handleGenerateDocumentSummary(request("not-json"), revisionId, deps)

    expect(response.status).toBe(403)
    expect(deps.generate).not.toHaveBeenCalled()
  })

  it.each([
    [request("not-json"), revisionId],
    [request(JSON.stringify({ prompt: "must not be accepted" })), revisionId],
    [request(), "not-a-uuid"],
  ])("rejects malformed body, extra context, or invalid revision ID before service work", async (input, id) => {
    const deps = dependencies()

    const response = await handleGenerateDocumentSummary(input, id, deps)

    expect(response.status).toBe(400)
    expect(deps.generate).not.toHaveBeenCalled()
  })

  it("returns only the saved summary and remaining estimated monthly budget", async () => {
    const deps = dependencies()

    const response = await handleGenerateDocumentSummary(request(), revisionId, deps)

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    const payload = await response.json()
    expect(payload).toEqual({
      summary: "Generated summary",
      remainingMonthlyBudget: {
        month: "2026-08",
        remainingMicrousd: 49_990_000,
        exhausted: false,
      },
    })
    expect(deps.generate).toHaveBeenCalledWith(revisionId, actor)
    expect(JSON.stringify(payload)).not.toContain("prompt")
    expect(JSON.stringify(payload)).not.toContain("actualCost")
    expect(JSON.stringify(payload)).not.toContain("reservedCost")
  })

  it.each([
    [new SummaryGenerationError("not_found"), 404, "not_found"],
    [new SummaryGenerationError("not_draft"), 409, "not_draft"],
    [new SummaryGenerationError("provider_unavailable"), 503, "provider_unavailable"],
    [new SummaryGenerationError("invalid_response"), 503, "invalid_response"],
    [new AiQuotaError("monthly_limit", "raw budget details"), 429, "monthly_limit"],
    [new Error("raw provider response and draft"), 503, "unavailable"],
  ] as const)("maps failures to safe no-store responses", async (error, status, code) => {
    const deps = dependencies()
    deps.generate.mockRejectedValue(error)

    const response = await handleGenerateDocumentSummary(request(), revisionId, deps)

    expect(response.status).toBe(status)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(await response.json()).toEqual({ error: code })
  })
})
