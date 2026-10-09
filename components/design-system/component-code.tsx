import type { ComponentEntry } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import { DesignCode } from "./design-code"

export function ComponentCode({ component, locale }: { component: ComponentEntry; locale: Locale }) {
  return <DesignCode locale={locale} source={component.usageExample} targetId={component.id} />
}
