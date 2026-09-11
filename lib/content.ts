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
  search: {
    open: string
    close: string
    heading: string
    prompt: string
    input: string
    prompts: readonly [string, string, string]
    submit: string
    invalid: string
    loading: string
    resultCount: (count: number) => string
    groupPages: string
    groupProducts: string
    groupDocuments: string
    noResult: string
    partialEmpty: string
    partialResult: string
    resultPage: string
    resultProduct: string
    resultRepository: string
    resultNotice: string
    resultLegal: string
    resultDisclosure: string
    unavailable: string
    retry: string
    fallbackNotices: string
    fallbackDesign: string
    fallbackGithub: string
  }
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
    steps: readonly { title: string; body: string; caption: string }[]
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
    kinds: Record<"notice" | "disclosure", string>
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
  nav: { products: "작업", open: "오픈소스", principles: "회사", contact: "문의" },
  search: {
    open: "검색",
    close: "검색 닫기",
    heading: "사이트 검색",
    prompt: "페이지, 제품, 오픈소스와 공개 문서를 검색하세요.",
    input: "무엇을 찾고 있나요?",
    prompts: ["LafLabs에 대해 검색하기", "제품과 오픈소스 찾기", "공개 문서 찾기"],
    submit: "검색 실행",
    invalid: "검색어는 2자 이상 100자 이하로 입력해 주세요.",
    loading: "검색 중입니다.",
    resultCount: (count) => `검색 결과 ${count}개`,
    groupPages: "페이지",
    groupProducts: "제품·오픈소스",
    groupDocuments: "공지·공시·약관",
    noResult: "검색 결과가 없습니다.",
    partialEmpty: "문서 검색을 확인할 수 없어 결과가 없는지 확정할 수 없습니다.",
    partialResult: "문서 검색은 일시적으로 사용할 수 없습니다. 나머지 결과를 표시합니다.",
    resultPage: "페이지",
    resultProduct: "제품",
    resultRepository: "저장소",
    resultNotice: "공지사항",
    resultLegal: "법적 고지",
    resultDisclosure: "공시",
    unavailable: "검색을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    retry: "다시 시도",
    fallbackNotices: "공지사항",
    fallbackDesign: "디자인 가이드",
    fallbackGithub: "GitHub",
  },
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
    lede: "제품에서 찾은 실제 문제를 공통 기반으로 정리하고 직접 운영합니다. 운영에서 확인한 경계와 반복 작업은 오래 쓰는 시스템으로 남깁니다.",
    steps: [
      {
        title: "제품",
        body: "문제는 실제 제품에서 찾습니다. 쓰임이 분명한 것부터 만듭니다.",
        caption: "한 가지 요구가 먼저 작동하는 제품이 됩니다.",
      },
      {
        title: "기반 기술",
        body: "여러 제품에서 반복되는 문제는 공통 기반 기술로 묶습니다.",
        caption: "반복되는 기능을 분리해 여러 제품이 함께 쓰는 기반으로 만듭니다.",
      },
      {
        title: "운영",
        body: "직접 운영하며 실패 경로와 경계를 확인합니다.",
        caption: "로그와 실패 경로에서 코드의 실제 경계를 확인합니다.",
      },
      {
        title: "시스템",
        body: "운영에서 확인한 경계와 반복 작업을 오래 쓰는 시스템으로 남깁니다.",
        caption: "검증된 경계를 다시 조립하지 않아도 되는 구조로 고정합니다.",
      },
    ],
  },
  signals: {
    label: "LATEST SIGNALS",
    title: "새 소식을 전합니다.",
    lede: "제품 업데이트와 기술 기록, 회사 정보를 공개합니다.",
    listTitle: "최근 소식",
    previous: "이전 소식",
    next: "다음 소식",
    loading: "최근 소식을 불러오는 중입니다.",
    empty: "아직 공개된 새 소식이 없습니다.",
    error: "지금은 새 소식을 불러올 수 없습니다.",
    kinds: { notice: "공지사항", disclosure: "공시" },
  },
  open: {
    title: ["필요해서 만들었고,", "쓸 만해져서 열었습니다."],
    lede: "전부 제품을 만들다 막혀서 직접 만든 것들입니다. 우리가 실제로 운영에 쓰고 있고, 그래서 계속 고쳐집니다.",
    all: "GitHub에서 전체 보기",
    descriptions: {
      lafetch: "브라우저와 서버에서 쓸 수 있는 TypeScript HTTP 클라이언트입니다.",
      lafwall: "암호화 경계와 기본 차단 권한, 변경할 수 없는 버전 기록을 갖춘 시크릿 관리 플랫폼입니다.",
      lafinvest: "금융 정보에 담긴 주장과 수치, 출처, 시점의 정확성을 검증하는 AI 인프라입니다.",
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
    blurb: "LafLabs는 제품을 기획하고 개발하며, 운영에 필요한 기반 기술까지 직접 구축하는 소프트웨어 개발사입니다.",
    products: "작업",
    open: "오픈소스",
    company: "회사",
    documents: "문서",
    links: {
      principles: "일하는 방식",
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
  nav: { products: "Work", open: "Open source", principles: "Company", contact: "Contact" },
  search: {
    open: "Search",
    close: "Close search",
    heading: "Site search",
    prompt: "Search pages, products, open source, and public documents.",
    input: "What are you looking for?",
    prompts: ["Search LafLabs", "Find products and open source", "Find public documents"],
    submit: "Search",
    invalid: "Enter a search query between 2 and 100 characters.",
    loading: "Searching.",
    resultCount: (count) => `${count} search result${count === 1 ? "" : "s"}`,
    groupPages: "Pages",
    groupProducts: "Products & open source",
    groupDocuments: "Notices, disclosures & legal",
    noResult: "No search results found.",
    partialEmpty: "Document search is unavailable, so we can't confirm that there are no results.",
    partialResult: "Document search is temporarily unavailable. Showing the remaining results.",
    resultPage: "Page",
    resultProduct: "Product",
    resultRepository: "Repository",
    resultNotice: "Notice",
    resultLegal: "Legal",
    resultDisclosure: "Disclosure",
    unavailable: "Search is unavailable. Please try again shortly.",
    retry: "Try again",
    fallbackNotices: "Notices",
    fallbackDesign: "Design guide",
    fallbackGithub: "GitHub",
  },
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
    lede: "We start with real product problems, move repeated work into a shared foundation, and operate it ourselves. What proves durable becomes a system designed to last.",
    steps: [
      {
        title: "Product",
        body: "Find the problem in a real product. Build the part with a clear use first.",
        caption: "One concrete need becomes the first working product surface.",
      },
      {
        title: "Shared infrastructure",
        body: "Move repeated problems into a common technical foundation.",
        caption: "Repeated capabilities become a foundation shared across products.",
      },
      {
        title: "Operations",
        body: "Run it ourselves and inspect failure paths and boundaries.",
        caption: "Logs and failure paths reveal the boundaries the code actually needs.",
      },
      {
        title: "System",
        body: "Turn proven boundaries and repeated work into a system designed to last.",
        caption: "Proven boundaries settle into a structure we do not have to rebuild.",
      },
    ],
  },
  signals: {
    label: "LATEST SIGNALS",
    title: "Recent work and company updates.",
    lede: "Product updates, engineering notes, and company information in one public record.",
    listTitle: "Latest",
    previous: "Previous story",
    next: "Next story",
    loading: "Loading recent updates.",
    empty: "No updates have been published yet.",
    error: "Recent updates are unavailable right now.",
    kinds: { notice: "Notices", disclosure: "Disclosures" },
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
    blurb: "LafLabs plans and builds software products, including the technology required to operate them.",
    products: "Work",
    open: "Open source",
    company: "Company",
    documents: "Documents",
    links: {
      principles: "How we work",
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

export const documentNavigationCopy: Record<Locale, { label: string }> = {
  ko: { label: "문서 종류" },
  en: { label: "Document sections" },
}

export const documentCategoryCopy = {
  ko: {
    all: "전체",
    uncategorized: "기타",
    toolbarLabel: "문서 찾기",
    categoryLabel: "카테고리",
    sortLabel: "정렬",
    latest: "최신순",
    oldest: "오래된순",
    searchLabel: {
      notice: "공지사항 검색",
      legal: "법적 고지 검색",
      disclosure: "공시 검색",
    },
    searchPlaceholder: "제목이나 요약 검색",
    searchAction: "검색",
    clear: "초기화",
  },
  en: {
    all: "All",
    uncategorized: "Other",
    toolbarLabel: "Find documents",
    categoryLabel: "Category",
    sortLabel: "Sort",
    latest: "Latest",
    oldest: "Oldest",
    searchLabel: {
      notice: "Search notices",
      legal: "Search legal documents",
      disclosure: "Search disclosures",
    },
    searchPlaceholder: "Search titles or summaries",
    searchAction: "Search",
    clear: "Clear",
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
}
