export type FunnelStageEvent = {
  visitorHash: string
  eventId: string
  eventType: "page_view" | "product_click" | "contact_click"
  occurredAt: Date
  receivedAt: Date
}

export type OrderedFunnelCounts = {
  pageVisitors: number
  productVisitors: number
  contactVisitors: number
}

/**
 * Equal timestamps are deliberately inclusive at each consecutive stage. This
 * mirrors the SQL cohort and avoids inventing an order when browser events from
 * the same interaction are clamped to the same instant.
 */
export function summarizeOrderedFunnel(
  events: readonly FunnelStageEvent[],
  cutoff: Date,
  now: Date,
): OrderedFunnelCounts {
  const selected = events.filter(({ receivedAt }) => (
    receivedAt >= cutoff && receivedAt <= now
  ))
  const visitors = new Map<string, FunnelStageEvent[]>()
  for (const event of selected) {
    const visitorEvents = visitors.get(event.visitorHash) ?? []
    visitorEvents.push(event)
    visitors.set(event.visitorHash, visitorEvents)
  }

  let pageVisitors = 0
  let productVisitors = 0
  let contactVisitors = 0
  for (const visitorEvents of visitors.values()) {
    const pageAt = earliestStage(visitorEvents, "page_view")
    if (pageAt === null) continue
    pageVisitors += 1

    const productAt = earliestStage(visitorEvents, "product_click", pageAt)
    if (productAt === null) continue
    productVisitors += 1

    const contactAt = earliestStage(visitorEvents, "contact_click", productAt)
    if (contactAt !== null) contactVisitors += 1
  }

  return { pageVisitors, productVisitors, contactVisitors }
}

function earliestStage(
  events: readonly FunnelStageEvent[],
  eventType: FunnelStageEvent["eventType"],
  notBefore = Number.NEGATIVE_INFINITY,
): number | null {
  let earliest = Number.POSITIVE_INFINITY
  for (const event of events) {
    const occurredAt = event.occurredAt.getTime()
    if (event.eventType === eventType && occurredAt >= notBefore && occurredAt < earliest) {
      earliest = occurredAt
    }
  }
  return Number.isFinite(earliest) ? earliest : null
}
