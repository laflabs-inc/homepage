"use client"

import { useState } from "react"

import styles from "@/app/admin/admin.module.css"
import { useLocale } from "@/components/i18n/locale-provider"
import {
  agentModelCatalog,
  defaultAgentModelId,
  getAgentModel,
  type SupportedAgentModelId,
} from "@/lib/agent/model-catalog"
import type { AgentConfiguration, AgentSettingsDto } from "@/lib/agent/types"
import { adminCopy, type AdminCopy } from "@/lib/admin/i18n"
import type { Locale } from "@/lib/i18n"

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

function localeTag(locale: Locale): string {
  return locale === "ko" ? "ko-KR" : "en-US"
}

function usdLabel(locale: Locale, microusd: number): string {
  return new Intl.NumberFormat(localeTag(locale), {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
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

function dateLabel(locale: Locale, value: Date | string | null): string {
  if (!value) return adminCopy[locale].agent.notSet
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value))
}

function agentErrorMessage(t: AdminCopy["agent"], code: string | undefined): string {
  if (code === "credential_invalid") return t.errors.credentialInvalid
  if (code === "model_access_denied") return t.errors.modelAccessDenied
  if (code === "model_not_found") return t.errors.modelNotFound
  if (code === "verification_request_invalid") return t.errors.verificationRequestInvalid
  if (code === "quota_exhausted") return t.errors.quotaExhausted
  if (code === "rate_limited") return t.errors.rateLimited
  if (code === "provider_unavailable") return t.errors.providerUnavailable
  if (code === "credential_required") return t.errors.credentialRequired
  if (code === "unsupported_model") return t.errors.unsupportedModel
  if (code === "encryption_unavailable") return t.errors.encryptionUnavailable
  if (code === "credential_unavailable") return t.errors.credentialUnavailable
  if (code === "model_unverified") return t.errors.modelUnverified
  if (code === "invalid_settings") return t.errors.invalidSettings
  if (code === "version_conflict") return t.errors.versionConflict
  return t.errors.generic
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
  const locale = useLocale()
  const t = adminCopy[locale].agent
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
    setNotice(t.settingsReloaded)
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
        setError(agentErrorMessage(t, payload.error))
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
      setError(t.errors.generic)
    } finally {
      setBusy(false)
    }
  }

  const saveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (draft.enabled && !configuration.settings.enabled
      && !window.confirm(t.confirmations.enable)) return
    await mutate(
      "/api/admin/agent",
      "PATCH",
      settingsPayload(draft, configuration.settings.version),
      t.settingsSaved,
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
          ? credential.configured ? t.credentialVerifiedAndReplaced : t.credentialVerifiedAndStored
          : t.modelVerifiedAndApplied,
        { preserveDraft: true },
      )
    } finally {
      setApiKey("")
    }
  }

  const deleteCredential = async () => {
    if (!window.confirm(t.confirmations.deleteCredential)) return
    await mutate(
      "/api/admin/agent/credential",
      "DELETE",
      {},
      t.credentialDeletedAndDisabled,
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
          setNotice(t.aiDisabled)
          return
        }
        if (attempt === 0 && response.status === 409 && payload.error === "version_conflict") {
          current = await loadConfiguration(true)
          if (!current.settings.enabled) {
            setNotice(t.aiDisabled)
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
          ? t.errors.disableVersionConflict
          : agentErrorMessage(t, payload.error))
        return
      }
    } catch {
      setError(t.errors.generic)
    } finally {
      setBusy(false)
    }
  }

  const model = getAgentModel(selectedModel)!
  const legacyModel = configuration.settings.model && !getAgentModel(configuration.settings.model)
    ? configuration.settings.model
    : null
  const fingerprint = credential.fingerprint ? `••••${credential.fingerprint.slice(-4)}` : t.fingerprintMissing
  const credentialStatus = credential.configured
    ? t.configured(fingerprint, credential.verificationStatus === "verified" ? t.verified : t.failed)
    : t.notConfigured
  const modelChanged = selectedModel !== configuration.settings.model
  const setupAction = !credential.configured
    ? t.verifyAndSave
    : apiKey.trim()
      ? t.verifyAndReplace
      : t.verifyAndApplyModel
  const estimatedLimit = new Intl.NumberFormat(localeTag(locale), {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
  }).format(Number(draft.monthlyCostLimitUsd || 0))

  return (
    <section className={styles.agentPage}>
      <div className={styles.agentHeading}>
        <div>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h1>{t.heading}</h1>
          <p>{configuration.settings.enabled ? t.enabled : t.disabled}</p>
        </div>
        <button
          className={styles.killSwitch}
          type="button"
          disabled={!configuration.settings.enabled || busy}
          onClick={disableAi}
        >
          {t.disableNow}
        </button>
      </div>

      {error ? <p className={styles.formAlert} role="alert">{error}</p> : null}
      {notice ? <p className={styles.formNotice} role="status">{notice}</p> : null}

      <section className={styles.agentSection}>
        <div className={styles.agentSectionHeading}>
          <span>01</span>
          <h2>{t.connection}</h2>
        </div>
        <div className={styles.agentSectionBody}>
          <p className={styles.connectionStatus}>{credentialStatus}</p>
          {legacyModel ? (
            <p className={styles.formAlert} role="alert">
              {t.legacyModel(legacyModel)}
            </p>
          ) : null}
          <form className={styles.agentSetupForm} onSubmit={configureCredential}>
            <label>
              {t.model}
              <select
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value as SupportedAgentModelId)}
              >
                {agentModelCatalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}{item.recommended ? ` · ${t.recommended}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.agentModelCard}>
              <p>{t.modelDescriptions[model.id]}</p>
              <strong>
                {t.price(
                  usdLabel(locale, model.inputPriceMicrousdPerMillion),
                  usdLabel(locale, model.outputPriceMicrousdPerMillion),
                )}
              </strong>
              <span>{t.pricingChecked(dateLabel(locale, model.pricingCheckedAt))}</span>
            </div>
            {modelChanged && credential.configured ? (
              <p className={styles.editorGuidance} role="status">
                {t.modelChanged}
              </p>
            ) : null}
            <label>
              {t.apiKey}
              <input
                name="apiKey"
                type="password"
                autoComplete="new-password"
                maxLength={512}
                required={!credential.configured}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={credential.configured ? t.apiKeyPlaceholder : undefined}
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
                t.connectionTestPassed,
                { preserveDraft: true, refreshOnFailure: true },
              )}
            >
              {t.testConnection}
            </button>
            <button
              className={styles.dangerButton}
              type="button"
              disabled={!credential.configured || busy}
              onClick={deleteCredential}
            >
              {t.deleteCredential}
            </button>
          </div>
        </div>
      </section>

      <form className={styles.agentForm} onSubmit={saveSettings}>
        <section className={styles.agentSection}>
          <div className={styles.agentSectionHeading}>
            <span>02</span>
            <h2>{t.usage}</h2>
          </div>
          <div className={styles.agentFieldGrid}>
            <label>
              {t.monthlyEstimatedCostLimit}
              <input type="number" min="1" max="10000" step="0.000001" value={draft.monthlyCostLimitUsd} onChange={(event) => set("monthlyCostLimitUsd", event.target.value)} />
            </label>
            <label>
              {t.summaryPolicy}
              <select value={draft.summaryPolicy} onChange={(event) => set("summaryPolicy", event.target.value as Draft["summaryPolicy"])}>
                <option value="review">{t.reviewBeforePublishing}</option>
                <option value="automatic">{t.automatic}</option>
              </select>
            </label>
            <label className={styles.agentCheckbox}>
              <input type="checkbox" checked={draft.enabled} onChange={(event) => set("enabled", event.target.checked)} />
              {t.enableAi}
            </label>
            <p className={styles.agentMetric}>{t.estimatedMonthlyGuardrail(estimatedLimit)}</p>
            <p className={styles.agentMeta}>{t.estimateDisclaimer}</p>

            <details className={styles.agentAdvanced}>
              <summary>{t.advancedLimits}</summary>
              <div className={styles.agentAdvancedGrid}>
                <label>
                  {t.dailyTokenLimit}
                  <input type="number" min="1000" max="1000000" value={draft.dailyTokenLimit} onChange={(event) => set("dailyTokenLimit", event.target.value)} />
                </label>
                <label>
                  {t.dailyQuestionLimit}
                  <input type="number" min="1" max="1000" value={draft.dailyQuestionLimit} onChange={(event) => set("dailyQuestionLimit", event.target.value)} />
                </label>
                <label>
                  {t.maximumOutputTokens}
                  <input type="number" min="64" max="8192" value={draft.maxOutputTokens} onChange={(event) => set("maxOutputTokens", event.target.value)} />
                </label>
                <label>
                  {t.resetTimezone}
                  <input value={draft.resetTimezone} onChange={(event) => set("resetTimezone", event.target.value)} />
                </label>
                <label>
                  {t.dailyResetTime}
                  <input type="time" value={draft.dailyResetTime} onChange={(event) => set("dailyResetTime", event.target.value)} />
                </label>
                <label>
                  {t.identityCookieRetention}
                  <input type="number" min="1" max="365" value={draft.cookieRetentionDays} onChange={(event) => set("cookieRetentionDays", event.target.value)} />
                </label>
              </div>
            </details>

            <button className={styles.agentSave} type="submit" disabled={busy}>{t.saveSettings}</button>
          </div>
        </section>
      </form>
    </section>
  )
}
