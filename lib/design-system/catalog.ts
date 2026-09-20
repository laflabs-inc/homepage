import { assets } from "./assets"
import { components } from "./components"
import { foundations } from "./foundations"
import { designSystemMeta } from "./meta"
import { patterns } from "./patterns"
import {
  assertDesignCatalog,
  type ComponentEntry,
  type DesignCatalog,
  type LocaleText,
} from "./schema"
import { designTokens } from "./tokens"

export const designCatalog = {
  meta: designSystemMeta,
  tokens: designTokens,
  foundations,
  components,
  patterns,
  assets,
} satisfies DesignCatalog

assertDesignCatalog(designCatalog)

export function getComponentEntry(slug: string): ComponentEntry | undefined {
  return designCatalog.components.find((entry) => entry.id === slug)
}

export type DesignPageEntry = Readonly<{
  id: "overview" | "foundations" | "components" | "patterns" | "assets" | "ai"
  title: LocaleText
  description: LocaleText
  href: string
  keywords: Readonly<{ ko: readonly string[]; en: readonly string[] }>
}>

type DesignDiscoveryEntry = Omit<DesignPageEntry, "id"> & Readonly<{ id: string }>

export const designPageEntries = [
  {
    id: "overview",
    title: { ko: "개요", en: "Overview" },
    description: {
      ko: "LafLabs Web Design의 원칙과 문서 구조를 소개합니다.",
      en: "An introduction to LafLabs Web Design and its documentation.",
    },
    href: "/design",
    keywords: {
      ko: ["디자인 시스템", "디자인 가이드", "LafLabs"],
      en: ["design system", "design guide", "LafLabs"],
    },
  },
  {
    id: "foundations",
    title: { ko: "기초 원칙", en: "Foundations" },
    description: {
      ko: "색, 타이포그래피, 간격, 접근성, 문장 원칙을 정리합니다.",
      en: "Color, typography, spacing, accessibility, and voice guidance.",
    },
    href: "/design/foundations",
    keywords: {
      ko: ["기초", "컬러", "색상", "타이포그래피", "간격", "접근성"],
      en: ["foundations", "color", "typography", "spacing", "accessibility"],
    },
  },
  {
    id: "components",
    title: { ko: "컴포넌트", en: "Components" },
    description: {
      ko: "지원하는 UI의 상태, API, 사용 기준을 확인합니다.",
      en: "Supported UI states, APIs, and usage guidance.",
    },
    href: "/design/components",
    keywords: {
      ko: ["컴포넌트", "UI", "API", "상태", "사용법"],
      en: ["components", "UI", "API", "states", "usage"],
    },
  },
  {
    id: "patterns",
    title: { ko: "패턴", en: "Patterns" },
    description: {
      ko: "실제 컴포넌트를 페이지 단위로 구성하는 규칙입니다.",
      en: "Rules for composing real components into page-level structures.",
    },
    href: "/design/patterns",
    keywords: {
      ko: ["패턴", "레이아웃", "목록", "문서", "반응형"],
      en: ["patterns", "layout", "rows", "documents", "responsive"],
    },
  },
  {
    id: "assets",
    title: { ko: "에셋", en: "Assets" },
    description: {
      ko: "공식 로고와 System loop 원본을 내려받습니다.",
      en: "Download the official logo and System loop originals.",
    },
    href: "/design/assets",
    keywords: {
      ko: ["에셋", "로고", "영상", "다운로드"],
      en: ["assets", "logo", "motion", "download"],
    },
  },
  {
    id: "ai",
    title: { ko: "AI에서 사용하기", en: "Use with AI" },
    description: {
      ko: "AI 디자인 작업에 쓸 Markdown, token, Skill 리소스를 안내합니다.",
      en: "Markdown, token, and Skill resources for AI-assisted design work.",
    },
    href: "/design/ai",
    keywords: {
      ko: ["AI 디자인", "AI", "Markdown", "token", "Skill"],
      en: ["AI design", "AI", "Markdown", "token", "Skill"],
    },
  },
] as const satisfies readonly DesignPageEntry[]

export const designDiscoveryEntries: readonly DesignDiscoveryEntry[] = [
  ...designPageEntries,
  ...designCatalog.components.map((component) => ({
    id: `component-${component.id}`,
    title: { ko: component.name, en: component.name },
    description: component.summary,
    href: `/design/components/${component.id}`,
    keywords: {
      ko: [component.id, component.name, component.category, ...component.states.map(({ id }) => id)],
      en: [component.id, component.name, component.category, ...component.states.map(({ id }) => id)],
    },
  })),
]
