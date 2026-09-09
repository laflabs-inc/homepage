import type { Locale } from "@/lib/i18n"

export type WorkCategory = "product" | "open-source" | "internal" | "client"
export type WorkStatus = "released" | "preview" | "in-progress" | "archived"
export type WorkVisualKind = "code" | "document" | "system"

export type WorkItem = {
  slug: string
  title: string
  category: WorkCategory
  status: WorkStatus
  summary: Record<Locale, string>
  tags: readonly string[]
  href?: string
  featured: boolean
  order: number
  visual: {
    kind: WorkVisualKind
    label: Record<Locale, string>
    lines: readonly string[]
  }
}

export const workItems: readonly WorkItem[] = [
  {
    slug: "laf-id",
    title: "Laf ID",
    category: "product",
    status: "preview",
    summary: {
      ko: "OAuth 2.0과 OpenID Connect 표준을 따르는 인증 플랫폼입니다. 안전한 로그인 흐름을 제품에 연결하는 일을 단순하게 만듭니다.",
      en: "An authentication platform built on OAuth 2.0 and OpenID Connect, designed to make secure sign-in flows easier to connect.",
    },
    tags: ["OAuth 2.0", "OpenID Connect", "API"],
    featured: true,
    order: 1,
    visual: {
      kind: "system",
      label: { ko: "현재 공개 범위", en: "Current public scope" },
      lines: ["Authorization Code + PKCE", "OIDC Discovery", "JWKS", "Verify API"],
    },
  },
  {
    slug: "lafetch",
    title: "lafetch",
    category: "open-source",
    status: "preview",
    summary: {
      ko: "Fetch 표준 위에서 동작하는 TypeScript HTTP 클라이언트입니다. 요청 코드 안에서 Timeout, Retry, Cache 정책을 읽기 쉽게 선언합니다.",
      en: "A TypeScript HTTP client built on the Fetch standard. Timeout, retry, and cache policies stay explicit in the request chain.",
    },
    tags: ["TypeScript", "Fetch", "Apache-2.0"],
    href: "https://github.com/laflabs-inc/lafetch",
    featured: true,
    order: 2,
    visual: {
      kind: "code",
      label: { ko: "README 사용 예시", en: "README usage example" },
      lines: [
        'import { lafetch } from "@laflabs/lafetch";',
        "",
        "const api = lafetch.create({",
        '  baseUrl: "https://api.example.com",',
        "});",
        "",
        'const response = await api.get<User>("/users/123");',
        "response.data;",
      ],
    },
  },
  {
    slug: "lafwall",
    title: "lafwall",
    category: "open-source",
    status: "in-progress",
    summary: {
      ko: "암호화 경계와 기본 차단 권한, 변경할 수 없는 버전 기록을 갖춘 API 중심 시크릿 관리 플랫폼입니다.",
      en: "An API-first secrets platform with an encryption boundary, deny-by-default authorization, and immutable version history.",
    },
    tags: ["Go", "Secrets", "API"],
    href: "https://github.com/laflabs-inc/lafwall",
    featured: true,
    order: 3,
    visual: {
      kind: "system",
      label: { ko: "설계 원칙", en: "System principles" },
      lines: ["Encryption boundary", "Deny by default", "Immutable versions", "API first"],
    },
  },
] as const

const lafetchSnippet = [
  'import { lafetch } from "@laflabs/lafetch";',
  "",
  "const api = lafetch.create({",
  '  baseUrl: "https://api.example.com",',
  "});",
  "",
  "const { data: users } = await api",
  '  .get<User[]>("/users")',
  '  .timeout("3s")',
  "  .retry(2);",
] as const

type HomepageCopy = {
  hero: {
    title: string
    lede: string
    primary: string
    secondary: string
    companyType: string
    location: string
  }
  company: {
    title: string
    lede: string
    scopes: readonly { title: string; body: string }[]
  }
  method: {
    title: string
    lede: string
    items: readonly { mark: string; title: string; body: string }[]
  }
  work: {
    title: string
    lede: string
    region: string
    previous: string
    next: string
    openRepository: string
    unavailable: string
    categories: Record<WorkCategory, string>
    statuses: Record<WorkStatus, string>
  }
  engineering: {
    title: string
    lede: string
    file: string
    resultTitle: string
    resultBody: string
    repository: string
    snippet: readonly string[]
  }
  open: {
    title: string
    lede: string
    all: string
  }
  contact: {
    title: string
    lede: string
  }
}

