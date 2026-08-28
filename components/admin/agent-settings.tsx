"use client"

import { useState } from "react"

import styles from "@/app/admin/admin.module.css"
import {
  agentModelCatalog,
  defaultAgentModelId,
  getAgentModel,
  type SupportedAgentModelId,
} from "@/lib/agent/model-catalog"
import type { AgentConfiguration, AgentSettingsDto } from "@/lib/agent/types"

type Draft = {
  enabled: boolean
  dailyTokenLimit: string
  dailyQuestionLimit: string
  maxOutputTokens: string
  monthlyCostLimitUsd: string
  resetTimezone: string
  dailyResetTime: string
  cookieRetentionDays: string
  summaryPolicy: "review" | "automatic"
}

type ApiPayload = { configuration?: AgentConfiguration; error?: string }

function usd(microusd: number): string {
  return String(microusd / 1_000_000)
}

function usdLabel(microusd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(microusd / 1_000_000)
}

function resetTime(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`
}

function draftFrom(settings: AgentSettingsDto): Draft {
  return {
    enabled: settings.enabled,
    dailyTokenLimit: String(settings.dailyTokenLimit),
    dailyQuestionLimit: String(settings.dailyQuestionLimit),
    maxOutputTokens: String(settings.maxOutputTokens),
    monthlyCostLimitUsd: usd(settings.monthlyCostLimitMicrousd),
    resetTimezone: settings.resetTimezone,
    dailyResetTime: resetTime(settings.dailyResetMinute),
    cookieRetentionDays: String(settings.cookieRetentionDays),
    summaryPolicy: settings.summaryPolicy,
  }
}

function selectedModelFrom(settings: AgentSettingsDto): SupportedAgentModelId {
  return getAgentModel(settings.model ?? "")?.id ?? defaultAgentModelId
}

function minuteFrom(value: string): number {
  const [hour, minute] = value.split(":").map(Number)
  return hour * 60 + minute
}

function dateLabel(value: Date | string | null): string {
  if (!value) return "Not set"
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value))
}

function errorMessage(code: string | undefined): string {
  if (code === "provider_unavailable") return "OpenAI could not verify the credential or model. Try again."
  if (code === "credential_invalid") return "OpenAI could not verify the credential or model."
  if (code === "credential_required") return "Enter an OpenAI API key to finish the first setup."
  if (code === "unsupported_model") return "Choose one of the supported OpenAI models."
  if (code === "encryption_unavailable") return "Credential encryption is unavailable. Check deployment secrets."
  if (code === "credential_unavailable") return "No usable OpenAI credential is configured."
  if (code === "model_unverified") return "Verify the selected model before enabling AI."
  if (code === "invalid_settings") return "Review the highlighted settings and try again."
  if (code === "version_conflict") return "Settings changed during the operation. Latest configuration loaded; try again."
  return "The Agent configuration could not be updated. Try again."
}

function settingsPayload(draft: Draft, version: number) {
  return {
    enabled: draft.enabled,
    dailyTokenLimit: Number(draft.dailyTokenLimit),
    dailyQuestionLimit: Number(draft.dailyQuestionLimit),
    maxOutputTokens: Number(draft.maxOutputTokens),
    monthlyCostLimitUsd: draft.monthlyCostLimitUsd,
    resetTimezone: draft.resetTimezone.trim(),
    dailyResetMinute: minuteFrom(draft.dailyResetTime),
    cookieRetentionDays: Number(draft.cookieRetentionDays),
    summaryPolicy: draft.summaryPolicy,
    version,
  }
}

export function AgentSettings({ initialConfiguration }: { initialConfiguration: AgentConfiguration }) {
  const [configuration, setConfiguration] = useState(initialConfiguration)
  const [draft, setDraft] = useState(() => draftFrom(initialConfiguration.settings))
  const [selectedModel, setSelectedModel] = useState<SupportedAgentModelId>(() => (
    selectedModelFrom(initialConfiguration.settings)
  ))
  const [apiKey, setApiKey] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const applyConfiguration = (next: AgentConfiguration, preserveDraft = false) => {
    setConfiguration(next)
    setSelectedModel(selectedModelFrom(next.settings))
    setDraft((current) => preserveDraft
      ? { ...current, enabled: next.settings.enabled }
      : draftFrom(next.settings))
  }

  const loadConfiguration = async (preserveDraft = false) => {
    const response = await fetch("/api/admin/agent", { cache: "no-store" })
    const payload = await response.json() as ApiPayload
    if (!response.ok || !payload.configuration) throw new Error("refresh_failed")
    applyConfiguration(payload.configuration, preserveDraft)
    return payload.configuration
  }

  const refreshConflict = async () => {
    await loadConfiguration()
    setNotice("Settings changed elsewhere. Latest configuration loaded.")
  }

  const mutate = async (
    path: string,
    method: string,
    body: unknown,
    success: string,
    options: { preserveDraft?: boolean; refreshOnFailure?: boolean } = {},
  ) => {
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch(path, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      const payload = await response.json() as ApiPayload
      if (response.status === 409 && payload.error === "version_conflict" && !options.refreshOnFailure) {
        await refreshConflict()
        return
      }
      if (!response.ok || !payload.configuration) {
        if (options.refreshOnFailure) {
          try {
            await loadConfiguration(true)
          } catch {
            // The operation error is more useful than a best-effort refresh failure.
          }
        }
        setError(errorMessage(payload.error))
        return
      }
      applyConfiguration(payload.configuration, options.preserveDraft)
      setNotice(success)
    } catch {
      if (options.refreshOnFailure) {
        try {
          await loadConfiguration(true)
        } catch {
          // The generic operation error remains valid when refresh also fails.
        }
      }
      setError("The Agent configuration could not be updated. Try again.")
    } finally {
      setBusy(false)
    }
  }

  const saveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (draft.enabled && !configuration.settings.enabled
      && !window.confirm("Enable AI for public document visitors?")) return
    await mutate(
      "/api/admin/agent",
      "PATCH",
      settingsPayload(draft, configuration.settings.version),
      "Settings saved.",
    )
  }

  const credential = configuration.credential

  const configureCredential = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const candidate = apiKey.trim()
    try {
      await mutate(
        "/api/admin/agent/credential",
        "PUT",
        {
          ...(candidate ? { apiKey: candidate } : {}),
          model: selectedModel,
          version: configuration.settings.version,
        },
        candidate
          ? credential.configured ? "Credential verified and replaced." : "Credential verified and stored."
          : "Model verified and applied.",
        { preserveDraft: true },
      )
    } finally {
      setApiKey("")
    }
  }

  const deleteCredential = async () => {
    if (!window.confirm("Delete the stored OpenAI credential and disable AI?")) return
    await mutate(
      "/api/admin/agent/credential",
      "DELETE",
      {},
      "Credential deleted and AI disabled.",
      { preserveDraft: true },
    )
  }

  const disableAi = async () => {
    setBusy(true)
    setError("")
    setNotice("")
    let current = configuration
    try {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await fetch("/api/admin/agent", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...settingsPayload(draftFrom(current.settings), current.settings.version),
            enabled: false,
          }),
        })
        const payload = await response.json() as ApiPayload
        if (response.ok && payload.configuration) {
          applyConfiguration(payload.configuration, true)
          setNotice("AI disabled.")
          return
        }
        if (attempt === 0 && response.status === 409 && payload.error === "version_conflict") {
          current = await loadConfiguration(true)
          if (!current.settings.enabled) {
            setNotice("AI disabled.")
            return
          }
          continue
        }
        if (attempt === 1 && response.status === 409 && payload.error === "version_conflict") {
          try {
            await loadConfiguration(true)
          } catch {
            // The final conflict alert remains valid when refresh also fails.
          }
        }
        setError(payload.error === "version_conflict"
          ? "AI could not be disabled because settings changed again. Retry."
          : errorMessage(payload.error))
        return
      }
    } catch {
      setError("The Agent configuration could not be updated. Try again.")
    } finally {
      setBusy(false)
    }
  }

  const model = getAgentModel(selectedModel)!
  const legacyModel = configuration.settings.model && !getAgentModel(configuration.settings.model)
    ? configuration.settings.model
    : null
  const fingerprint = credential.fingerprint ? `••••${credential.fingerprint.slice(-4)}` : "No fingerprint"
  const credentialStatus = credential.configured
    ? `Configured · ${fingerprint} · ${credential.verificationStatus === "verified" ? "Verified" : "Failed"}`
    : "Not configured"
  const modelChanged = selectedModel !== configuration.settings.model
  const setupAction = !credential.configured
    ? "Verify and save"
    : apiKey.trim()
      ? "Verify and replace"
      : "Verify and apply model"
  const estimatedLimit = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(draft.monthlyCostLimitUsd || 0))

  return (
    <section className={styles.agentPage}>
      <div className={styles.agentHeading}>
        <div>
          <p className={styles.eyebrow}>AI control plane</p>
          <h1>Agent</h1>
          <p>{configuration.settings.enabled ? "AI is enabled." : "AI is disabled."}</p>
        </div>
        <button
          className={styles.killSwitch}
          type="button"
          disabled={!configuration.settings.enabled || busy}
          onClick={disableAi}
        >
          Disable AI now
        </button>
      </div>

      {error ? <p className={styles.formAlert} role="alert">{error}</p> : null}
      {notice ? <p className={styles.formNotice} role="status">{notice}</p> : null}

      <section className={styles.agentSection}>
        <div className={styles.agentSectionHeading}>
          <span>01</span>
          <h2>OpenAI setup</h2>
        </div>
        <div className={styles.agentSectionBody}>
          <p className={styles.connectionStatus}>{credentialStatus}</p>
          {legacyModel ? (
            <p className={styles.formAlert} role="alert">
              {legacyModel} is no longer in the supported model catalog. Verify a supported model before enabling AI.
            </p>
          ) : null}
          <form className={styles.agentSetupForm} onSubmit={configureCredential}>
            <label>
              Model
              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value as SupportedAgentModelId)}
              >
                {agentModelCatalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}{item.recommended ? " · Recommended" : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.agentModelCard}>
              <p>{model.description}</p>
              <strong>
                {usdLabel(model.inputPriceMicrousdPerMillion)} input / {usdLabel(model.outputPriceMicrousdPerMillion)} output per 1M tokens
              </strong>
              <span>Pricing checked: {dateLabel(model.pricingCheckedAt)}</span>
            </div>
            {modelChanged && credential.configured ? (
              <p className={styles.editorGuidance} role="status">
                Applying a different model verifies access and leaves AI disabled until you enable it again.
              </p>
            ) : null}
            <label>
              OpenAI API key
              <input
                name="apiKey"
                type="password"
                autoComplete="new-password"
                maxLength={512}
                required={!credential.configured}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={credential.configured ? "Leave blank to use the stored credential" : undefined}
              />
            </label>
            <button type="submit" disabled={busy}>{setupAction}</button>
          </form>
          <div className={styles.agentActions}>
            <button
              type="button"
              disabled={!credential.configured || busy}
              onClick={() => mutate(
                "/api/admin/agent/credential/test",
                "POST",
                {},
                "Connection test passed.",
                { preserveDraft: true, refreshOnFailure: true },
              )}
            >
              Test connection
            </button>
            <button
              className={styles.dangerButton}
              type="button"
              disabled={!credential.configured || busy}
              onClick={deleteCredential}
            >
              Delete credential
            </button>
          </div>
        </div>
      </section>

      <form className={styles.agentForm} onSubmit={saveSettings}>
        <section className={styles.agentSection}>
          <div className={styles.agentSectionHeading}>
            <span>02</span>
            <h2>Usage &amp; policy</h2>
          </div>
          <div className={styles.agentFieldGrid}>
            <label>
              Monthly estimated cost limit (USD)
              <input type="number" min="1" max="10000" step="0.000001" value={draft.monthlyCostLimitUsd} onChange={(event) => set("monthlyCostLimitUsd", event.target.value)} />
            </label>
            <label>
              Summary policy
              <select value={draft.summaryPolicy} onChange={(event) => set("summaryPolicy", event.target.value as Draft["summaryPolicy"])}>
                <option value="review">Review before publishing</option>
                <option value="automatic">Automatic</option>
              </select>
            </label>
            <label className={styles.agentCheckbox}>
              <input type="checkbox" checked={draft.enabled} onChange={(event) => set("enabled", event.target.checked)} />
              Enable AI
            </label>
            <p className={styles.agentMetric}>{estimatedLimit} estimated monthly guardrail</p>
            <p className={styles.agentMeta}>This estimate does not reconcile the OpenAI invoice.</p>

            <details className={styles.agentAdvanced}>
              <summary>Advanced limits</summary>
              <div className={styles.agentAdvancedGrid}>
                <label>
                  Daily token limit
                  <input type="number" min="1000" max="1000000" value={draft.dailyTokenLimit} onChange={(event) => set("dailyTokenLimit", event.target.value)} />
                </label>
                <label>
                  Daily question limit
                  <input type="number" min="1" max="1000" value={draft.dailyQuestionLimit} onChange={(event) => set("dailyQuestionLimit", event.target.value)} />
                </label>
                <label>
                  Maximum output tokens
                  <input type="number" min="64" max="8192" value={draft.maxOutputTokens} onChange={(event) => set("maxOutputTokens", event.target.value)} />
                </label>
                <label>
                  Reset timezone
                  <input value={draft.resetTimezone} onChange={(event) => set("resetTimezone", event.target.value)} />
                </label>
                <label>
                  Daily reset time
                  <input type="time" value={draft.dailyResetTime} onChange={(event) => set("dailyResetTime", event.target.value)} />
                </label>
                <label>
                  AI identity-cookie retention (days)
                  <input type="number" min="1" max="365" value={draft.cookieRetentionDays} onChange={(event) => set("cookieRetentionDays", event.target.value)} />
                </label>
              </div>
            </details>

            <button className={styles.agentSave} type="submit" disabled={busy}>Save settings</button>
          </div>
        </section>
      </form>
    </section>
  )
}
