import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const pageMocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getConfiguration: vi.fn(),
}))

vi.mock("@/app/admin/admin.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: pageMocks.requireAdmin }))
vi.mock("@/lib/agent/service", () => ({
  agentService: { getConfiguration: pageMocks.getConfiguration },
}))

import AgentPage from "@/app/admin/(protected)/agent/page"
import { AgentSettings } from "@/components/admin/agent-settings"
import type { AgentConfiguration } from "@/lib/agent/types"

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

function response(next = configuration, status = 200) {
  return Promise.resolve(Response.json(
    status < 400 ? { configuration: next } : { error: "provider_unavailable" },
    { status },
  ))
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal("fetch", vi.fn(() => response()))
  vi.spyOn(window, "confirm").mockReturnValue(true)
  pageMocks.requireAdmin.mockReset().mockResolvedValue(undefined)
  pageMocks.getConfiguration.mockReset().mockResolvedValue(configuration)
})

describe("Agent settings", () => {
  it("protects the dynamic server page and loads only the safe configuration", async () => {
    render(await AgentPage())

    expect(pageMocks.requireAdmin).toHaveBeenCalledOnce()
    expect(pageMocks.getConfiguration).toHaveBeenCalledOnce()
    expect(screen.getByRole("heading", { level: 1, name: "Agent" })).toBeInTheDocument()
  })

  it("renders every setting in the six square control groups without exposing credential data", () => {
    render(<AgentSettings initialConfiguration={configuration} />)

    for (const heading of [
      "Connection",
      "Model & pricing",
      "Visitor limits",
      "Budget",
      "Cookie",
      "Summary",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument()
    }
    expect(screen.getByRole("checkbox", { name: "Enable AI" })).not.toBeChecked()
    expect(screen.getByRole("textbox", { name: "Model" })).toHaveValue("gpt-5-mini")
    expect(screen.getByRole("spinbutton", { name: "Daily token limit" })).toHaveValue(20_000)
    expect(screen.getByRole("spinbutton", { name: "Daily question limit" })).toHaveValue(10)
    expect(screen.getByRole("spinbutton", { name: "Maximum output tokens" })).toHaveValue(600)
    expect(screen.getByRole("spinbutton", { name: "Monthly estimated cost limit (USD)" })).toHaveValue(50)
    expect(screen.getByRole("spinbutton", { name: "Input price per million tokens (USD)" })).toHaveValue(0.25)
    expect(screen.getByRole("spinbutton", { name: "Output price per million tokens (USD)" })).toHaveValue(2)
    expect(screen.getByRole("textbox", { name: "Reset timezone" })).toHaveValue("Asia/Seoul")
    expect(screen.getByLabelText("Daily reset time")).toHaveValue("00:00")
    expect(screen.getByRole("spinbutton", { name: "AI identity-cookie retention (days)" })).toHaveValue(180)
    expect(screen.getByRole("combobox", { name: "Summary policy" })).toHaveValue("review")
    expect(screen.getByText("$50.00 estimated monthly guardrail")).toBeInTheDocument()
    expect(screen.getByText(/Aug 23, 2026/)).toBeInTheDocument()
    expect(screen.getByText(/Configured · ••••01de · Verified/)).toBeInTheDocument()
    expect(screen.queryByText(configuration.credential.fingerprint!)).not.toBeInTheDocument()
    expect(screen.getByLabelText("OpenAI API key")).toHaveAttribute("type", "password")
    expect(screen.getByLabelText("OpenAI API key")).toHaveValue("")
  })

  it("warns when the model changes and saves the complete versioned settings payload", async () => {
    const user = userEvent.setup()
    render(<AgentSettings initialConfiguration={configuration} />)

    const model = screen.getByRole("textbox", { name: "Model" })
    await user.clear(model)
    await user.type(model, "gpt-5")
    expect(screen.getByRole("status")).toHaveTextContent(/disables AI, clears pricing, and requires another connection test/i)
    await user.click(screen.getByRole("button", { name: "Save settings" }))

    expect(fetch).toHaveBeenCalledWith("/api/admin/agent", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        enabled: false,
        model: "gpt-5",
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
      }),
    })
    expect(await screen.findByRole("status")).toHaveTextContent("Settings saved.")
  })

  it("requires explicit confirmation before enabling AI", async () => {
    const user = userEvent.setup()
    vi.mocked(window.confirm).mockReturnValue(false)
    render(<AgentSettings initialConfiguration={configuration} />)

    await user.click(screen.getByRole("checkbox", { name: "Enable AI" }))
    await user.click(screen.getByRole("button", { name: "Save settings" }))

    expect(window.confirm).toHaveBeenCalledWith("Enable AI for public document visitors?")
    expect(fetch).not.toHaveBeenCalled()
  })

  it("submits a replacement once, clears the password after failure, and announces the error", async () => {
    const user = userEvent.setup()
    const secret = `sk-${"z".repeat(24)}`
    vi.mocked(fetch).mockImplementationOnce(() => response(configuration, 502))
    render(<AgentSettings initialConfiguration={configuration} />)

    const input = screen.getByLabelText("OpenAI API key")
    await user.type(input, secret)
    await user.click(screen.getByRole("button", { name: "Replace credential" }))

    expect(fetch).toHaveBeenCalledWith("/api/admin/agent/credential", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: secret }),
    })
    await waitFor(() => expect(input).toHaveValue(""))
    expect(screen.getByRole("alert")).toHaveTextContent(/OpenAI could not verify the credential or model/i)
  })

  it("tests and deletes credentials, confirming deletion before the destructive request", async () => {
    const user = userEvent.setup()
    render(<AgentSettings initialConfiguration={configuration} />)
    const connection = screen.getByRole("heading", { name: "Connection" }).closest("section")!

    await user.click(within(connection).getByRole("button", { name: "Test connection" }))
    expect(fetch).toHaveBeenCalledWith("/api/admin/agent/credential/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    })

    await user.click(within(connection).getByRole("button", { name: "Delete credential" }))
    expect(window.confirm).toHaveBeenCalledWith("Delete the stored OpenAI credential and disable AI?")
    expect(fetch).toHaveBeenCalledWith("/api/admin/agent/credential", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: "{}",
    })
  })

  it("refreshes persisted disabled and failed state after a connection-test failure while retaining the error", async () => {
    const user = userEvent.setup()
    const enabled = { ...configuration, settings: { ...configuration.settings, enabled: true } }
    const failed = {
      ...configuration,
      settings: { ...configuration.settings, enabled: false, version: 4 },
      credential: { ...configuration.credential, verificationStatus: "failed" as const },
    }
    vi.mocked(fetch)
      .mockImplementationOnce(() => Promise.resolve(Response.json(
        { error: "provider_unavailable" },
        { status: 502 },
      )))
      .mockImplementationOnce(() => response(failed))
    render(<AgentSettings initialConfiguration={enabled} />)

    await user.click(screen.getByRole("button", { name: "Test connection" }))

    expect(fetch).toHaveBeenNthCalledWith(2, "/api/admin/agent", { cache: "no-store" })
    expect(await screen.findByText("AI is disabled.")).toBeInTheDocument()
    expect(screen.getByText(/Configured · ••••01de · Failed/)).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: "Enable AI" })).not.toBeChecked()
    expect(screen.getByRole("alert")).toHaveTextContent(/OpenAI could not verify the credential or model/i)
  })

  it("retains an error alert when a connection-test conflict refreshes persisted state", async () => {
    const user = userEvent.setup()
    const latest = {
      ...configuration,
      settings: { ...configuration.settings, version: 4 },
    }
    vi.mocked(fetch)
      .mockImplementationOnce(() => Promise.resolve(Response.json(
        { error: "version_conflict" },
        { status: 409 },
      )))
      .mockImplementationOnce(() => response(latest))
    render(<AgentSettings initialConfiguration={configuration} />)

    await user.click(screen.getByRole("button", { name: "Test connection" }))

    expect(fetch).toHaveBeenNthCalledWith(2, "/api/admin/agent", { cache: "no-store" })
    expect(screen.getByRole("alert")).toHaveTextContent(/settings changed during the operation/i)
  })

  it.each([
    ["rejected request", () => Promise.reject(new Error("network failed"))],
    ["malformed response", () => Promise.resolve(new Response("{", {
      status: 502,
      headers: { "content-type": "application/json" },
    }))],
  ])("refreshes safe state after a %s without replacing the generic error", async (_case, failedRequest) => {
    const user = userEvent.setup()
    const enabled = { ...configuration, settings: { ...configuration.settings, enabled: true } }
    const failed = {
      ...configuration,
      settings: { ...configuration.settings, enabled: false, version: 4 },
      credential: { ...configuration.credential, verificationStatus: "failed" as const },
    }
    vi.mocked(fetch)
      .mockImplementationOnce(failedRequest)
      .mockImplementationOnce(() => response(failed))
    render(<AgentSettings initialConfiguration={enabled} />)

    const questions = screen.getByRole("spinbutton", { name: "Daily question limit" })
    await user.clear(questions)
    await user.type(questions, "25")
    await user.click(screen.getByRole("button", { name: "Test connection" }))

    expect(fetch).toHaveBeenNthCalledWith(2, "/api/admin/agent", { cache: "no-store" })
    expect(await screen.findByText("AI is disabled.")).toBeInTheDocument()
    expect(screen.getByText(/Configured · ••••01de · Failed/)).toBeInTheDocument()
    expect(questions).toHaveValue(25)
    expect(screen.getByRole("alert")).toHaveTextContent("The Agent configuration could not be updated. Try again.")
  })

  it.each([
    "Test connection",
    "Replace credential",
    "Delete credential",
  ])("preserves unsaved settings after successful %s and uses the returned version", async (action) => {
    const user = userEvent.setup()
    const operational = {
      ...configuration,
      settings: { ...configuration.settings, version: 4 },
      credential: action === "Delete credential"
        ? {
            configured: false,
            provider: "openai" as const,
            fingerprint: null,
            verifiedModel: null,
            verificationStatus: null,
            verifiedAt: null,
            createdBy: null,
            createdAt: null,
            updatedAt: null,
          }
        : configuration.credential,
    }
    vi.mocked(fetch).mockImplementationOnce(() => response(operational))
    render(<AgentSettings initialConfiguration={configuration} />)

    const questions = screen.getByRole("spinbutton", { name: "Daily question limit" })
    await user.clear(questions)
    await user.type(questions, "25")
    if (action === "Replace credential") {
      await user.type(screen.getByLabelText("OpenAI API key"), `sk-${"r".repeat(24)}`)
    }
    await user.click(screen.getByRole("button", { name: action }))

    expect(questions).toHaveValue(25)
    await user.click(screen.getByRole("button", { name: "Save settings" }))
    const [, saveInit] = vi.mocked(fetch).mock.calls[1]
    expect(JSON.parse(String(saveInit?.body))).toMatchObject({ dailyQuestionLimit: 25, version: 4 })
  })

  it("refreshes the safe configuration after an optimistic settings conflict", async () => {
    const user = userEvent.setup()
    const latest = {
      ...configuration,
      settings: { ...configuration.settings, dailyQuestionLimit: 25, version: 4 },
    }
    vi.mocked(fetch)
      .mockImplementationOnce(() => Promise.resolve(Response.json({ error: "version_conflict" }, { status: 409 })))
      .mockImplementationOnce(() => response(latest))
    render(<AgentSettings initialConfiguration={configuration} />)

    await user.click(screen.getByRole("button", { name: "Save settings" }))

    expect(fetch).toHaveBeenNthCalledWith(2, "/api/admin/agent", { cache: "no-store" })
    expect(await screen.findByRole("spinbutton", { name: "Daily question limit" })).toHaveValue(25)
    expect(screen.getByRole("status")).toHaveTextContent("Settings changed elsewhere. Latest configuration loaded.")
  })

  it("offers a prominent kill switch that disables enabled AI without confirmation", async () => {
    const user = userEvent.setup()
    const enabled = { ...configuration, settings: { ...configuration.settings, enabled: true } }
    render(<AgentSettings initialConfiguration={enabled} />)

    await user.click(screen.getByRole("button", { name: "Disable AI now" }))

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect(init?.method).toBe("PATCH")
    expect(JSON.parse(String(init?.body))).toMatchObject({ enabled: false, version: 3 })
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it("refreshes and retries the kill switch once after a version conflict", async () => {
    const user = userEvent.setup()
    const enabled = { ...configuration, settings: { ...configuration.settings, enabled: true } }
    const latest = { ...enabled, settings: { ...enabled.settings, version: 4 } }
    const disabled = { ...configuration, settings: { ...configuration.settings, enabled: false, version: 5 } }
    vi.mocked(fetch)
      .mockImplementationOnce(() => Promise.resolve(Response.json(
        { error: "version_conflict" },
        { status: 409 },
      )))
      .mockImplementationOnce(() => response(latest))
      .mockImplementationOnce(() => response(disabled))
    render(<AgentSettings initialConfiguration={enabled} />)

    await user.click(screen.getByRole("button", { name: "Disable AI now" }))

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(fetch).toHaveBeenNthCalledWith(2, "/api/admin/agent", { cache: "no-store" })
    const [, retryInit] = vi.mocked(fetch).mock.calls[2]
    expect(JSON.parse(String(retryInit?.body))).toMatchObject({ enabled: false, version: 4 })
    expect(await screen.findByText("AI is disabled.")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("AI disabled.")
  })

  it("stops after one kill-switch retry and announces a second conflict", async () => {
    const user = userEvent.setup()
    const enabled = { ...configuration, settings: { ...configuration.settings, enabled: true } }
    const latest = { ...enabled, settings: { ...enabled.settings, version: 4 } }
    const disabled = {
      ...configuration,
      settings: { ...configuration.settings, enabled: false, version: 5 },
      credential: { ...configuration.credential, verificationStatus: "failed" as const },
    }
    vi.mocked(fetch)
      .mockImplementationOnce(() => Promise.resolve(Response.json(
        { error: "version_conflict" },
        { status: 409 },
      )))
      .mockImplementationOnce(() => response(latest))
      .mockImplementationOnce(() => Promise.resolve(Response.json(
        { error: "version_conflict" },
        { status: 409 },
      )))
      .mockImplementationOnce(() => response(disabled))
    render(<AgentSettings initialConfiguration={enabled} />)

    await user.click(screen.getByRole("button", { name: "Disable AI now" }))

    expect(fetch).toHaveBeenCalledTimes(4)
    expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(2)
    expect(fetch).toHaveBeenNthCalledWith(4, "/api/admin/agent", { cache: "no-store" })
    expect(screen.getByText("AI is disabled.")).toBeInTheDocument()
    expect(screen.getByText(/Configured · ••••01de · Failed/)).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent(/could not be disabled because settings changed again/i)
  })
})
