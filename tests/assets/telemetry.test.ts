import { describe, expect, it, vi } from "vitest"

import { createMediaTelemetry } from "@/lib/assets/telemetry"

describe("media telemetry", () => {
  it("records bounded operational fields", () => {
    const emit = vi.fn()
    const telemetry = createMediaTelemetry(emit)

    telemetry.record("media.finalized", {
      assetId: "00000000-0000-4000-8000-000000000001",
      mediaType: "image/png",
      byteSize: 1234,
      count: 1,
    })

    expect(emit).toHaveBeenCalledWith("media.finalized", {
      assetId: "00000000-0000-4000-8000-000000000001",
      mediaType: "image/png",
      byteSize: 1234,
      count: 1,
    })
  })

  it.each(["privateUrl", "providerError", "filename", "token", "bytes"])(
    "rejects unsafe field %s",
    (field) => {
      const telemetry = createMediaTelemetry(vi.fn())
      expect(() => telemetry.record("media.finalize_failed", { [field]: "secret" })).toThrow(
        /unsafe_media_telemetry/,
      )
    },
  )
})
