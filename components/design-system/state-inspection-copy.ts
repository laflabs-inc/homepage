import type { ComponentStateInspectionMode } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"

export const stateInspectionCopy: Record<
  Locale,
  Record<ComponentStateInspectionMode, string>
> = {
  ko: {
    fixture: "고정 예시",
    interactive: "직접 조작",
    environment: "환경에서 확인",
  },
  en: {
    fixture: "Fixed example",
    interactive: "Interact to inspect",
    environment: "Change the environment to inspect",
  },
}
