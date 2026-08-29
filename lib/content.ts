import type { Locale } from "@/lib/i18n"
import type { DocumentKind } from "@/lib/documents/types"

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://laflabs.co"
export const contactEmail = "contact@laflabs.co"
export const githubOrg = "https://github.com/laflabs-inc"

/** Language-independent facts. Kept out of the copy tables so the two
 *  locales can never drift on a URL, a repo name, or a stack item. */
export const stack = [
  "TypeScript",
  "Next.js",
  "React",
  "Node.js",
  "Python",
  "FastAPI",
  "Kotlin",
  "Go",
  "PostgreSQL",
  "Redis",
  "Docker",
  "Linux",
  "Cloudflare",
  "Vercel",
] as const

export const products = [
  { id: "laf-id", name: "Laf ID", href: null, domain: "id.laflabs.com" },
  { id: "laf-pay", name: "Laf Pay", href: null, domain: "pay.laflabs.com" },
  { id: "lafdock", name: "LafDock", href: null, domain: "lafdock.com" },
] as const

export type ProductId = (typeof products)[number]["id"]

export const repositories = [
  { name: "lafetch", href: `${githubOrg}/lafetch`, language: "TypeScript", dot: "#3178c6" },
  { name: "lafwall", href: `${githubOrg}/lafwall`, language: "Go", dot: "#00add8" },
  { name: "lafinvest", href: `${githubOrg}/lafinvest`, language: "Python", dot: "#3572a5" },
] as const

export type RepoName = (typeof repositories)[number]["name"]

export const motto = "Build quietly. Work reliably."

type ProductCopy = {
  layer: string
  tagline: string
  description: string
  status: string
  points: readonly [string, string, string]
}

type Copy = {
  nav: { products: string; open: string; principles: string; contact: string }
  hero: {
    titleQuiet: string
    titleLoud: string
    lede: string
    primary: string
    secondary: string
  }
  /** Split into words for the scroll-driven reveal. */
  statement: { eyebrow: string; words: readonly string[]; footnote: string }
  stripLabel: string
  products: {
    title: readonly [string, string]
    lede: string
    visit: string
    soon: string
  } & Record<ProductId, ProductCopy>
  buildLoop: {
    title: string
    lede: string
    steps: readonly { title: string; body: string }[]
  }
  signals: {
    label: string
    title: string
    lede: string
    listTitle: string
    previous: string
    next: string
    loading: string
    empty: string
    error: string
    kinds: Record<"notice" | "disclosure" | "design", string>
  }
  open: {
    title: readonly [string, string]
    lede: string
    all: string
    descriptions: Record<RepoName, string>
  }
  principles: {
    title: readonly [string, string]
    lede: string
    items: readonly { key: string; body: string }[]
  }
  name: { laf: string; labs: string; note: string }
  cta: { title: readonly [string, string]; lede: string; mail: string; github: string }
  footer: {
    blurb: string
    products: string
    open: string
    company: string
    documents: string
    links: {
      principles: string
      contact: string
      github: string
      notices: string
      legal: string
      disclosures: string
      design: string
    }
    rights: string
    cookieSettings: string
  }
}

