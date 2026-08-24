export type UsageBuckets = { day: string; month: string }

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

export function usageBuckets(now: Date, timeZone: string, dailyResetMinute: number): UsageBuckets {
  if (!Number.isFinite(now.getTime())) throw new RangeError("now must be a valid date")
  if (!Number.isSafeInteger(dailyResetMinute) || dailyResetMinute < 0 || dailyResetMinute > 1_439) {
    throw new RangeError("dailyResetMinute must be between 0 and 1439")
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    calendar: "iso8601",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  const year = Number(values.year)
  const month = Number(values.month)
  const day = Number(values.day)
  const localMinute = Number(values.hour) * 60 + Number(values.minute)
  const monthBucket = `${year}-${pad(month)}`

  if (localMinute >= dailyResetMinute) {
    return { day: `${monthBucket}-${pad(day)}`, month: monthBucket }
  }

  const priorDay = new Date(Date.UTC(year, month - 1, day) - 86_400_000)
  return { day: priorDay.toISOString().slice(0, 10), month: monthBucket }
}
