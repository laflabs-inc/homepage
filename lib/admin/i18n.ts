import type { Locale } from "@/lib/i18n"

type CopyShape<T> = {
  [K in keyof T]: T[K] extends (...args: infer Arguments) => string
    ? (...args: Arguments) => string
    : T[K] extends object
      ? CopyShape<T[K]>
      : string
}

const en = {
  shell: {
    homeLabel: "LafLabs homepage",
    privateLabel: "Admin / Private",
    languageLabel: "Language",
  },
  nav: {
    analytics: "Analytics",
    documents: "Documents",
    agent: "Agent",
  },
} as const

const ko = {
  shell: {
    homeLabel: "LafLabs 홈페이지",
    privateLabel: "관리자 / 비공개",
    languageLabel: "언어",
  },
  nav: {
    analytics: "분석",
    documents: "문서",
    agent: "에이전트",
  },
} satisfies CopyShape<typeof en>

export type AdminCopy = CopyShape<typeof en>

export const adminCopy: Record<Locale, AdminCopy> = { en, ko }
