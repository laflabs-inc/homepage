"use client"

import { useRef, useState } from "react"

import styles from "@/app/admin/admin.module.css"
import type { AgentConfiguration, AgentSettingsDto } from "@/lib/agent/types"

type Draft = {
  enabled: boolean
  model: string
  dailyTokenLimit: string
  dailyQuestionLimit: string
  maxOutputTokens: string
  monthlyCostLimitUsd: string
  inputPriceUsdPerMillion: string
  outputPriceUsdPerMillion: string
  resetTimezone: string
  dailyResetTime: string
  cookieRetentionDays: string
  summaryPolicy: "review" | "automatic"
}

type ApiPayload = { configuration?: AgentConfiguration; error?: string }

function usd(microusd: number | null): string {
  return microusd === null ? "" : String(microusd / 1_000_000)
}

function resetTime(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`
}

function draftFrom(settings: AgentSettingsDto): Draft {
  return {
    enabled: settings.enabled,
    model: settings.model ?? "",
    dailyTokenLimit: String(settings.dailyTokenLimit),
    dailyQuestionLimit: String(settings.dailyQuestionLimit),
    maxOutputTokens: String(settings.maxOutputTokens),
    monthlyCostLimitUsd: usd(settings.monthlyCostLimitMicrousd),
    inputPriceUsdPerMillion: usd(settings.inputPriceMicrousdPerMillion),
    outputPriceUsdPerMillion: usd(settings.outputPriceMicrousdPerMillion),
    resetTimezone: settings.resetTimezone,
    dailyResetTime: resetTime(settings.dailyResetMinute),
    cookieRetentionDays: String(settings.cookieRetentionDays),
    summaryPolicy: settings.summaryPolicy,
  }
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
  if (code === "encryption_unavailable") return "Credential encryption is unavailable. Check deployment secrets."
  if (code === "credential_unavailable") return "No usable OpenAI credential is configured."
  if (code === "model_unverified") return "Test the selected model before enabling AI."
  if (code === "invalid_settings") return "Review the highlighted settings and try again."
  if (code === "version_conflict") return "Settings changed during the operation. Latest configuration loaded; try again."
  return "The Agent configuration could not be updated. Try again."
}

function settingsPayload(draft: Draft, version: number) {
  return {
    enabled: draft.enabled,
    model: draft.model.trim() || null,
    dailyTokenLimit: Number(draft.dailyTokenLimit),
    dailyQuestionLimit: Number(draft.dailyQuestionLimit),
    maxOutputTokens: Number(draft.maxOutputTokens),
    monthlyCostLimitUsd: draft.monthlyCostLimitUsd,
    inputPriceUsdPerMillion: draft.inputPriceUsdPerMillion || null,
    outputPriceUsdPerMillion: draft.outputPriceUsdPerMillion || null,
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
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const credentialForm = useRef<HTMLFormElement>(null)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const applyConfiguration = (next: AgentConfiguration, preserveDraft = false) => {
    setConfiguration(next)
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
            // Keep the original operation error; the refresh is best effort.
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
          // Keep the original generic error; the refresh is best effort.
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

  const replaceCredential = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const apiKey = String(new FormData(event.currentTarget).get("apiKey") ?? "")
    try {
      await mutate(
        "/api/admin/agent/credential",
        "PUT",
        { apiKey },
        "Credential verified and stored.",
        { preserveDraft: true },
      )
    } finally {
      credentialForm.current?.reset()
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
            // The conflict alert remains valid when the final refresh also fails.
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

  const credential = configuration.credential
  const fingerprint = credential.fingerprint ? `••••${credential.fingerprint.slice(-4)}` : "No fingerprint"
  const credentialStatus = credential.configured
    ? `Configured · ${fingerprint} · ${credential.verificationStatus === "verified" ? "Verified" : "Failed"}`
    : "Not configured"
  const modelChanged = draft.model !== (configuration.settings.model ?? "")
  const estimatedLimit = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(configuration.settings.monthlyCostLimitMicrousd / 1_000_000)

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
          <h2>Connection</h2>
        </div>
        <div className={styles.agentSectionBody}>
          <p className={styles.connectionStatus}>{credentialStatus}</p>
          <form ref={credentialForm} className={styles.credentialForm} onSubmit={replaceCredential}>
            <label>
              OpenAI API key
              <input name="apiKey" type="password" autoComplete="new-password" maxLength={512} required />
            </label>
            <button type="submit" disabled={busy}>
              {credential.configured ? "Replace credential" : "Register credential"}
            </button>
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
            <h2>Model &amp; pricing</h2>
          </div>
          <div className={styles.agentFieldGrid}>
            <label className={styles.agentWideField}>
              Model
              <input value={draft.model} maxLength={120} onChange={(event) => set("model", event.target.value)} />
            </label>
            {modelChanged ? (
              <p className={styles.editorGuidance} role="status">
                Changing the model disables AI, clears pricing, and requires another connection test.
              </p>
            ) : null}
            <label>
              Input price per million tokens (USD)
              <input type="number" min="0" step="0.000001" value={draft.inputPriceUsdPerMillion} onChange={(event) => set("inputPriceUsdPerMillion", event.target.value)} />
            </label>
            <label>
              Output price per million tokens (USD)
              <input type="number" min="0" step="0.000001" value={draft.outputPriceUsdPerMillion} onChange={(event) => set("outputPriceUsdPerMillion", event.target.value)} />
            </label>
            <p className={styles.agentMeta}>Pricing checked: {dateLabel(configuration.settings.pricingCheckedAt)}</p>
          </div>
        </section>

        <section className={styles.agentSection}>
          <div className={styles.agentSectionHeading}>
            <span>03</span>
            <h2>Visitor limits</h2>
          </div>
          <div className={styles.agentFieldGrid}>
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
          </div>
        </section>

        <section className={styles.agentSection}>
          <div className={styles.agentSectionHeading}>
            <span>04</span>
            <h2>Budget</h2>
          </div>
          <div className={styles.agentFieldGrid}>
            <label>
              Monthly estimated cost limit (USD)
              <input type="number" min="1" max="10000" step="0.000001" value={draft.monthlyCostLimitUsd} onChange={(event) => set("monthlyCostLimitUsd", event.target.value)} />
            </label>
            <p className={styles.agentMetric}>{estimatedLimit} estimated monthly guardrail</p>
            <p className={styles.agentMeta}>This estimate does not reconcile the OpenAI invoice.</p>
          </div>
        </section>

        <section className={styles.agentSection}>
          <div className={styles.agentSectionHeading}>
            <span>05</span>
            <h2>Cookie</h2>
          </div>
          <div className={styles.agentFieldGrid}>
            <label>
              AI identity-cookie retention (days)
              <input type="number" min="1" max="365" value={draft.cookieRetentionDays} onChange={(event) => set("cookieRetentionDays", event.target.value)} />
            </label>
          </div>
        </section>

        <section className={styles.agentSection}>
          <div className={styles.agentSectionHeading}>
            <span>06</span>
            <h2>Summary</h2>
          </div>
          <div className={styles.agentFieldGrid}>
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
            <button className={styles.agentSave} type="submit" disabled={busy}>Save settings</button>
          </div>
        </section>
      </form>
    </section>
  )
}
