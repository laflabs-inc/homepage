import { beforeEach, describe, expect, it, vi } from "vitest"

const requestState = vi.hoisted(() => ({
  cookieLocale: undefined as string | undefined,
  acceptLanguage: null as string | null,
}))

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => requestState.cookieLocale ? { value: requestState.cookieLocale } : undefined,
  }),
  headers: async () => ({
    get: (name: string) => name === "accept-language" ? requestState.acceptLanguage : null,
  }),
}))

import { resolveDocumentPageLocale } from "@/app/(documents)/locale"

beforeEach(() => {
  requestState.cookieLocale = undefined
  requestState.acceptLanguage = null
})

describe("document route locale resolution", () => {
  it("uses Accept-Language when a first-time visitor has no locale cookie", async () => {
    requestState.acceptLanguage = "en-US,en;q=0.9,ko;q=0.8"

    await expect(resolveDocumentPageLocale(Promise.resolve({}))).resolves.toBe("en")
  })

  it("keeps explicit query and cookie preferences ahead of Accept-Language", async () => {
    requestState.cookieLocale = "ko"
    requestState.acceptLanguage = "en-US,en;q=0.9"

    await expect(resolveDocumentPageLocale(Promise.resolve({}))).resolves.toBe("ko")
    await expect(resolveDocumentPageLocale(Promise.resolve({ locale: "en" }))).resolves.toBe("en")
  })
})
