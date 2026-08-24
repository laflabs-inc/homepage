import "server-only"

import type { AdminActor } from "@/lib/auth/admin-api"
import { agentStore } from "@/lib/agent/store"
import type { AgentSettings } from "@/lib/agent/types"
import { aiTextProvider, type AiTextProvider } from "@/lib/ai/provider"
import { buildSummaryPrompt } from "@/lib/ai/prompts"
import { createAiQuotaService, type SummaryReservation } from "@/lib/ai/quota"
import { aiQuotaStore } from "@/lib/ai/store"
import { documentService } from "@/lib/documents/service"
import type { DocumentRevision, SummaryGenerationMetadata } from "@/lib/documents/types"

const SUMMARY_STORAGE_CHARACTER_LIMIT = 240
const SUMMARY_SOURCE_CHARACTER_LIMIT = 16_000

type SummaryDocumentService = {
  getRevision(revisionId: string): Promise<DocumentRevision | null>
  updateDraftSummary(
    revisionId: string,
    summary: string,
    actor: AdminActor,
    metadata: SummaryGenerationMetadata,
  ): Promise<DocumentRevision>
  publish(revisionId: string, actor: AdminActor): Promise<DocumentRevision>
}

type SummaryQuotaService = {
  reserveSummary(input: { prompt: string; source: string }): Promise<SummaryReservation>
  reconcileSummaryUsage(
    reservation: SummaryReservation,
    usage: { inputTokens: number; outputTokens: number; totalTokens: number },
  ): Promise<boolean>
  releaseReservation(reservationId: string): Promise<boolean>
  getRemainingMonthlyBudget(): Promise<{
    month: string
    limitMicrousd: number
    actualCostMicrousd: number
    reservedCostMicrousd: number
    remainingMicrousd: number
    exhausted: boolean
  }>
}

type SummaryServiceDependencies = {
  documents: SummaryDocumentService
  quota: SummaryQuotaService
  provider: AiTextProvider
  settings: Pick<{ getSettings(): Promise<AgentSettings> }, "getSettings">
  now: () => Date
}

export class SummaryGenerationError extends Error {
  constructor(public readonly code: "not_found" | "not_draft" | "provider_unavailable" | "invalid_response") {
    super(code === "not_found"
      ? "Document revision was not found"
      : code === "not_draft"
        ? "Only draft revisions can receive an AI summary"
        : code === "invalid_response"
          ? "AI returned an invalid summary"
          : "AI summary generation is unavailable")
    this.name = "SummaryGenerationError"
  }
}

function boundedSource(source: string): string {
  return Array.from(source).slice(0, SUMMARY_SOURCE_CHARACTER_LIMIT).join("")
}

function normalizedSummary(text: string): string {
  const normalized = text.replace(/\s+/gu, " ").trim()
  if (!normalized) throw new SummaryGenerationError("invalid_response")
  return Array.from(normalized).slice(0, SUMMARY_STORAGE_CHARACTER_LIMIT).join("")
}

const quotaService = createAiQuotaService(aiQuotaStore, agentStore)

const defaultDependencies: SummaryServiceDependencies = {
  documents: documentService,
  quota: quotaService,
  provider: aiTextProvider,
  settings: agentStore,
  now: () => new Date(),
}

export function createSummaryService(dependencies: SummaryServiceDependencies = defaultDependencies) {
  async function generateDraftSummary(revisionId: string, actor: AdminActor) {
    const revision = await dependencies.documents.getRevision(revisionId)
    if (!revision) throw new SummaryGenerationError("not_found")
    if (revision.status !== "draft") throw new SummaryGenerationError("not_draft")

    const source = boundedSource(revision.bodyMarkdown)
    const prompt = buildSummaryPrompt({ locale: revision.locale, title: revision.title, bodyMarkdown: source })
    const budgetPrompt = buildSummaryPrompt({ locale: revision.locale, title: revision.title, bodyMarkdown: "" })
    const budgetSource = JSON.stringify(source).slice(1, -1)
    const reservation = await dependencies.quota.reserveSummary({ prompt: budgetPrompt, source: budgetSource })

    let result: Awaited<ReturnType<AiTextProvider["generateSummary"]>>
    try {
      result = await dependencies.provider.generateSummary({
        prompt,
        maxOutputTokens: reservation.maxOutputTokens,
      })
    } catch {
      try {
        await dependencies.quota.releaseReservation(reservation.id)
      } catch {
        // The short-lived reservation expires automatically if release is unavailable.
      }
      throw new SummaryGenerationError("provider_unavailable")
    }

    const reconciled = await dependencies.quota.reconcileSummaryUsage(reservation, result.usage)
    if (!reconciled) throw new SummaryGenerationError("provider_unavailable")

    const summary = normalizedSummary(result.text)
    await dependencies.documents.updateDraftSummary(revisionId, summary, actor, {
      model: result.model,
      generatedAt: dependencies.now(),
    })
    return {
      summary,
      remainingMonthlyBudget: await dependencies.quota.getRemainingMonthlyBudget(),
    }
  }

  return {
    generateDraftSummary,

    async publishWithSummaryPolicy(revisionId: string, actor: AdminActor): Promise<DocumentRevision> {
      const revision = await dependencies.documents.getRevision(revisionId)
      if (!revision) throw new SummaryGenerationError("not_found")
      if (revision.summary.trim()) return dependencies.documents.publish(revisionId, actor)

      const settings = await dependencies.settings.getSettings()
      if (settings.summaryPolicy === "automatic") {
        await generateDraftSummary(revisionId, actor)
      }
      return dependencies.documents.publish(revisionId, actor)
    },
  }
}

export const summaryService = createSummaryService()
