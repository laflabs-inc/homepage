import { describe, expect, it } from "vitest"

import {
  agentModelCatalog,
  defaultAgentModelId,
  getAgentModel,
} from "@/lib/agent/model-catalog"

describe("Agent model catalog", () => {
  it("uses the cost-sensitive summary model as the default", () => {
    expect(defaultAgentModelId).toBe("gpt-5.6-luna")
    expect(getAgentModel(defaultAgentModelId)).toMatchObject({
      inputPriceMicrousdPerMillion: 200_000,
      outputPriceMicrousdPerMillion: 1_200_000,
      recommended: true,
    })
  })

  it("contains only the supported summary models with official pricing sources", () => {
    expect(agentModelCatalog.map(({ id }) => id)).toEqual([
      "gpt-5.6-luna",
      "gpt-5.6-terra",
      "gpt-5.6-sol",
    ])
    expect(agentModelCatalog.every(({ pricingSource }) => (
      pricingSource.startsWith("https://developers.openai.com/")
    ))).toBe(true)
  })

  it("does not accept arbitrary provider model IDs", () => {
    expect(getAgentModel("not-supported")).toBeNull()
    expect(getAgentModel(" GPT-5.6-LUNA ")).toBeNull()
  })
})
