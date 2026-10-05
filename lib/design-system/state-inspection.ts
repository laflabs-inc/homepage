import type { ComponentStateInspection } from "./schema"

export const fixtureInspection = {
  mode: "fixture",
} as const satisfies ComponentStateInspection

export const interactiveInspection = {
  mode: "interactive",
  instruction: {
    ko: "미리보기 컨트롤을 직접 조작해 이 상태를 확인합니다.",
    en: "Use the preview control to inspect this state.",
  },
} as const satisfies ComponentStateInspection

export const environmentInspection = {
  mode: "environment",
  instruction: {
    ko: "운영체제나 브라우저 설정을 바꾼 뒤 이 상태를 확인합니다.",
    en: "Change the relevant system or browser setting to inspect this state.",
  },
} as const satisfies ComponentStateInspection
