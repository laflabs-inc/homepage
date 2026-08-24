import { describe, expect, it, vi } from "vitest"

import type { AdminActor } from "@/lib/auth/admin-api"
import type { AgentSettings } from "@/lib/agent/types"
import { createSummaryService, SummaryGenerationError } from "@/lib/ai/summary"
import type { DocumentRevision } from "@/lib/documents/types"

const now = new Date("2026-08-24T10:00:00.000Z")
const actor: AdminActor = { githubId: "github:42", name: "Admin" }

const revision: DocumentRevision = {
  id: "8ca55b3d-a4fc-4a41-b922-a0a9c32d7131",
  seriesId: "c5bcf607-a48f-42b9-af99-55c70ef48640",
  kind: "notice",
  locale: "ko",
  slug: "service-update",
  category: "service",
  pinned: false,
  revision: 1,
  title: "서비스 업데이트",
  summary: "",
  bodyMarkdown: "## 변경 사항\n현재 초안 본문입니다.",
  status: "draft",
  effectiveAt: null,
  scheduledAt: null,
  publishedAt: null,
  createdBy: actor.githubId,
  updatedBy: actor.githubId,
  publishedBy: null,
  createdAt: now,
  updatedAt: now,
}

function settings(summaryPolicy: "review" | "automatic" = "review"): AgentSettings {
  return {
    id: "default",
    enabled: true,
    model: "gpt-summary",
    dailyTokenLimit: 20_000,
    dailyQuestionLimit: 10,
    maxOutputTokens: 600,
    monthlyCostLimitMicrousd: 50_000_000,
    inputPriceMicrousdPerMillion: 1_000_000,
    outputPriceMicrousdPerMillion: 2_000_000,
    pricingCheckedAt: now,
    resetTimezone: "Asia/Seoul",
    dailyResetMinute: 0,
    cookieRetentionDays: 180,
    summaryPolicy,
    version: 1,
    updatedBy: actor.githubId,
    createdAt: now,
    updatedAt: now,
  }
}

function dependencies(overrides: Record<string, unknown> = {}) {
  const reservation = {
    id: "reservation-1",
    estimatedInputTokens: 600,
    maxOutputTokens: 600,
    reservedTokens: 1_200,
    reservedCostMicrousd: 1_800,
    prices: { inputMicrousdPerMillion: 1_000_000, outputMicrousdPerMillion: 2_000_000 },
  }
  const remaining = {
    month: "2026-08",
    limitMicrousd: 50_000_000,
    actualCostMicrousd: 140,
    reservedCostMicrousd: 0,
    remainingMicrousd: 49_999_860,
    exhausted: false,
  }
  return {
    documents: {
      getRevision: vi.fn(async () => revision),
      updateDraftSummary: vi.fn(async (_id, summary) => ({ ...revision, summary })),
      publish: vi.fn(async () => ({ ...revision, summary: "Published summary", status: "published" as const })),
    },
    quota: {
      reserveSummary: vi.fn(async () => reservation),
      reconcileSummaryUsage: vi.fn(async () => true),
      releaseReservation: vi.fn(async () => true),
      getRemainingMonthlyBudget: vi.fn(async () => remaining),
    },
    provider: {
      generateSummary: vi.fn(async () => ({
        text: "  변경 사항을\n 사실대로   요약합니다.  ",
        model: "gpt-summary",
        usage: { inputTokens: 123, outputTokens: 17, totalTokens: 140 },
      })),
    },
    settings: { getSettings: vi.fn(async () => settings()) },
    now: vi.fn(() => now),
    reservation,
    remaining,
    ...overrides,
  }
}