const ko: Copy = {
  nav: { products: "제품", open: "오픈소스", principles: "원칙", contact: "문의" },
  hero: {
    titleQuiet: "보이지 않는",
    titleLoud: "인프라를 만듭니다",
    lede: "신원, 결제, 클라우드. 세 겹의 인프라를 하나의 경험으로 잇습니다. 복잡함은 우리가 갖고, 쓰는 사람에게는 단순함만 남깁니다.",
    primary: "제품 살펴보기",
    secondary: "GitHub",
  },
  statement: {
    eyebrow: "우리가 믿는 것",
    words: ["좋은", "인프라는", "눈에", "띄지", "않습니다.", "우리는", "아무도", "보지", "않는", "그", "아래를", "만듭니다."],
    footnote: "그래서 우리 이름은 제품 위가 아니라 아래에 있습니다.",
  },
  stripLabel: "우리가 쓰는 것",
  products: {
    title: ["세 겹의 인프라,", "하나의 규칙."],
    lede: "신원, 결제, 인프라는 결국 한 코드베이스 안에서 만납니다. 하나를 익히면 나머지도 예측할 수 있도록 같은 규칙 위에 올렸습니다.",
    visit: "바로가기",
    soon: "준비 중",
    "laf-id": {
      layer: "Identity",
      tagline: "신원 인프라",
      description: "OAuth 2.0과 OpenID Connect를 따르는 인증 플랫폼입니다. 표준을 다시 만들지 않고 안전한 로그인을 연결합니다.",
      status: "Developer Preview",
      points: ["Authorization Code + PKCE", "OIDC Discovery · JWKS", "Verify API"],
    },
    "laf-pay": {
      layer: "Payments",
      tagline: "결제·빌링 인프라",
      description: "결제와 구독, 정산을 하나의 API로 다룹니다. 결제 수단이 늘어나도 연동 코드는 바뀌지 않습니다.",
      status: "개발 중",
      points: ["일관된 결제 API", "구독 · 빌링", "정산 리포트"],
    },
    lafdock: {
      layer: "Cloud",
      tagline: "클라우드 플랫폼",
      description: "컴퓨트, 호스팅, 네트워킹을 한데 묶은 클라우드 플랫폼입니다. 서버 관리에 쓰던 시간을 제품 개발에 돌립니다.",
      status: "개발 중",
      points: ["컴퓨트 · 호스팅", "네트워킹", "배포 파이프라인"],
    },
  },
  buildLoop: {
    title: "제품에서 시작해 시스템으로 남깁니다.",
    lede: "제품에서 찾은 실제 문제를 공통 인프라로 정리해 직접 운영합니다. 다른 팀에도 쓸모가 확인되면 코드를 공개합니다.",
    steps: [
      { title: "제품", body: "문제는 실제 제품에서 찾습니다. 쓰임이 분명한 것부터 만듭니다." },
      { title: "기반 기술", body: "여러 제품에서 반복되는 문제는 공통 기반 기술로 묶습니다." },
      { title: "운영", body: "직접 운영하며 실패 경로와 경계를 확인합니다." },
      { title: "오픈소스", body: "다른 팀에도 쓸모가 확인된 코드는 공개하고 계속 다듬습니다." },
    ],
  },
  signals: {
    label: "LATEST SIGNALS",
    title: "만든 것과 배운 것을 기록합니다.",
    lede: "제품 소식부터 기술 기준과 회사 정보까지, 확인할 수 있는 형태로 남깁니다.",
    listTitle: "최근 소식",
    previous: "이전 소식",
    next: "다음 소식",
    loading: "최근 소식을 불러오는 중입니다.",
    empty: "아직 공개된 새 소식이 없습니다.",
    error: "지금은 새 소식을 불러올 수 없습니다.",
    kinds: { notice: "공지사항", disclosure: "공시", design: "디자인 가이드" },
  },
  open: {
    title: ["필요해서 만들었고,", "쓸 만해져서 열었습니다."],
    lede: "전부 제품을 만들다 막혀서 직접 만든 것들입니다. 우리가 실제로 운영에 쓰고 있고, 그래서 계속 고쳐집니다.",
    all: "GitHub에서 전체 보기",
    descriptions: {
      lafetch: "브라우저와 서버에서 모두 동작하는 가벼운 타입 우선 HTTP 클라이언트.",
      lafwall: "Laf Secrets. 암호화 경계, 기본 차단 방식의 권한 관리, 변경할 수 없는 버전 기록을 갖춘 API 우선 시크릿 관리 플랫폼.",
      lafinvest: "금융 정보의 주장과 수치, 출처, 시점의 정확성을 검증하는 AI 인프라.",
    },
  },
  principles: {
    title: ["조용히 만들고,", "확실하게 돌아가게."],
    lede: "빠르게 만드는 방법은 많지만 오래 가는 방법은 적습니다. 우리는 매번 후자를 고릅니다.",
    items: [
      { key: "단순함", body: "문제를 푸는 가장 짧은 길을 택합니다. 덜 만들수록 고장 날 곳도 줄어듭니다." },
      { key: "신뢰성", body: "아무 일도 일어나지 않을 때가 가장 좋습니다. 장애는 눈에 띄기 전에 끝냅니다." },
      { key: "보안", body: "안전한 쪽을 기본값으로 두고 예외는 반드시 명시합니다." },
      { key: "확장성", body: "오늘의 규모에 맞춰 만들되 내일의 규모를 막을 결정은 피합니다." },
      { key: "일관성", body: "하나를 배우면 나머지도 짐작할 수 있어야 합니다. 놀라움은 문서가 아니라 버그입니다." },
    ],
  },
  name: {
    laf: "재미있는 이야기, 웃음",
    labs: "만들고 실험하는 곳",
    note: "이름은 가볍게 지었지만 만드는 방식은 그렇지 않습니다. 재미있는 걸 만들려면 그 아래가 지루할 만큼 튼튼해야 한다고 믿습니다. 잘 만든 인프라는 눈에 띄지 않고, 그래서 사람들은 그 위에서 마음껏 놀 수 있습니다.",
  },
  cta: {
    title: ["같이 만들 사람을", "찾고 있습니다."],
    lede: "제품 도입, 기술 협업, 합류 문의 모두 환영합니다. 편하게 메일 주세요.",
    mail: "메일 보내기",
    github: "GitHub 둘러보기",
  },
  footer: {
    blurb: "LafLabs는 재미있는 것을 만드는 소프트웨어 개발사입니다. 신원, 결제, 클라우드 인프라를 하나의 경험으로 잇습니다.",
    products: "제품",
    open: "오픈소스",
    company: "회사",
    documents: "문서",
    links: {
      principles: "원칙",
      contact: "문의하기",
      github: "GitHub",
      notices: "공지사항",
      legal: "법적 고지",
      disclosures: "공시",
      design: "디자인 가이드",
    },
    rights: "All rights reserved.",
    cookieSettings: "쿠키 설정",
  },
}

