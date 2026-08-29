import { describe, expect, it, vi } from "vitest"

const requestMocks = vi.hoisted(() => ({
  cookieValue: undefined as string | undefined,
  acceptLanguage: null as string | null,
}))

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => name === "laf_locale" && requestMocks.cookieValue
      ? { value: requestMocks.cookieValue }
      : undefined,
  }),
  headers: async () => ({
    get: (name: string) => name === "accept-language" ? requestMocks.acceptLanguage : null,
  }),
}))

import { adminCopy } from "@/lib/admin/i18n"
import { getAdminLocale } from "@/lib/admin/locale"

function copyKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix]
  return Object.entries(value)
    .flatMap(([key, nested]) => copyKeys(nested, prefix ? `${prefix}.${key}` : key))
    .sort()
}

describe("admin locale foundation", () => {
  it("keeps the Korean and English catalog shapes recursively identical", () => {
    expect(copyKeys(adminCopy.ko)).toEqual(copyKeys(adminCopy.en))
  })

  it("uses the existing locale cookie before Accept-Language", async () => {
    requestMocks.cookieValue = "en"
    requestMocks.acceptLanguage = "ko-KR,ko;q=0.9"

    await expect(getAdminLocale()).resolves.toBe("en")
  })

  it("falls back to Accept-Language for a first-time visitor", async () => {
    requestMocks.cookieValue = undefined
    requestMocks.acceptLanguage = "en-US,en;q=0.9"

    await expect(getAdminLocale()).resolves.toBe("en")
  })
})
