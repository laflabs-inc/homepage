import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  createAnalyticsClient,
  minimizeInitialNavigationReferrer,
  type AnalyticsClient,
} from "@/lib/analytics/client"

const clients: AnalyticsClient[] = []
let sendBeaconDescriptor: PropertyDescriptor | undefined

function createClient(overrides: Partial<Parameters<typeof createAnalyticsClient>[0]> = {}) {
  const client = createAnalyticsClient({
    locale: "ko",
    pathname: "/?campaign=private#section",
    ...overrides,
  })
  clients.push(client)
  return client
}

function setSendBeacon(value: typeof navigator.sendBeacon | undefined) {
  Object.defineProperty(navigator, "sendBeacon", {
    configurable: true,
    writable: true,
    value,
  })
}

async function readBeaconBatch(sendBeacon: ReturnType<typeof vi.fn>, call = 0) {
  const blob = sendBeacon.mock.calls[call]?.[1]
  expect(blob).toBeInstanceOf(Blob)
  return JSON.parse(await (blob as Blob).text()) as {
    events: Array<{
      type: string
      targetId: string | null
      locale: string
      pathname: string
      sessionId: string
      referrerHost?: string
    }>
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  sessionStorage.clear()
  sendBeaconDescriptor = Object.getOwnPropertyDescriptor(navigator, "sendBeacon")
})