const en: Copy = {
  nav: { products: "Products", open: "Open source", principles: "Principles", contact: "Contact" },
  hero: {
    titleQuiet: "We build the",
    titleLoud: "invisible parts",
    lede: "Identity, payments, cloud. Three layers of infrastructure connected into one experience. We keep the complexity; everyone building on top of it gets the simple part.",
    primary: "See the products",
    secondary: "GitHub",
  },
  statement: {
    eyebrow: "What we believe",
    words: ["Good", "infrastructure", "is", "invisible.", "We", "build", "the", "layer", "nobody", "ever", "looks", "at."],
    footnote: "Which is why our name sits underneath the product, not on top of it.",
  },
  stripLabel: "WHAT WE BUILD WITH",
  products: {
    title: ["Three layers.", "One set of rules."],
    lede: "Identity, payments, and infrastructure always end up in the same codebase. Ours are built on shared conventions, so learning one tells you how the others behave.",
    visit: "Visit",
    soon: "Coming soon",
    "laf-id": {
      layer: "Identity",
      tagline: "Identity infrastructure",
      description: "An authentication platform built on OAuth 2.0 and OpenID Connect. Connect a secure sign-in flow without reimplementing the standards.",
      status: "Developer Preview",
      points: ["Authorization Code + PKCE", "OIDC Discovery · JWKS", "Verify API"],
    },
    "laf-pay": {
      layer: "Payments",
      tagline: "Payments & billing",
      description: "Payments, subscriptions, and settlement behind one consistent API. Add a payment method without touching your integration code.",
      status: "In development",
      points: ["One consistent API", "Subscriptions & billing", "Settlement reporting"],
    },
    lafdock: {
      layer: "Cloud",
      tagline: "Cloud platform",
      description: "Compute, hosting, and networking in one platform, so the hours spent on servers go back into the product.",
      status: "In development",
      points: ["Compute & hosting", "Networking", "Deploy pipelines"],
    },
  },
  buildLoop: {
    title: "Products first. Systems follow.",
    lede: "We start with real product problems, turn repeated work into shared infrastructure, operate it ourselves, and open what proves useful.",
    steps: [
      { title: "Product", body: "Find the problem in a real product. Build the part with a clear use first." },
      { title: "Shared infrastructure", body: "Move repeated problems into a common technical foundation." },
      { title: "Operations", body: "Run it ourselves and inspect failure paths and boundaries." },
      { title: "Open source", body: "Open code that proves useful to other teams, then keep improving it." },
    ],
  },
  signals: {
    label: "LATEST SIGNALS",
    title: "We document what we build and learn.",
    lede: "From product updates to technical standards and company information, we keep the record public.",
    listTitle: "Latest",
    previous: "Previous story",
    next: "Next story",
    loading: "Loading recent updates.",
    empty: "No updates have been published yet.",
    error: "Recent updates are unavailable right now.",
    kinds: { notice: "Notices", disclosure: "Disclosures", design: "Design guide" },
  },
  open: {
    title: ["Built because we needed it.", "Opened once it earned its keep."],
    lede: "Every one of these started as something that blocked us while building a product. We run them in production, which is why they keep improving.",
    all: "See everything on GitHub",
    descriptions: {
      lafetch: "A lightweight, TypeScript-first HTTP client that runs in the browser and on the server.",
      lafwall: "Laf Secrets. API-first secret management with an encryption boundary, deny-by-default authorization, and immutable version history.",
      lafinvest: "Financial AI verification infrastructure for validating claims, numbers, citations, and point-in-time accuracy.",
    },
  },
  principles: {
    title: ["Build quietly.", "Work reliably."],
    lede: "There are many ways to build something fast and far fewer that last. We pick the second kind every time.",
    items: [
      { key: "Simplicity", body: "Take the shortest path that solves the problem. Code you never wrote never breaks." },
      { key: "Reliability", body: "Nothing happening is the best possible state. Incidents get resolved before anyone notices them." },
      { key: "Security", body: "The safe option is the default. Every exception has to be written down on purpose." },
      { key: "Scalability", body: "Build for the load you have, but never make a decision that blocks the load you'll have." },
      { key: "Consistency", body: "Learn one thing and you can guess the rest. Surprise is a bug, not a documentation problem." },
    ],
  },
  name: {
    laf: "a good story, a laugh",
    labs: "where things get built",
    note: "The name is lighthearted; the engineering underneath is not. Building something fun requires a foundation boring enough to be trusted. Good infrastructure goes unnoticed. That is exactly what gives everyone above it room to play.",
  },
  cta: {
    title: ["We're looking for people", "to build this with."],
    lede: "Product questions, technical partnerships, or joining the team are all welcome. Just send us a note.",
    mail: "Send an email",
    github: "Browse GitHub",
  },
  footer: {
    blurb: "A software company that builds fun things, connecting identity, payments, and cloud infrastructure into one experience.",
    products: "Products",
    open: "Open source",
    company: "Company",
    documents: "Documents",
    links: {
      principles: "Principles",
      contact: "Contact",
      github: "GitHub",
      notices: "Notices",
      legal: "Legal",
      disclosures: "Disclosures",
      design: "Design guide",
    },
    rights: "All rights reserved.",
    cookieSettings: "Cookie settings",
  },
}

