import { describe, expect, it, vi } from "vitest"

vi.mock("@/auth", () => ({ auth: vi.fn() }))

import { handleGetAgent, handleUpdateAgent } from "@/app/api/admin/agent/route"
import {
  handleDeleteCredential,
  handlePutCredential,
} from "@/app/api/admin/agent/credential/route"
import { handleTestCredential } from "@/app/api/admin/agent/credential/test/route"
import { AgentServiceError } from "@/lib/agent/service"
import type { AgentConfiguration } from "@/lib/agent/types"

const actor = { githubId: "4242", name: "Laf Admin" }
const apiKey = `sk-${"x".repeat(24)}`
const configuration: AgentConfiguration = {
  settings: {
    enabled: false,
    model: "gpt-5-mini",
    dailyTokenLimit: 20_000,
    dailyQuestionLimit: 10,
    maxOutputTokens: 600,
    monthlyCostLimitMicrousd: 50_000_000,
    inputPriceMicrousdPerMillion: 250_000,
    outputPriceMicrousdPerMillion: 2_000_000,
    pricingCheckedAt: new Date("2026-08-23T09:00:00.000Z"),
    resetTimezone: "Asia/Seoul",
    dailyResetMinute: 0,
    cookieRetentionDays: 180,
    summaryPolicy: "review",
    version: 3,
    updatedBy: "4242",
    createdAt: new Date("2026-08-22T09:00:00.000Z"),
    updatedAt: new Date("2026-08-23T09:00:00.000Z"),
  },
  credential: {
    configured: true,
    provider: "openai",
    fingerprint: "7ab32c4901de",
    verifiedModel: "gpt-5-mini",
    verificationStatus: "verified",
    verifiedAt: new Date("2026-08-23T09:00:00.000Z"),
    createdBy: "4242",
    createdAt: new Date("2026-08-23T08:00:00.000Z"),
    updatedAt: new Date("2026-08-23T09:00:00.000Z"),
  },
}

const settingsBody = {
  enabled: false,
  model: "gpt-5-mini",
  dailyTokenLimit: 20_000,
  dailyQuestionLimit: 10,
  maxOutputTokens: 600,
  monthlyCostLimitUsd: "50",
  inputPriceUsdPerMillion: "0.25",
  outputPriceUsdPerMillion: "2",
  resetTimezone: "Asia/Seoul",
  dailyResetMinute: 0,
  cookieRetentionDays: 180,
  summaryPolicy: "review",
  version: 3,
}

function jsonRequest(path: string, method: string, body: unknown, origin = "https://laflabs.co") {
  return new Request(`https://laflabs.co${path}`, {
    method,
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  })
}

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    authorize: vi.fn().mockResolvedValue({ ok: true, actor }),
    sameOrigin: vi.fn().mockReturnValue(true),
    service: {
      getConfiguration: vi.fn().mockResolvedValue(configuration),
      updateSettings: vi.fn().mockResolvedValue(configuration),
      replaceCredential: vi.fn().mockResolvedValue(configuration),
      deleteCredential: vi.fn().mockResolvedValue(configuration),
      testCredential: vi.fn().mockResolvedValue(configuration),
    },
    ...overrides,
  }
}

async function expectNoStore(response: Response) {
  expect(response.headers.get("cache-control")).toBe("no-store")
}

