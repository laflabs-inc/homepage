import type { Locale } from "@/lib/i18n"

export type HomeExperimentArtifactKind = "identity" | "code" | "architecture"

export type HomeExperimentArtifact = {
  kind: HomeExperimentArtifactKind
  source: string
  label: Record<Locale, string>
  title: Record<Locale, string>
  lines: readonly string[]
}

export type HomeExperimentWorkItem = {
  id: "laf-id" | "lafetch" | "lafwall"
  title: string
  category: Record<Locale, string>
  status: Record<Locale, string>
  summary: Record<Locale, string>
  tags: readonly string[]
  href?: string
  artifact: HomeExperimentArtifact
}

export type HomeExperimentCopy = {
  hero: {
    companyType: string
    location: string
    title: string
    titleLines: readonly string[]
    highlight: string
    lede: string
    artifactLabel: string
  }
  company: {
    title: string
    titleLines: readonly string[]
    highlight: string
    lede: string
    proofTitle: string
    proofBody: string
  }
  method: {
    title: string
    titleLines: readonly string[]
    lede: string
    items: readonly {
      mark: "ASK" | "BUILD" | "RUN"
      title: string
      body: string
      caption: string
    }[]
  }
  work: {
    title: string
    lede: string
    previous: string
    next: string
    open: string
    unavailable: string
  }
  open: {
    title: string
    titleLines: readonly string[]
    lede: string
    repository: string
    sourceLabel: string
  }
}

export const homeExperimentCopy: Record<Locale, HomeExperimentCopy> = {
  ko: {
    hero: {
      companyType: "소프트웨어 개발사",
      location: "서울",
      title: "제품을 만들고, 필요한 기반을 직접 구축합니다.",
      titleLines: ["제품을 만들고,", "필요한 기반을 직접", "구축합니다."],
      highlight: "필요한 기반",
      lede: "LafLabs는 제품을 기획하고 개발합니다. 화면부터 운영 기반까지 직접 설계합니다.",
      artifactLabel: "코드에서 운영 가능한 제품까지",
    },
    company: {
      title: "제품과 그 아래의 기술을 함께 만듭니다.",
      titleLines: ["제품과 그 아래의", "기술을 함께 만듭니다."],
      highlight: "기술",
      lede: "직접 운영하고, 반복되는 문제는 다시 쓸 수 있는 기술로 정리합니다.",
      proofTitle: "한 번의 출시보다 오래 남는 기반",
      proofBody: "제품에서 확인한 문제를 코드와 운영 기준으로 남겨 다음 작업에 다시 씁니다.",
    },
    method: {
      title: "문제를 찾고, 만들고, 직접 운영합니다.",
      titleLines: ["문제를 찾고,", "만들고, 직접 운영합니다."],
      lede: "기능 목록보다 실제 쓰임을 먼저 확인합니다. 필요한 만큼 만들고, 운영에서 배운 내용을 다음 제품에 남깁니다.",
      items: [
        {
          mark: "ASK",
          title: "실제 문제부터",
          body: "누가 왜 쓰는지 확인한 뒤 해결할 범위를 정합니다.",
          caption: "문제와 사용 맥락을 한 화면에 놓습니다.",
        },
        {
          mark: "BUILD",
          title: "필요한 만큼 단순하게",
          body: "반복되는 부분만 함께 쓸 수 있는 기반으로 만듭니다.",
          caption: "제품과 공통 기반의 경계를 정리합니다.",
        },
        {
          mark: "RUN",
          title: "직접 운영하며 확인",
          body: "실패 경로와 개선할 지점을 운영 과정에서 확인합니다.",
          caption: "관찰한 결과를 다시 제품에 반영합니다.",
        },
      ],
    },
    work: {
      title: "우리가 만든 것",
      lede: "공개할 수 있는 화면과 코드, 설계 자료를 중심으로 현재 작업을 소개합니다.",
      previous: "이전 작업",
      next: "다음 작업",
      open: "저장소 열기",
      unavailable: "현재 공개된 링크가 없습니다",
    },
    open: {
      title: "직접 쓰는 코드를 공개합니다.",
      titleLines: ["직접 쓰는 코드를", "공개합니다."],
      lede: "제품을 만들며 반복해서 필요했던 기능을 분리해 공개하고, 실제 사용을 통해 계속 고칩니다.",
      repository: "GitHub에서 보기",
      sourceLabel: "공개 저장소 · TypeScript · Apache-2.0",
    },
  },
  en: {
    hero: {
      companyType: "Software company",
      location: "Seoul",
      title: "We build products and the systems they need.",
      titleLines: ["We build products", "and the systems", "they need."],
      highlight: "systems",
      lede: "LafLabs plans and builds software products, from the interface to the systems that keep them running.",
      artifactLabel: "From code to an operable product",
    },
    company: {
      title: "We build the product and the technology underneath it.",
      titleLines: ["We build the product", "and the technology", "underneath it."],
      highlight: "technology",
      lede: "We operate what we build and turn repeated problems into reusable foundations.",
      proofTitle: "Foundations that last beyond one launch",
      proofBody: "What a product teaches us becomes code and operating practice that can support the next one.",
    },
    method: {
      title: "Find the problem. Build it. Run it.",
      titleLines: ["Find the problem.", "Build it. Run it."],
      lede: "We begin with a real use, build only what it needs, and carry what operations teach us into the next product.",
      items: [
        {
          mark: "ASK",
          title: "Start with a real problem",
          body: "Define the user, reason, and useful boundary before the feature list.",
          caption: "Put the problem and its context in one frame.",
        },
        {
          mark: "BUILD",
          title: "Keep the system proportional",
          body: "Share only the parts that have become repeated work.",
          caption: "Separate the product from its reusable foundation.",
        },
        {
          mark: "RUN",
          title: "Operate what we ship",
          body: "Use failure paths and operating evidence to decide what changes next.",
          caption: "Carry observed results back into the product.",
        },
      ],
    },
    work: {
      title: "Selected work",
      lede: "Current work is presented through the screens, code, and system material that can be shared today.",
      previous: "Previous work",
      next: "Next work",
      open: "Open repository",
      unavailable: "No public destination yet",
    },
    open: {
      title: "We open the code we use ourselves.",
      titleLines: ["We open the code", "we use ourselves."],
      lede: "These projects began as repeated needs in our own work. We keep using them, fixing them, and documenting the result in public.",
      repository: "View on GitHub",
      sourceLabel: "Public repository · TypeScript · Apache-2.0",
    },
  },
}