export const copy: Record<Locale, Copy> = { ko, en }

type LocalizedDocumentCopy = {
  eyebrow: string
  title: string
  description: string
  empty: string
  unavailableTitle: string
  unavailableBody: string
  koreanLink: string
  contents: string
  published: string
  effective: string
  back: string
}

export type DocumentSectionCopy = {
  path: `/${string}`
  localized: Record<Locale, LocalizedDocumentCopy>
}

export const documentCategoryCopy = {
  ko: {
    all: "전체",
    uncategorized: "기타",
    filterLabel: {
      notice: "공지사항 카테고리 필터",
      legal: "법적 고지 카테고리 필터",
      disclosure: "공시 카테고리 필터",
      design: "디자인 가이드 카테고리 필터",
    },
    labels: {
      general: "일반",
      service: "서비스",
      maintenance: "점검",
      security: "보안",
      privacy: "개인정보",
      terms: "이용약관",
      cookies: "쿠키",
      policy: "정책",
      corporate: "기업",
      financial: "재무",
      governance: "지배구조",
      material: "주요사항",
      foundation: "기초",
      brand: "브랜드",
      component: "컴포넌트",
      resource: "리소스",
    },
  },
  en: {
    all: "All",
    uncategorized: "Other",
    filterLabel: {
      notice: "Filter notices by category",
      legal: "Filter legal documents by category",
      disclosure: "Filter disclosures by category",
      design: "Filter design documents by category",
    },
    labels: {
      general: "General",
      service: "Service",
      maintenance: "Maintenance",
      security: "Security",
      privacy: "Privacy",
      terms: "Terms",
      cookies: "Cookies",
      policy: "Policy",
      corporate: "Corporate",
      financial: "Financial",
      governance: "Governance",
      material: "Material",
      foundation: "Foundation",
      brand: "Brand",
      component: "Components",
      resource: "Resources",
    },
  },
} as const