async function expectSafeConfiguration(response: Response) {
  const payload = await response.json()
  expect(payload).toEqual({ configuration: JSON.parse(JSON.stringify(configuration)) })
  expect(JSON.stringify(payload)).not.toMatch(/apiKey|ciphertext|authTag|\"iv\"/i)
  await expectNoStore(response)
}

describe("Agent admin API", () => {
  it("returns only the safe configuration DTO from an authenticated GET", async () => {
    const deps = dependencies()
    const response = await handleGetAgent(new Request("https://laflabs.co/api/admin/agent"), deps)

    expect(response.status).toBe(200)
    expect(deps.sameOrigin).not.toHaveBeenCalled()
    await expectSafeConfiguration(response)
  })

  it.each([
    ["unauthenticated", 401],
    ["forbidden", 403],
  ])("preserves the %s authorization response and adds no-store", async (error, status) => {
    const deps = dependencies({
      authorize: vi.fn().mockResolvedValue({
        ok: false,
        response: Response.json({ error }, { status }),
      }),
    })

    const response = await handleUpdateAgent(
      jsonRequest("/api/admin/agent", "PATCH", settingsBody),
      deps,
    )

    expect(response.status).toBe(status)
    expect(deps.sameOrigin).not.toHaveBeenCalled()
    expect(deps.service.updateSettings).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ error })
    await expectNoStore(response)
  })

  it.each([
    [handleUpdateAgent, "/api/admin/agent", "PATCH", settingsBody, "updateSettings"],
    [handlePutCredential, "/api/admin/agent/credential", "PUT", { apiKey }, "replaceCredential"],
    [handleDeleteCredential, "/api/admin/agent/credential", "DELETE", {}, "deleteCredential"],
    [handleTestCredential, "/api/admin/agent/credential/test", "POST", {}, "testCredential"],
  ] as const)("rejects cross-origin %s before body parsing or service use", async (
    handler,
    path,
    method,
    body,
    serviceMethod,
  ) => {
    const deps = dependencies({ sameOrigin: vi.fn().mockReturnValue(false) })
    const request = jsonRequest(path, method, body, "https://attacker.example")
    const getReader = vi.spyOn(request.body!, "getReader")

    const response = await handler(request, deps)

    expect(response.status).toBe(403)
    expect(getReader).not.toHaveBeenCalled()
    expect(deps.service[serviceMethod]).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({ error: "forbidden" })
    await expectNoStore(response)
  })

  it("validates, converts, and sends a versioned settings update", async () => {
    const deps = dependencies()
    const response = await handleUpdateAgent(
      jsonRequest("/api/admin/agent", "PATCH", settingsBody),
      deps,
    )

    expect(deps.service.updateSettings).toHaveBeenCalledWith({
      enabled: false,
      model: "gpt-5-mini",
      dailyTokenLimit: 20_000,
      dailyQuestionLimit: 10,
      maxOutputTokens: 600,
      monthlyCostLimitMicrousd: 50_000_000,
      inputPriceMicrousdPerMillion: 250_000,
      outputPriceMicrousdPerMillion: 2_000_000,
      resetTimezone: "Asia/Seoul",
      dailyResetMinute: 0,
      cookieRetentionDays: 180,
      summaryPolicy: "review",
      version: 3,
    }, actor)
    await expectSafeConfiguration(response)
  })

  it("accepts a credential only at PUT and never serializes it", async () => {
    const deps = dependencies()
    const response = await handlePutCredential(
      jsonRequest("/api/admin/agent/credential", "PUT", { apiKey }),
      deps,
    )

    expect(deps.service.replaceCredential).toHaveBeenCalledWith(apiKey, actor)
    expect(await response.clone().text()).not.toContain(apiKey)
    await expectSafeConfiguration(response)
  })

  it.each([
    [handleUpdateAgent, "/api/admin/agent", "PATCH", { ...settingsBody, apiKey }, "updateSettings"],
    [handleDeleteCredential, "/api/admin/agent/credential", "DELETE", { apiKey }, "deleteCredential"],
    [handleTestCredential, "/api/admin/agent/credential/test", "POST", { apiKey }, "testCredential"],
  ] as const)("rejects secret-bearing JSON outside credential PUT", async (
    handler,
    path,
    method,
    body,
    serviceMethod,
  ) => {
    const deps = dependencies()
    const response = await handler(jsonRequest(path, method, body), deps)

    expect(response.status).toBe(422)
    expect(deps.service[serviceMethod]).not.toHaveBeenCalled()
    expect(await response.text()).not.toContain(apiKey)
    await expectNoStore(response)
  })

  it("rejects an invalid credential shape without echoing the submitted value", async () => {
    const deps = dependencies()
    const submitted = "not-a-provider-credential"
    const response = await handlePutCredential(
      jsonRequest("/api/admin/agent/credential", "PUT", { apiKey: submitted }),
      deps,
    )

    expect(response.status).toBe(422)
    expect(deps.service.replaceCredential).not.toHaveBeenCalled()
    expect(await response.text()).not.toContain(submitted)
    await expectNoStore(response)
  })

  it.each([
    [handleUpdateAgent, "/api/admin/agent", "PATCH", settingsBody],
    [handlePutCredential, "/api/admin/agent/credential", "PUT", { apiKey }],
    [handleDeleteCredential, "/api/admin/agent/credential", "DELETE", {}],
    [handleTestCredential, "/api/admin/agent/credential/test", "POST", {}],
  ] as const)("enforces the 16 KiB body cap", async (handler, path, method, body) => {
    const deps = dependencies()
    const request = jsonRequest(path, method, body)
    request.headers.set("content-length", String(16 * 1024 + 1))

    const response = await handler(request, deps)

    expect(response.status).toBe(413)
    await expect(response.json()).resolves.toEqual({ error: "payload_too_large" })
    await expectNoStore(response)
  })

  it("deletes and tests the configured credential with empty JSON bodies", async () => {
    const deleteDeps = dependencies()
    const deleteResponse = await handleDeleteCredential(
      jsonRequest("/api/admin/agent/credential", "DELETE", {}),
      deleteDeps,
    )
    expect(deleteDeps.service.deleteCredential).toHaveBeenCalledWith(actor)
    await expectSafeConfiguration(deleteResponse)

    const testDeps = dependencies()
    const testResponse = await handleTestCredential(
      jsonRequest("/api/admin/agent/credential/test", "POST", {}),
      testDeps,
    )
    expect(testDeps.service.testCredential).toHaveBeenCalledWith(actor)
    await expectSafeConfiguration(testResponse)
  })

  it.each([
    ["invalid_settings", 422],
    ["version_conflict", 409],
    ["credential_unavailable", 409],
    ["model_unverified", 409],
    ["credential_invalid", 502],
    ["provider_unavailable", 502],
    ["encryption_unavailable", 503],
  ] as const)("maps %s to a safe %i response", async (code, status) => {
    const deps = dependencies()
    deps.service.testCredential.mockRejectedValue(new AgentServiceError(code, `${apiKey}: provider detail`))

    const response = await handleTestCredential(
      jsonRequest("/api/admin/agent/credential/test", "POST", {}),
      deps,
    )

    expect(response.status).toBe(status)
    const safeBody = response.clone()
    await expect(response.json()).resolves.toEqual({ error: code })
    expect(await safeBody.text()).not.toContain(apiKey)
    await expectNoStore(response)
  })

  it("normalizes unknown failures without exposing their details", async () => {
    const deps = dependencies()
    deps.service.getConfiguration.mockRejectedValue(new Error(`${apiKey}: database detail`))

    const response = await handleGetAgent(new Request("https://laflabs.co/api/admin/agent"), deps)

    expect(response.status).toBe(503)
    const safeBody = response.clone()
    await expect(response.json()).resolves.toEqual({ error: "unavailable" })
    expect(await safeBody.text()).not.toContain(apiKey)
    await expectNoStore(response)
  })
})
