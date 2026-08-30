import { render as renderWithTestingLibrary, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const pageMocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getConfiguration: vi.fn(),
  getAdminLocale: vi.fn(),
}))

vi.mock("@/app/admin/admin.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))
vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: pageMocks.requireAdmin }))
vi.mock("@/lib/agent/service", () => ({
  agentService: { getConfiguration: pageMocks.getConfiguration },
}))
vi.mock("@/lib/admin/locale", () => ({ getAdminLocale: pageMocks.getAdminLocale }))

import AgentPage, { generateMetadata } from "@/app/admin/(protected)/agent/page"
import { AgentSettings } from "@/components/admin/agent-settings"
import { LocaleProvider } from "@/components/i18n/locale-provider"
import type { AgentConfiguration } from "@/lib/agent/types"

const configuration: AgentConfiguration = {
  settings: {
    enabled: false,
    model: "gpt-5.6-luna",
    dailyTokenLimit: 20_000,
    dailyQuestionLimit: 10,
    maxOutputTokens: 600,
    monthlyCostLimitMicrousd: 50_000_000,
    inputPriceMicrousdPerMillion: 200_000,
    outputPriceMicrousdPerMillion: 1_200_000,
    pricingCheckedAt: new Date("2026-08-27T00:00:00.000Z"),
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
    verifiedModel: "gpt-5.6-luna",
    verificationStatus: "verified",
    verifiedAt: new Date("2026-08-23T09:00:00.000Z"),
    createdBy: "4242",
    createdAt: new Date("2026-08-23T08:00:00.000Z"),
    updatedAt: new Date("2026-08-23T09:00:00.000Z"),
  },
}

function render(ui: React.ReactNode) {
  return renderWithTestingLibrary(<LocaleProvider initialLocale="en">{ui}</LocaleProvider>)
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
  pageMocks.getAdminLocale.mockReset().mockResolvedValue("en")
})