describe("draft summary generation", () => {
  it("reserves before inference, reconciles actual usage, and updates only the draft summary", async () => {
    const order: string[] = []
    const deps = dependencies()
    deps.quota.reserveSummary.mockImplementation(async () => { order.push("reserve"); return deps.reservation })
    deps.provider.generateSummary.mockImplementation(async () => {
      order.push("provider")
      return {
        text: "  변경 사항을\n 사실대로   요약합니다.  ",
        model: "gpt-summary",
        usage: { inputTokens: 123, outputTokens: 17, totalTokens: 140 },
      }
    })
    deps.quota.reconcileSummaryUsage.mockImplementation(async () => { order.push("reconcile"); return true })
    deps.documents.updateDraftSummary.mockImplementation(async (_id, summary) => {
      order.push("update")
      return { ...revision, summary }
    })

    await expect(createSummaryService(deps).generateDraftSummary(revision.id, actor)).resolves.toEqual({
      summary: "변경 사항을 사실대로 요약합니다.",
      remainingMonthlyBudget: deps.remaining,
    })
    expect(order).toEqual(["reserve", "provider", "reconcile", "update"])
    expect(deps.documents.updateDraftSummary).toHaveBeenCalledWith(
      revision.id,
      "변경 사항을 사실대로 요약합니다.",
      actor,
      { model: "gpt-summary", generatedAt: now },
    )
    expect(deps.quota.reconcileSummaryUsage).toHaveBeenCalledTimes(1)
    expect(deps.quota.reconcileSummaryUsage).toHaveBeenCalledWith(
      deps.reservation,
      { inputTokens: 123, outputTokens: 17, totalTokens: 140 },
    )
  })

  it("releases a reservation on pre-result provider failure", async () => {
    const deps = dependencies()
    deps.provider.generateSummary.mockRejectedValue(new Error("raw provider failure"))

    await expect(createSummaryService(deps).generateDraftSummary(revision.id, actor))
      .rejects.toBeInstanceOf(SummaryGenerationError)
    expect(deps.quota.releaseReservation).toHaveBeenCalledWith(deps.reservation.id)
    expect(deps.quota.reconcileSummaryUsage).not.toHaveBeenCalled()
    expect(deps.documents.updateDraftSummary).not.toHaveBeenCalled()
  })

  it("records provider usage exactly once even when the draft update fails afterward", async () => {
    const deps = dependencies()
    deps.documents.updateDraftSummary.mockRejectedValue(new Error("draft changed"))

    await expect(createSummaryService(deps).generateDraftSummary(revision.id, actor)).rejects.toThrow()
    expect(deps.quota.reconcileSummaryUsage).toHaveBeenCalledTimes(1)
    expect(deps.quota.releaseReservation).not.toHaveBeenCalled()
  })

  it("rejects empty output and safely caps storage at 240 visible characters", async () => {
    const empty = dependencies()
    empty.provider.generateSummary.mockResolvedValue({
      text: " \n\t ", model: "gpt-summary", usage: { inputTokens: 3, outputTokens: 1, totalTokens: 4 },
    })
    await expect(createSummaryService(empty).generateDraftSummary(revision.id, actor))
      .rejects.toMatchObject({ code: "invalid_response" })
    expect(empty.quota.reconcileSummaryUsage).toHaveBeenCalledTimes(1)

    const long = dependencies()
    long.provider.generateSummary.mockResolvedValue({
      text: `${"가".repeat(239)}😀tail`,
      model: "gpt-summary",
      usage: { inputTokens: 3, outputTokens: 2, totalTokens: 5 },
    })
    await createSummaryService(long).generateDraftSummary(revision.id, actor)
    expect(long.documents.updateDraftSummary).toHaveBeenCalledWith(
      revision.id,
      `${"가".repeat(239)}😀`,
      actor,
      expect.anything(),
    )
  })

  it.each(["published", "archived", "scheduled"] as const)("rejects %s revisions before reserving", async (status) => {
    const deps = dependencies({
      documents: {
        ...dependencies().documents,
        getRevision: vi.fn(async () => ({ ...revision, status })),
      },
    })

    await expect(createSummaryService(deps).generateDraftSummary(revision.id, actor))
      .rejects.toMatchObject({ code: "not_draft" })
    expect(deps.quota.reserveSummary).not.toHaveBeenCalled()
  })
})

describe("summary publication policy", () => {
  it("publishes an existing manual summary without reading policy or calling AI", async () => {
    const deps = dependencies({
      documents: {
        ...dependencies().documents,
        getRevision: vi.fn(async () => ({ ...revision, summary: "Manual summary" })),
      },
    })

    await createSummaryService(deps).publishWithSummaryPolicy(revision.id, actor)

    expect(deps.settings.getSettings).not.toHaveBeenCalled()
    expect(deps.provider.generateSummary).not.toHaveBeenCalled()
    expect(deps.documents.publish).toHaveBeenCalledWith(revision.id, actor)
  })

  it("keeps the existing publish validation failure for review policy with an empty summary", async () => {
    const deps = dependencies()
    deps.documents.publish.mockRejectedValue(new Error("Document is incomplete and cannot be published"))

    await expect(createSummaryService(deps).publishWithSummaryPolicy(revision.id, actor)).rejects.toThrow(/incomplete/)
    expect(deps.provider.generateSummary).not.toHaveBeenCalled()
  })

  it("generates and saves an empty automatic summary before publishing", async () => {
    const order: string[] = []
    const deps = dependencies({ settings: { getSettings: vi.fn(async () => settings("automatic")) } })
    deps.documents.updateDraftSummary.mockImplementation(async (_id, summary) => {
      order.push("update")
      return { ...revision, summary }
    })
    deps.documents.publish.mockImplementation(async () => {
      order.push("publish")
      return { ...revision, summary: "generated", status: "published" }
    })

    await createSummaryService(deps).publishWithSummaryPolicy(revision.id, actor)

    expect(order).toEqual(["update", "publish"])
    expect(deps.provider.generateSummary).toHaveBeenCalledTimes(1)
  })

  it("does not publish when automatic generation or summary persistence fails", async () => {
    const generationFailure = dependencies({ settings: { getSettings: vi.fn(async () => settings("automatic")) } })
    generationFailure.provider.generateSummary.mockRejectedValue(new Error("provider failure"))
    await expect(createSummaryService(generationFailure).publishWithSummaryPolicy(revision.id, actor)).rejects.toThrow()
    expect(generationFailure.documents.publish).not.toHaveBeenCalled()

    const updateFailure = dependencies({ settings: { getSettings: vi.fn(async () => settings("automatic")) } })
    updateFailure.documents.updateDraftSummary.mockRejectedValue(new Error("draft update failure"))
    await expect(createSummaryService(updateFailure).publishWithSummaryPolicy(revision.id, actor)).rejects.toThrow()
    expect(updateFailure.documents.publish).not.toHaveBeenCalled()
  })
})
