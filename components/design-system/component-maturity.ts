import type { ComponentMaturity } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"

const maturityLabels = {
  ko: {
    stable: "안정",
    candidate: "후보",
  },
  en: {
    stable: "Stable",
    candidate: "Candidate",
  },
} as const satisfies Record<Locale, Record<ComponentMaturity, string>>

export function getComponentMaturityLabel(
  maturity: ComponentMaturity,
  locale: Locale,
): string {
  return maturityLabels[locale][maturity]
}