describe("Agent settings", () => {
  it("uses the Admin locale for the Agent page title", async () => {
    pageMocks.getAdminLocale.mockResolvedValue("ko")

    await expect(generateMetadata()).resolves.toMatchObject({ title: "에이전트" })
  })

  it("renders the Agent control plane in Korean while retaining canonical models and USD prices", () => {
    render(
      <LocaleProvider initialLocale="ko">
        <AgentSettings initialConfiguration={configuration} />
      </LocaleProvider>,
    )

    expect(screen.getByRole("heading", { name: "OpenAI 연결" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "검증 후 모델 적용" })).toBeInTheDocument()
    expect(screen.getByLabelText("모델")).toHaveValue("gpt-5.6-luna")
    expect(screen.getByText("빠르고 비용 효율적인 문서 요약용 모델")).toBeInTheDocument()
    expect(screen.getByText("입력 100만 토큰당 $0.20 / 출력 100만 토큰당 $1.20")).toBeInTheDocument()
    expect(screen.getByText(/설정됨 · ••••01de · 검증됨/)).toBeInTheDocument()
    expect(screen.getByText("고급 한도")).toBeInTheDocument()
    expect(screen.getByText(/예상 월간 한도/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "지금 AI 사용 중지" })).toBeDisabled()
  })

  it("uses Korean confirmations, notices, and existing provider errors without changing requests", async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockImplementationOnce(() => Promise.resolve(Response.json(
      { error: "provider_unavailable" },
      { status: 502 },
    )))
    render(
      <LocaleProvider initialLocale="ko">
        <AgentSettings initialConfiguration={configuration} />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole("button", { name: "연결 테스트" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("OpenAI에 연결할 수 없거나 일시적으로 사용할 수 없습니다. 다시 시도하세요. 오류 코드: provider_unavailable")

    await user.click(screen.getByRole("button", { name: "인증 정보 삭제" }))
    expect(window.confirm).toHaveBeenCalledWith("저장된 OpenAI 인증 정보를 삭제하고 AI를 비활성화할까요?")
    expect(fetch).toHaveBeenLastCalledWith("/api/admin/agent/credential", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: "{}",
    })
    expect(await screen.findByRole("status")).toHaveTextContent("인증 정보를 삭제하고 AI를 비활성화했습니다.")
  })

  it("protects the dynamic server page and loads only the safe configuration", async () => {
    render(await AgentPage())

    expect(pageMocks.requireAdmin).toHaveBeenCalledOnce()
    expect(pageMocks.getConfiguration).toHaveBeenCalledOnce()
    expect(screen.getByRole("heading", { level: 1, name: "Agent" })).toBeInTheDocument()
  })

  it("renders a compact guided setup with optional limits and no editable prices", () => {
    render(<AgentSettings initialConfiguration={configuration} />)

    for (const heading of ["OpenAI setup", "Usage & policy"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument()
    }
    expect(screen.getByRole("checkbox", { name: "Enable AI" })).not.toBeChecked()
    expect(screen.getByRole("combobox", { name: "Model" })).toHaveValue("gpt-5.6-luna")
    expect(screen.getByRole("spinbutton", { name: "Monthly estimated cost limit (USD)" })).toHaveValue(50)
    expect(screen.getByRole("combobox", { name: "Summary policy" })).toHaveValue("review")
    expect(screen.getByText("$0.20 input / $1.20 output per 1M tokens")).toBeInTheDocument()
    expect(screen.queryByRole("spinbutton", { name: "Input price per million tokens (USD)" })).not.toBeInTheDocument()
    expect(screen.queryByRole("spinbutton", { name: "Output price per million tokens (USD)" })).not.toBeInTheDocument()
    expect(screen.getByText("Advanced limits")).toBeInTheDocument()
    expect(screen.getByLabelText("Daily token limit")).toHaveValue(20_000)
    expect(screen.getByLabelText("Daily question limit")).toHaveValue(10)
    expect(screen.getByLabelText("Maximum output tokens")).toHaveValue(600)
    expect(screen.getByLabelText("Reset timezone")).toHaveValue("Asia/Seoul")
    expect(screen.getByLabelText("Daily reset time")).toHaveValue("00:00")
    expect(screen.getByLabelText("AI identity-cookie retention (days)")).toHaveValue(180)
    expect(screen.getByText("$50.00 estimated monthly guardrail")).toBeInTheDocument()
    expect(screen.getByText(/Aug 27, 2026/)).toBeInTheDocument()
    expect(screen.getByText(/Configured · ••••01de · Verified/)).toBeInTheDocument()
    expect(screen.queryByText(configuration.credential.fingerprint!)).not.toBeInTheDocument()
    expect(screen.getByLabelText("OpenAI API key")).toHaveAttribute("type", "password")
    expect(screen.getByLabelText("OpenAI API key")).toHaveValue("")
  })

  it("preselects the recommended model and registers a first credential in one request", async () => {
    const user = userEvent.setup()
    const fresh: AgentConfiguration = {
      settings: {
        ...configuration.settings,
        model: null,
        inputPriceMicrousdPerMillion: null,
        outputPriceMicrousdPerMillion: null,
        pricingCheckedAt: null,
      },
      credential: {
        configured: false,
        provider: "openai",
        fingerprint: null,
        verifiedModel: null,
        verificationStatus: null,
        verifiedAt: null,
        createdBy: null,
        createdAt: null,
        updatedAt: null,
      },
    }
    const secret = `sk-${"n".repeat(24)}`
    render(<AgentSettings initialConfiguration={fresh} />)

    expect(screen.getByRole("combobox", { name: "Model" })).toHaveValue("gpt-5.6-luna")
    expect(screen.getByLabelText("OpenAI API key")).toBeRequired()
    await user.type(screen.getByLabelText("OpenAI API key"), secret)
    await user.click(screen.getByRole("button", { name: "Verify and save" }))

    expect(fetch).toHaveBeenCalledWith("/api/admin/agent/credential", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: secret, model: "gpt-5.6-luna", version: 3 }),
    })
  })

  it("verifies a different catalog model with the stored credential", async () => {
    const user = userEvent.setup()
    render(<AgentSettings initialConfiguration={configuration} />)

    await user.selectOptions(screen.getByRole("combobox", { name: "Model" }), "gpt-5.6-terra")
    expect(screen.getByText("$2.00 input / $12.00 output per 1M tokens")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Verify and apply model" }))

    expect(fetch).toHaveBeenCalledWith("/api/admin/agent/credential", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: "gpt-5.6-terra", version: 3 }),
    })
  })

  it("moves a legacy free-text model to the recommended supported selection", () => {
    const legacy = {
      ...configuration,
      settings: { ...configuration.settings, model: "gpt-legacy" },
      credential: { ...configuration.credential, verifiedModel: "gpt-legacy" },
    }
    render(<AgentSettings initialConfiguration={legacy} />)

    expect(screen.getByRole("combobox", { name: "Model" })).toHaveValue("gpt-5.6-luna")
    expect(screen.getByRole("alert")).toHaveTextContent(/gpt-legacy is no longer in the supported model catalog/i)
  })

  it("saves limits and policy without submitting model or prices", async () => {
    const user = userEvent.setup()
    render(<AgentSettings initialConfiguration={configuration} />)

    const questions = screen.getByLabelText("Daily question limit")
    await user.clear(questions)
    await user.type(questions, "25")
    await user.click(screen.getByRole("button", { name: "Save settings" }))

    const expectedBody = {
      enabled: false,
      dailyTokenLimit: 20_000,
      dailyQuestionLimit: 25,
      maxOutputTokens: 600,
      monthlyCostLimitUsd: "50",
      resetTimezone: "Asia/Seoul",
      dailyResetMinute: 0,
      cookieRetentionDays: 180,
      summaryPolicy: "review",
      version: 3,
    }
    expect(fetch).toHaveBeenCalledWith("/api/admin/agent", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(expectedBody),
    })
    expect(JSON.stringify(expectedBody)).not.toMatch(/model|price/i)
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
    await user.click(screen.getByRole("button", { name: "Verify and replace" }))

    expect(fetch).toHaveBeenCalledWith("/api/admin/agent/credential", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiKey: secret,
        model: "gpt-5.6-luna",
        version: 3,
      }),
    })
    await waitFor(() => expect(input).toHaveValue(""))
    expect(screen.getByRole("alert")).toHaveTextContent(/OpenAI could not be reached or is temporarily unavailable/i)
  })

  it.each([
    ["credential_invalid", "OpenAI rejected the API key (401)"],
    ["model_access_denied", "This API key cannot use the selected model (403)"],
    ["model_not_found", "The selected OpenAI model was not found or is unavailable to this project (404)"],
    ["verification_request_invalid", "OpenAI rejected the verification request (400/422)"],
    ["quota_exhausted", "This OpenAI project has no available API quota or credits"],
    ["rate_limited", "OpenAI rate-limited the verification request"],
    ["provider_unavailable", "OpenAI could not be reached or is temporarily unavailable"],
  ])("shows actionable OpenAI verification guidance for %s", async (code, message) => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockImplementationOnce(() => Promise.resolve(Response.json(
      { error: code },
      { status: code === "quota_exhausted" || code === "rate_limited" ? 429 : 502 },
    )))
    render(<AgentSettings initialConfiguration={configuration} />)

    await user.click(screen.getByRole("button", { name: "Test connection" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(message)
    expect(screen.getByRole("alert")).toHaveTextContent(`Error code: ${code}`)
  })

  it("renders localized safe OpenAI diagnostic details as text", async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockImplementationOnce(() => Promise.resolve(Response.json({
      error: "verification_request_invalid",
      diagnostic: {
        statusCode: 400,
        providerCode: "invalid_request_error",
        providerType: "invalid_request_error",
        providerParam: "temperature",
        requestId: "req_diagnostic_123",
        providerMessage: "Unsupported parameter: temperature",
      },
    }, { status: 502 })))
    render(<AgentSettings initialConfiguration={configuration} />)

    await user.click(screen.getByRole("button", { name: "Test connection" }))

    const details = await screen.findByText("OpenAI error details")
    expect(details.closest("details")).toBeInTheDocument()
    expect(screen.getByText("Status: 400")).toBeInTheDocument()
    expect(screen.getByText("Provider parameter: temperature")).toBeInTheDocument()
    expect(screen.getByText("Request ID: req_diagnostic_123")).toBeInTheDocument()
    expect(screen.getByText("Provider message: Unsupported parameter: temperature")).toBeInTheDocument()
  })

  it("tests and deletes credentials, confirming deletion before the destructive request", async () => {
    const user = userEvent.setup()
    render(<AgentSettings initialConfiguration={configuration} />)
    const connection = screen.getByRole("heading", { name: "OpenAI setup" }).closest("section")!

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
    expect(screen.getByRole("alert")).toHaveTextContent(/OpenAI could not be reached or is temporarily unavailable/i)
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
    "Verify and replace",
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
    if (action === "Verify and replace") {
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
