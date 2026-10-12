import { contactEmail } from "@/lib/content"
import type { Locale } from "@/lib/i18n"

export type LocalizedText = Readonly<Record<Locale, string>>

export type LocalizedSection = Readonly<{
  title: LocalizedText
  body: LocalizedText
}>

export type LocalizedItem = LocalizedSection & Readonly<{
  id: string
  mark?: string
}>

export type CareerRole = Readonly<{
  id: string
  slug: string
  title: LocalizedText
  summary: LocalizedText
  team: LocalizedText
  location?: LocalizedText
  employmentType?: LocalizedText
  href?: string
}>

export type CareersPageContent = Readonly<{
  hero: LocalizedSection
  problems: readonly LocalizedItem[]
  principles: readonly LocalizedItem[]
  process: readonly LocalizedItem[]
  openApplication: LocalizedSection & Readonly<{ email: string }>
  roles: readonly CareerRole[]
}>

const text = (ko: string, en: string): LocalizedText => Object.freeze({ ko, en })

const item = (
  id: string,
  title: LocalizedText,
  body: LocalizedText,
  mark?: string,
): LocalizedItem => Object.freeze({ id, title, body, mark })

export const careersContent: CareersPageContent = Object.freeze({
  hero: Object.freeze({
    title: text("함께 오래 쓸 시스템을 만듭니다.", "Build systems that stay useful."),
    body: text(
      "제품에서 찾은 문제를 기반 기술로 만들고, 직접 운영하며 다음 기준을 세웁니다.",
      "We turn product problems into shared technology, operate what we build, and carry the lessons forward.",
    ),
  }),
  problems: Object.freeze([
    item(
      "product",
      text("제품에서 출발합니다.", "Start with a product."),
      text(
        "실제 사용에서 발견한 구체적인 문제를 출발점으로 삼습니다.",
        "We begin with a specific problem found while building and using a real product.",
      ),
      "ASK",
    ),
    item(
      "foundation",
      text("기반 기술로 만듭니다.", "Build the foundation."),
      text(
        "반복되는 문제를 더 많은 팀이 쓸 수 있는 공통 기반으로 정리합니다.",
        "We turn repeated work into a shared foundation that more than one product can use.",
      ),
      "BUILD",
    ),
    item(
      "operation",
      text("직접 운영하며 확인합니다.", "Operate and verify."),
      text(
        "우리가 만든 것을 직접 운영하고, 실패 경로에서 다음 기준을 찾습니다.",
        "We operate what we build and use its failure paths to define the next standard.",
      ),
      "RUN",
    ),
  ]),
  principles: Object.freeze([
    item(
      "simplicity",
      text("단순하게 만듭니다.", "Keep it simple."),
      text("문제를 가장 작은 단위로 나누고 필요한 것만 남깁니다.", "Reduce the problem and keep only what the work needs."),
      "KISS",
    ),
    item(
      "reliability",
      text("운영까지 책임집니다.", "Own the operation."),
      text("배포 뒤의 상태와 실패 경로까지 제품의 일부로 봅니다.", "Treat deployment, state, and failure paths as part of the product."),
      "RUN",
    ),
    item(
      "security",
      text("경계를 먼저 확인합니다.", "Define the boundary first."),
      text("신뢰해야 할 영역을 줄이고 기본값부터 안전하게 설계합니다.", "Reduce what must be trusted and make the safe path the default."),
      "SAFE",
    ),
    item(
      "scalability",
      text("반복을 시스템으로 남깁니다.", "Turn repetition into a system."),
      text("여러 번 나타난 문제는 다시 풀지 않도록 기반으로 만듭니다.", "When a problem repeats, build a foundation so it does not need solving again."),
      "DRY",
    ),
    item(
      "consistency",
      text("같은 규칙으로 연결합니다.", "Use one set of rules."),
      text("제품이 달라도 사용법과 운영 기준은 예측할 수 있게 맞춥니다.", "Keep usage and operating rules predictable across different products."),
      "ONE",
    ),
  ]),
  process: Object.freeze([
    item(
      "introduction",
      text("서로를 소개합니다.", "Start with an introduction."),
      text("해온 일과 앞으로 다루고 싶은 문제를 먼저 나눕니다.", "Share the work you have done and the problems you want to take on next."),
    ),
    item(
      "conversation",
      text("역할을 이야기합니다.", "Discuss the role."),
      text("실제 업무와 필요한 책임의 범위를 함께 확인합니다.", "Review the actual work and the responsibility it requires."),
    ),
    item(
      "alignment",
      text("기대치를 맞춥니다.", "Align expectations."),
      text("서로 기대하는 방식과 조건을 구체적으로 맞춥니다.", "Make working expectations and conditions explicit on both sides."),
    ),
    item(
      "next-step",
      text("다음 단계를 정합니다.", "Agree on the next step."),
      text("세부 절차는 역할과 상황에 맞춰 안내합니다.", "The detailed process is arranged for the role and the situation."),
    ),
  ]),
  openApplication: Object.freeze({
    title: text("지금 열린 역할이 없어도 괜찮습니다.", "No open role is required to start a conversation."),
    body: text(
      "어떤 문제를 함께 풀고 싶은지, 해온 일과 함께 보내 주세요.",
      "Tell us which problem you want to work on and include the work that shows how you approach it.",
    ),
    email: contactEmail,
  }),
  roles: Object.freeze([]),
})

export function readCareersContent(): CareersPageContent {
  return Object.freeze({
    ...careersContent,
    problems: Object.freeze([...careersContent.problems]),
    principles: Object.freeze([...careersContent.principles]),
    process: Object.freeze([...careersContent.process]),
    roles: Object.freeze([...careersContent.roles]),
  })
}