export const homeExperimentWork: readonly HomeExperimentWorkItem[] = [
  {
    id: "laf-id",
    title: "Laf ID",
    category: { ko: "제품", en: "Product" },
    status: { ko: "개발자 미리보기", en: "Developer preview" },
    summary: {
      ko: "OAuth 2.0과 OpenID Connect 표준을 따르는 인증 플랫폼입니다.",
      en: "An authentication platform built on OAuth 2.0 and OpenID Connect.",
    },
    tags: ["OAuth 2.0", "OpenID Connect", "API"],
    artifact: {
      kind: "identity",
      source: "published-homepage:laf-id-standards",
      label: { ko: "표준 기반 인증 흐름", en: "Standards-based identity flow" },
      title: { ko: "요청에서 검증까지", en: "From request to verification" },
      lines: ["Authorize", "OpenID Connect", "Verify"],
    },
  },
  {
    id: "lafetch",
    title: "lafetch",
    category: { ko: "오픈소스", en: "Open source" },
    status: { ko: "개발자 미리보기", en: "Developer preview" },
    summary: {
      ko: "Fetch 표준 위에서 동작하는 TypeScript HTTP 클라이언트입니다.",
      en: "A TypeScript HTTP client built on the Fetch standard.",
    },
    tags: ["TypeScript", "Fetch", "Apache-2.0"],
    href: "https://github.com/laflabs-inc/lafetch",
    artifact: {
      kind: "code",
      source: "github:laflabs-inc/lafetch",
      label: { ko: "README 사용 예시", en: "README usage example" },
      title: { ko: "정책이 보이는 요청 코드", en: "Request policy that stays visible" },
      lines: [
        'import { lafetch } from "@laflabs/lafetch"',
        "const api = lafetch.create({",
        '  baseUrl: "https://api.example.com",',
        "})",
        'await api.get<User>("/users/123")',
      ],
    },
  },
  {
    id: "lafwall",
    title: "lafwall",
    category: { ko: "오픈소스", en: "Open source" },
    status: { ko: "개발 중", en: "In progress" },
    summary: {
      ko: "암호화 경계와 기본 차단 권한, 변경할 수 없는 버전 기록을 갖춘 API 중심 시크릿 관리 플랫폼입니다.",
      en: "An API-first secrets platform with an encryption boundary, deny-by-default authorization, and immutable version history.",
    },
    tags: ["Go", "Secrets", "API"],
    artifact: {
      kind: "architecture",
      source: "published-homepage:lafwall-description",
      label: { ko: "공개된 설계 원칙", en: "Published system principles" },
      title: { ko: "경계가 분명한 시크릿 관리", en: "Secrets with explicit boundaries" },
      lines: ["Encryption boundary", "Deny by default", "Immutable versions"],
    },
  },
] as const
