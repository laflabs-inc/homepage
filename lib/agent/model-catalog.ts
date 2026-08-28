export type AgentModelCatalogItem = {
  id: string
  label: string
  description: string
  inputPriceMicrousdPerMillion: number
  outputPriceMicrousdPerMillion: number
  pricingCheckedAt: string
  pricingSource: string
  recommended: boolean
}

const pricingSource = "https://developers.openai.com/api/docs/models"
const pricingCheckedAt = "2026-08-27T00:00:00.000Z"

export const supportedAgentModelIds = [
  "gpt-5.6-luna",
  "gpt-5.6-terra",
  "gpt-5.6-sol",
] as const

export const agentModelCatalog = [
  {
    id: "gpt-5.6-luna",
    label: "GPT-5.6 Luna",
    description: "Fast, cost-sensitive document summaries",
    inputPriceMicrousdPerMillion: 200_000,
    outputPriceMicrousdPerMillion: 1_200_000,
    pricingCheckedAt,
    pricingSource,
    recommended: true,
  },
  {
    id: "gpt-5.6-terra",
    label: "GPT-5.6 Terra",
    description: "Balanced quality for nuanced company documents",
    inputPriceMicrousdPerMillion: 2_000_000,
    outputPriceMicrousdPerMillion: 12_000_000,
    pricingCheckedAt,
    pricingSource,
    recommended: false,
  },
  {
    id: "gpt-5.6-sol",
    label: "GPT-5.6 Sol",
    description: "Highest-capability option for demanding summaries",
    inputPriceMicrousdPerMillion: 4_000_000,
    outputPriceMicrousdPerMillion: 20_000_000,
    pricingCheckedAt,
    pricingSource,
    recommended: false,
  },
] as const satisfies readonly AgentModelCatalogItem[]

export type SupportedAgentModelId = typeof supportedAgentModelIds[number]

export const defaultAgentModelId: SupportedAgentModelId = "gpt-5.6-luna"

export function getAgentModel(modelId: string): typeof agentModelCatalog[number] | null {
  return agentModelCatalog.find(({ id }) => id === modelId) ?? null
}