const ko: HomepageCopy = {
  hero: {
    title: "제품을 만들고, 필요한 기반을 직접 구축합니다.",
    lede: "LafLabs는 제품을 기획하고 개발하는 소프트웨어 회사입니다. 사용자에게 보이는 화면부터 운영에 필요한 기반까지 직접 설계합니다.",
    primary: "회사 알아보기",
    secondary: "우리가 만든 것",
    companyType: "소프트웨어 개발사",
    location: "서울",
  },
  company: {
    title: "제품과 그 아래의 기술을 함께 만듭니다.",
    lede: "화면에 보이는 기능만 만들고 끝내지 않습니다. 제품을 직접 운영하고, 반복되는 문제는 다음 작업에도 쓸 수 있는 기반으로 정리합니다.",
    scopes: [
      { title: "제품 설계와 개발", body: "문제를 정의하고 실제로 쓰이는 제품까지 만듭니다." },
      { title: "웹과 API", body: "화면과 서버가 같은 기준으로 움직이도록 설계합니다." },
      { title: "운영 기반", body: "배포, 관측, 보안을 제품 개발의 일부로 다룹니다." },
      { title: "오픈소스", body: "반복해서 쓰는 기술은 공개하고 함께 다듬습니다." },
    ],
  },
  method: {
    title: "문제를 찾고, 만들고, 직접 운영합니다.",
    lede: "제품은 실제 문제에서 시작합니다. 필요한 만큼 만들고, 운영에서 확인한 사실을 다음 작업에 남깁니다.",
    items: [
      { mark: "문제", title: "실제 문제부터", body: "쓰임이 분명한 문제부터 풉니다. 기능보다 먼저 누가, 왜 쓰는지 확인합니다." },
      { mark: "구축", title: "필요한 만큼 단순하게", body: "처음부터 큰 시스템을 만들지 않습니다. 반복되는 문제만 함께 쓸 수 있는 기반으로 정리합니다." },
      { mark: "운영", title: "직접 운영하며 확인", body: "만드는 데서 끝내지 않습니다. 직접 운영하며 실패 경로와 개선할 지점을 확인합니다." },
    ],
  },
  work: {
    title: "우리가 만든 것",
    lede: "준비 중인 제품과 공개한 오픈소스를 한곳에 모았습니다. 지금 확인할 수 있는 범위와 상태도 함께 적었습니다.",
    region: "우리가 만든 것",
    previous: "이전 작업",
    next: "다음 작업",
    openRepository: "저장소 열기",
    unavailable: "현재 공개된 링크가 없습니다",
    categories: { product: "제품", "open-source": "오픈소스", internal: "내부 시스템", client: "고객 작업" },
    statuses: { released: "공개", preview: "개발자 미리보기", "in-progress": "개발 중", archived: "보관" },
  },
  engineering: {
    title: "코드가 결과를 설명합니다.",
    lede: "동작을 설정 파일 뒤에 숨기지 않고 요청 코드에 드러냅니다. 아래 코드는 lafetch의 공개 README에 있는 예시입니다.",
    file: "examples/basic.ts",
    resultTitle: "요청 코드에 드러난 실패 처리",
    resultBody: "Timeout과 Retry가 요청 흐름에 그대로 남습니다. 별도 설정 파일을 오가지 않아도 어떻게 동작할지 알 수 있습니다.",
    repository: "GitHub에서 lafetch 보기",
    snippet: lafetchSnippet,
  },
  open: {
    title: "직접 쓰는 코드를 공개합니다.",
    lede: "제품을 만들며 반복해서 필요했던 기능을 분리해 공개합니다. 실제로 사용하는 코드인 만큼 계속 고치고 기록합니다.",
    all: "GitHub에서 전체 보기",
  },
  contact: {
    title: "함께할 이야기가 있다면 연락해 주세요.",
    lede: "제품 도입, 기술 협업, 투자, 채용 문의를 받습니다.",
  },
}

const en: HomepageCopy = {
  hero: {
    title: "We build products and the systems they need.",
    lede: "LafLabs is a software company that plans and builds products, from the interface people use to the infrastructure that keeps it running.",
    primary: "About the company",
    secondary: "Selected work",
    companyType: "Software company",
    location: "Seoul",
  },
  company: {
    title: "We build the product and the technology underneath it.",
    lede: "Our work does not stop at the visible feature. We operate what we build and turn repeated problems into foundations the next project can reuse.",
    scopes: [
      { title: "Product design and development", body: "Define the problem and build through to a product people can use." },
      { title: "Web and API", body: "Design interfaces and servers around the same contract." },
      { title: "Operations", body: "Treat deployment, observability, and security as product work." },
      { title: "Open source", body: "Open the technology we reuse and keep improving it in public." },
    ],
  },
  method: {
    title: "Find the problem. Build it. Run it.",
    lede: "Our process is easier to trust than a list of abstract values. We build only what is needed and carry what operations teach us into the next project.",
    items: [
      { mark: "ASK", title: "Start with a real problem", body: "Begin where the use is clear. Who needs it and why comes before the feature list." },
      { mark: "BUILD", title: "Keep the system proportional", body: "Do not build the large platform first. Share only the parts that have become repeated work." },
      { mark: "RUN", title: "Operate what we ship", body: "Stay with the product after launch. Failure paths show where the next improvement belongs." },
    ],
  },
  work: {
    title: "Selected work",
    lede: "Products in progress and open-source work share one clear format, including what is public and where each project stands today.",
    region: "Selected work",
    previous: "Previous work",
    next: "Next work",
    openRepository: "Open repository",
    unavailable: "No public destination yet",
    categories: { product: "Product", "open-source": "Open source", internal: "Internal system", client: "Client work" },
    statuses: { released: "Released", preview: "Developer preview", "in-progress": "In progress", archived: "Archived" },
  },
  engineering: {
    title: "The code is part of the proof.",
    lede: "Instead of hiding behavior behind configuration, we keep the request policy readable. This is a real usage example from the public lafetch README.",
    file: "examples/basic.ts",
    resultTitle: "Failure policy you can read",
    resultBody: "Timeout and retry stay in the request flow. A team can understand the behavior without jumping between configuration files.",
    repository: "View lafetch on GitHub",
    snippet: lafetchSnippet,
  },
  open: {
    title: "We open the code we use ourselves.",
    lede: "These projects began as repeated needs in our own product work. We keep using them, fixing them, and documenting the result in public.",
    all: "See everything on GitHub",
  },
  contact: {
    title: "Have something to build together? Get in touch.",
    lede: "We welcome product, technical partnership, investment, and career inquiries.",
  },
}

export const homepageCopy: Record<Locale, HomepageCopy> = { ko, en }