afterEach(() => {
  for (const client of clients.splice(0)) client.stop()
  if (sendBeaconDescriptor) {
    Object.defineProperty(navigator, "sendBeacon", sendBeaconDescriptor)
  } else {
    Reflect.deleteProperty(navigator, "sendBeacon")
  }
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe("createAnalyticsClient", () => {
  it("queues an allowlisted event and sends it as a first-party beacon", async () => {
    const sendBeacon = vi.fn(() => true)
    setSendBeacon(sendBeacon)
    const client = createClient()

    client.track("github_click", "lafetch")
    expect(client.size()).toBe(1)

    await client.flush()

    expect(sendBeacon).toHaveBeenCalledOnce()
    expect(sendBeacon).toHaveBeenCalledWith("/api/analytics/events", expect.any(Blob))
    expect((await readBeaconBatch(sendBeacon)).events).toHaveLength(1)
  })

  it("never keeps more than 20 queued events while a batch is in flight", async () => {
    setSendBeacon(undefined)
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)))
    const client = createClient()

    for (let index = 0; index < 5; index += 1) {
      client.track("github_click", "lafetch")
    }
    for (let index = 0; index < 25; index += 1) {
      client.track("github_click", "lafwall")
    }

    expect(client.size()).toBe(20)
  })

  it("flushes automatically at five events and after five seconds", async () => {
    const sendBeacon = vi.fn(() => true)
    setSendBeacon(sendBeacon)
    const thresholdClient = createClient()

    for (let index = 0; index < 5; index += 1) {
      thresholdClient.track("github_click", "lafetch")
    }
    await Promise.resolve()
    expect(sendBeacon).toHaveBeenCalledOnce()

    const timedClient = createClient()
    timedClient.track("github_click", "lafwall")
    await vi.advanceTimersByTimeAsync(4_999)
    expect(sendBeacon).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1)
    expect(sendBeacon).toHaveBeenCalledTimes(2)
  })

  it("flushes queued events when the document becomes hidden", async () => {
    const sendBeacon = vi.fn(() => true)
    setSendBeacon(sendBeacon)
    let visibility: DocumentVisibilityState = "visible"
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility)
    const client = createClient()

    client.track("github_click", "lafetch")
    visibility = "hidden"
    document.dispatchEvent(new Event("visibilitychange"))
    await Promise.resolve()

    expect(sendBeacon).toHaveBeenCalledOnce()
  })

  it("retries a failed request once and then drops the batch", async () => {
    setSendBeacon(undefined)
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503 }))
    vi.stubGlobal("fetch", fetchMock)
    const client = createClient()

    client.track("github_click", "lafetch")
    const flushing = client.flush()
    await Promise.resolve()
    expect(fetchMock).toHaveBeenCalledOnce()

    await vi.advanceTimersByTimeAsync(1_000)
    await flushing
    expect(fetchMock).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(5_000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(client.size()).toBe(0)
  })

  it("suppresses duplicate page views and applies locale changes only to later events", async () => {
    const sendBeacon = vi.fn(() => true)
    setSendBeacon(sendBeacon)
    const client = createClient()

    client.track("page_view", null)
    client.track("page_view", null)
    client.setLocale("en")
    client.track("github_click", "lafetch")
    await client.flush()

    const { events } = await readBeaconBatch(sendBeacon)
    expect(events.map(({ type }) => type)).toEqual(["page_view", "github_click"])
    expect(events.map(({ locale }) => locale)).toEqual(["ko", "en"])
  })

  it("clears queued events and prevents timers and retries after stop", async () => {
    setSendBeacon(undefined)
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 503 }))
    vi.stubGlobal("fetch", fetchMock)
    const client = createClient()

    client.track("github_click", "lafetch")
    const flushing = client.flush()
    await Promise.resolve()
    client.track("github_click", "lafwall")
    client.stop()

    expect(client.size()).toBe(0)
    await vi.advanceTimersByTimeAsync(6_000)
    await flushing
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it("removes query strings and fragments from every event pathname", async () => {
    const sendBeacon = vi.fn(() => true)
    setSendBeacon(sendBeacon)
    const client = createClient({ pathname: "/?email=secret@example.com#private" })

    client.track("page_view", null)
    await client.flush()

    expect((await readBeaconBatch(sendBeacon)).events[0]?.pathname).toBe("/")
  })

  it("captures only the external hostname from the initial document navigation referrer", async () => {
    vi.spyOn(document, "referrer", "get").mockReturnValue(
      "https://github.com/laflabs-inc/homepage?campaign=private#fragment",
    )
    const sendBeacon = vi.fn(() => true)
    setSendBeacon(sendBeacon)
    const client = createClient()

    client.track("page_view", null)
    client.track("github_click", "lafetch")
    await client.flush()

    const batch = await readBeaconBatch(sendBeacon)
    const raw = JSON.stringify(batch)
    const { events } = batch
    expect(events[0]).toMatchObject({ type: "page_view", referrerHost: "github.com" })
    expect(events[1]).not.toHaveProperty("referrerHost")
    expect(raw).not.toContain("/laflabs-inc/homepage")
    expect(raw).not.toContain("campaign")
    expect(raw).not.toContain("fragment")
  })

  it.each([
    ["same-origin", "https://laflabs.co/from?private=1"],
    ["IPv4", "https://192.0.2.10/private"],
    ["IPv6", "https://[2001:db8::1]/private"],
    ["invalid", "not a URL"],
  ])("drops a %s initial navigation referrer", (_label, referrer) => {
    expect(minimizeInitialNavigationReferrer(referrer, "https://laflabs.co")).toBeNull()
  })

  it("reuses one UUID session identifier across clients in the same tab", async () => {
    const sendBeacon = vi.fn(() => true)
    setSendBeacon(sendBeacon)
    const first = createClient()
    first.track("page_view", null)
    await first.flush()
    first.stop()

    const second = createClient()
    second.track("github_click", "lafetch")
    await second.flush()

    const firstSession = (await readBeaconBatch(sendBeacon, 0)).events[0]?.sessionId
    const secondSession = (await readBeaconBatch(sendBeacon, 1)).events[0]?.sessionId
    expect(firstSession).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    expect(secondSession).toBe(firstSession)
  })

  it("falls back to same-origin keepalive fetch when beacon cannot queue the batch", async () => {
    const sendBeacon = vi.fn(() => false)
    setSendBeacon(sendBeacon)
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal("fetch", fetchMock)
    const client = createClient()

    client.track("contact_click", "email")
    await client.flush()

    expect(sendBeacon).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith("/api/analytics/events", expect.objectContaining({
      method: "POST",
      keepalive: true,
      credentials: "same-origin",
      body: expect.any(Blob),
    }))
  })

  it("ignores runtime values outside the exact event and target allowlist", async () => {
    const sendBeacon = vi.fn(() => true)
    setSendBeacon(sendBeacon)
    const client = createClient()

    client.track("search" as "page_view", "private query")
    client.track("github_click", "https://example.com/private")
    client.track("contact_click", "raw@example.com")

    expect(client.size()).toBe(0)
    await client.flush()
    expect(sendBeacon).not.toHaveBeenCalled()
  })

  it("contains event construction failures instead of throwing into interactions", () => {
    const client = createClient()
    vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
      throw new Error("browser entropy unavailable")
    })

    expect(() => client.track("github_click", "lafetch")).not.toThrow()
    expect(client.size()).toBe(0)
  })
})
