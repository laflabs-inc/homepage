import "server-only"

import type { AdminActor } from "@/lib/auth/admin-api"
import { agentStore } from "@/lib/agent/store"
import type { AgentSettings } from "@/lib/agent/types"
import { AiTextProviderError, aiTextProvider, type AiTextProvider } from "@/lib/ai/provider"
import { buildSummaryPrompt } from "@/lib/ai/prompts"
import { createAiQuotaService, type SummaryReservation } from "@/lib/ai/quota"
import { aiQuotaStore } from "@/lib/ai/store"
import { documentService } from "@/lib/documents/service"
import type {
  DocumentRevision,
  SummaryGenerationMetadata,
  SummaryPromptSnapshot,
} from "@/lib/documents/types"
import { truncateSummary } from "@/lib/documents/validation"

const SUMMARY_SOURCE_CHARACTER_LIMIT = 16_000

type SummaryDocumentService = {
  getRevision(revisionId: string): Promise<DocumentRevision | null>
  updateDraftSummary(
    revisionId: string,
    summary: string,
    expected: SummaryPromptSnapshot,
    actor: AdminActor,
    metadata: SummaryGenerationMetadata,
  ): Promise<DocumentRevision>
  publish(revisionId: string, actor: AdminActor): Promise<DocumentRevision>
  publishWithExpectedSummary(
    revisionId: string,
    expected: SummaryPromptSnapshot,
    actor: AdminActor,
  ): Promise<DocumentRevision>
}

type SummaryQuotaService = {
  reserveSummary(input: { subjectId: string; prompt: string; source: string }): Promise<SummaryReservation>
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
  constructor(public readonly code: "not_found" | "not_draft" | "conflict" | "configuration_unavailable" | "provider_unavailable" | "invalid_response") {
    super(code === "not_found"
      ? "Document revision was not found"
      : code === "not_draft"
        ? "Only draft revisions can receive an AI summary"
        : code === "conflict"
          ? "The draft changed before summary generation completed"
        : code === "configuration_unavailable"
          ? "AI summary configuration is unavailable"
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
  return truncateSummary(normalized)
}

function promptSnapshot(revision: DocumentRevision): SummaryPromptSnapshot {
  return {
    title: revision.title,
    bodyMarkdown: revision.bodyMarkdown,
    summary: revision.summary,
  }
}

function sameSnapshot(revision: DocumentRevision, expected: SummaryPromptSnapshot): boolean {
  return revision.title === expected.title
    && revision.bodyMarkdown === expected.bodyMarkdown
    && revision.summary === expected.summary
}

function samePromptContent(revision: DocumentRevision, expected: SummaryPromptSnapshot): boolean {
  return revision.title === expected.title && revision.bodyMarkdown === expected.bodyMarkdown
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
  async function releaseReservation(reservationId: string): Promise<void> {
    try {
      await dependencies.quota.releaseReservation(reservationId)
    } catch {
      // The short-lived reservation expires automatically if release is unavailable.
    }
  }

  async function generate(
    revisionId: string,
    actor: AdminActor,
    automaticExpected?: SummaryPromptSnapshot,
  ) {
    const revision = await dependencies.documents.getRevision(revisionId)
    if (!revision) throw new SummaryGenerationError("not_found")
    if (revision.status !== "draft") throw new SummaryGenerationError("not_draft")
    if (automaticExpected && !sameSnapshot(revision, automaticExpected)) {
      if (samePromptContent(revision, automaticExpected) && revision.summary.trim()) return null
      throw new SummaryGenerationError("conflict")
    }

    const expected = promptSnapshot(revision)

    const source = boundedSource(revision.bodyMarkdown)
    const prompt = buildSummaryPrompt({ locale: revision.locale, title: revision.title, bodyMarkdown: source })
    const budgetPrompt = buildSummaryPrompt({ locale: revision.locale, title: revision.title, bodyMarkdown: "" })
    const budgetSource = JSON.stringify(source).slice(1, -1)
    const reservation = await dependencies.quota.reserveSummary({
      subjectId: revision.id,
      prompt: budgetPrompt,
      source: budgetSource,
    })

    let current: DocumentRevision | null
    try {
      current = await dependencies.documents.getRevision(revisionId)
    } catch (error) {
      await releaseReservation(reservation.id)
      throw error
    }
    if (!current || current.status !== "draft" || !sameSnapshot(current, expected)) {
      await releaseReservation(reservation.id)
      if (
        automaticExpected
        && current?.status === "draft"
        && samePromptContent(current, expected)
        && current.summary.trim()
      ) return null
      throw new SummaryGenerationError("conflict")
    }

    let result: Awaited<ReturnType<AiTextProvider["generateSummary"]>>
    try {
      result = await dependencies.provider.generateSummary({
        prompt,
        maxOutputTokens: reservation.maxOutputTokens,
      })
    } catch (error) {
      await releaseReservation(reservation.id)
      throw new SummaryGenerationError(error instanceof AiTextProviderError
        ? error.code
        : "provider_unavailable")
    }

    const reconciled = await dependencies.quota.reconcileSummaryUsage(reservation, result.usage)
    if (!reconciled) throw new SummaryGenerationError("provider_unavailable")

    try {
      const summary = normalizedSummary(result.text)
      await dependencies.documents.updateDraftSummary(revisionId, summary, expected, actor, {
        model: result.model,
        generatedAt: dependencies.now(),
      })
      let remainingMonthlyBudget: Awaited<ReturnType<SummaryQuotaService["getRemainingMonthlyBudget"]>> | null = null
      try {
        remainingMonthlyBudget = await dependencies.quota.getRemainingMonthlyBudget()
      } catch {
        // The summary is already saved; this advisory read must not turn success into a retry.
      }
      return {
        summary,
        remainingMonthlyBudget,
        expected: { ...expected, summary },
      }
    } finally {
      await releaseReservation(reservation.id)
    }
  }

  async function generateDraftSummary(revisionId: string, actor: AdminActor) {
    const result = await generate(revisionId, actor)
    if (!result) throw new SummaryGenerationError("conflict")
    return { summary: result.summary, remainingMonthlyBudget: result.remainingMonthlyBudget }
  }

  return {
    generateDraftSummary,

    async publishWithSummaryPolicy(revisionId: string, actor: AdminActor): Promise<DocumentRevision> {
      const revision = await dependencies.documents.getRevision(revisionId)
      if (!revision) throw new SummaryGenerationError("not_found")
      if (revision.summary.trim()) return dependencies.documents.publish(revisionId, actor)

      const settings = await dependencies.settings.getSettings()
      if (settings.summaryPolicy === "automatic") {
        const generated = await generate(revisionId, actor, promptSnapshot(revision))
        if (generated) {
          return dependencies.documents.publishWithExpectedSummary(revisionId, generated.expected, actor)
        }
      }
      return dependencies.documents.publish(revisionId, actor)
    },
  }
}

export const summaryService = createSummaryService()