export const documentRouteStateCopy = {
  ko: {
    errorTitle: "문서를 불러오지 못했습니다.",
    errorBody: "잠시 후 다시 시도해 주세요. 홈페이지와 다른 서비스는 계속 이용할 수 있습니다.",
    retry: "다시 시도",
    notFoundTitle: "문서를 찾을 수 없습니다.",
    notFoundBody: "게시되지 않았거나 더 이상 제공되지 않는 문서입니다.",
    home: "홈으로 돌아가기",
  },
  en: {
    errorTitle: "We could not load this document.",
    errorBody: "Please try again shortly. The homepage and other services remain available.",
    retry: "Try again",
    notFoundTitle: "Document not found.",
    notFoundBody: "This document is unpublished or no longer available.",
    home: "Back to home",
  },
} as const

const commonDocumentCopy = {
  ko: {
    unavailableTitle: "이 문서는 선택한 언어로 제공되지 않습니다.",
    unavailableBody: "한국어 문서는 게시되어 있습니다.",
    koreanLink: "한국어 문서 보기",
    contents: "목차",
    published: "게시",
    effective: "시행",
    back: "목록으로",
  },
  en: {
    unavailableTitle: "This document is not available in English.",
    unavailableBody: "A Korean version of this document is available.",
    koreanLink: "Read the Korean version",
    contents: "Contents",
    published: "Published",
    effective: "Effective",
    back: "Back to list",
  },
} as const

export const documentSections: Record<DocumentKind, DocumentSectionCopy> = {
  notice: {
    path: "/notices",
    localized: {
      ko: { ...commonDocumentCopy.ko, eyebrow: "회사 소식", title: "공지사항", description: "LafLabs의 서비스와 운영 소식을 전합니다.", empty: "아직 게시된 공지사항이 없습니다." },
      en: { ...commonDocumentCopy.en, eyebrow: "Company updates", title: "Notices", description: "Service and operational updates from LafLabs.", empty: "There are no published notices yet." },
    },
  },
  legal: {
    path: "/legal",
    localized: {
      ko: { ...commonDocumentCopy.ko, eyebrow: "정책과 약관", title: "법적 고지", description: "LafLabs의 약관과 정책을 확인하세요.", empty: "아직 게시된 법적 고지가 없습니다." },
      en: { ...commonDocumentCopy.en, eyebrow: "Policies and terms", title: "Legal", description: "Terms, policies, and other legal notices from LafLabs.", empty: "There are no published legal notices yet." },
    },
  },
  disclosure: {
    path: "/disclosures",
    localized: {
      ko: { ...commonDocumentCopy.ko, eyebrow: "회사 정보", title: "공시", description: "LafLabs의 주요 회사 정보를 공개합니다.", empty: "아직 게시된 공시가 없습니다." },
      en: { ...commonDocumentCopy.en, eyebrow: "Company information", title: "Disclosures", description: "Published corporate information from LafLabs.", empty: "There are no published disclosures yet." },
    },
  },
  design: {
    path: "/design",
    localized: {
      ko: { ...commonDocumentCopy.ko, eyebrow: "브랜드와 인터페이스", title: "디자인 가이드", description: "LafLabs의 디자인 원칙과 리소스를 소개합니다.", empty: "아직 게시된 디자인 가이드가 없습니다." },
      en: { ...commonDocumentCopy.en, eyebrow: "Brand and interface", title: "Design guide", description: "Design principles and resources from LafLabs.", empty: "There are no published design guides yet." },
    },
  },
}
