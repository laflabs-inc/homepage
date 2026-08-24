export type UsageBuckets = { day: string; month: string }

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

type LocalParts = { year: number; month: number; day: number; minute: number }

function localParts(formatter: Intl.DateTimeFormat, instant: Date): LocalParts {
  const values = Object.fromEntries(formatter.formatToParts(instant).map(({ type, value }) => [type, value]))
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    minute: Number(values.hour) * 60 + Number(values.minute),
  }
}

function firstResetInstant(
  formatter: Intl.DateTimeFormat,
  { year, month, day }: LocalParts,
  resetMinute: number,
): number {
  const nominal = Date.UTC(year, month - 1, day, Math.floor(resetMinute / 60), resetMinute % 60)
  for (let instant = nominal - 15 * 60 * 60_000; instant <= nominal + 15 * 60 * 60_000; instant += 60_000) {
    const candidate = localParts(formatter, new Date(instant))
    if (
      candidate.year === year
      && candidate.month === month
      && candidate.day === day
      && candidate.minute >= resetMinute
    ) return instant
  }
  return Number.POSITIVE_INFINITY
}

export function usageBuckets(now: Date, timeZone: string, dailyResetMinute: number): UsageBuckets {
  if (!Number.isFinite(now.getTime())) throw new RangeError("now must be a valid date")
  if (!Number.isSafeInteger(dailyResetMinute) || dailyResetMinute < 0 || dailyResetMinute > 1_439) {
    throw new RangeError("dailyResetMinute must be between 0 and 1439")
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    calendar: "iso8601",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
  const current = localParts(formatter, now)
  const { year, month, day } = current
  const monthBucket = `${year}-${pad(month)}`

  if (now.getTime() >= firstResetInstant(formatter, current, dailyResetMinute)) {
    return { day: `${monthBucket}-${pad(day)}`, month: monthBucket }
  }

  const priorDay = new Date(Date.UTC(year, month - 1, day) - 86_400_000)
  return { day: priorDay.toISOString().slice(0, 10), month: monthBucket }
}
