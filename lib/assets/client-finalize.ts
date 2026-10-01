"use client"

import type { AdminAssetSummary } from "@/lib/assets/admin-summary"

const RETRY_DELAYS_MS = [250, 500, 1_000, 2_000, 4_000]

type FinalizeRequest = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>

type FinalizeDependencies = {
  request?: FinalizeRequest
  wait?: (milliseconds: number) => Promise<void>
}

type FinalizeResponse = {
  asset?: AdminAssetSummary
  error?: string
}

async function readResponse(response: Response): Promise<FinalizeResponse> {
  return response.json().catch(() => ({})) as Promise<FinalizeResponse>
}

export async function finalizeUploadedAsset(
  assetId: string,
  dependencies: FinalizeDependencies = {},
): Promise<AdminAssetSummary> {
  const request = dependencies.request ?? fetch
  const wait = dependencies.wait ?? ((milliseconds: number) => new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds)
  }))

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    const response = await request(`/api/admin/assets/${assetId}/finalize`, { method: "POST" })
    const body = await readResponse(response)

    if (response.ok && body.asset) return body.asset

    const callbackPending = response.status === 409 && body.error === "invalid_state"
    if (!callbackPending || attempt === RETRY_DELAYS_MS.length) {
      throw new Error(body.error ?? "request_failed")
    }
    await wait(RETRY_DELAYS_MS[attempt])
  }

  throw new Error("request_failed")
}
