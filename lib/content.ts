import type { Locale } from "@/lib/i18n"

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://laflabs.com"
export const contactEmail = "hello@laflabs.com"
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
  { id: "laf-id", name: "Laf ID", href: "https://id.laflabs.com", domain: "id.laflabs.com" },
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
    overline: string
    titleQuiet: string
    titleLoud: string
    lede: string
    primary: string
    secondary: string
    scroll: string
  }
  /** Split into words for the scroll-driven reveal. */
  statement: { eyebrow: string; words: readonly string[]; footnote: string }
  stripLabel: string
  products: {
    eyebrow: string
    title: readonly [string, string]
    lede: string
    visit: string
    soon: string
  } & Record<ProductId, ProductCopy>
  open: {
    eyebrow: string
    title: readonly [string, string]
    lede: string
    all: string
    descriptions: Record<RepoName, string>
  }
  principles: {
    eyebrow: string
    title: readonly [string, string]
    lede: string
    items: readonly { key: string; body: string }[]
  }
  name: { eyebrow: string; laf: string; labs: string; note: string }
  cta: { eyebrow: string; title: readonly [string, string]; lede: string; mail: string; github: string }
  footer: {
    blurb: string
    products: string
    open: string
    company: string
    links: { principles: string; contact: string; github: string }
    rights: string
    location: string
  }
}

const ko: Copy = {
  nav: { products: "제품", open: "오픈소스", principles: "원칙", contact: "문의" },
  hero: {
    overline: "LafLabs Inc. — Seoul, South Korea",
    titleQuiet: "보이지 않는",
    titleLoud: "인프라를 만듭니다",
    lede: "신원, 결제, 클라우드. 세 겹의 인프라를 하나의 경험으로 잇습니다. 복잡함은 우리가 갖고, 쓰는 사람에게는 단순함만 남깁니다.",
    primary: "제품 살펴보기",
    secondary: "GitHub",
    scroll: "아래로",
  },
  statement: {
    eyebrow: "우리가 믿는 것",
    words: ["좋은", "인프라는", "눈에", "띄지", "않습니다.", "우리는", "아무도", "보지", "않는", "그", "아래를", "만듭니다."],
    footnote: "그래서 우리 이름은 제품 위가 아니라 아래에 있습니다.",
  },
  stripLabel: "우리가 쓰는 것",
  products: {
    eyebrow: "제품",
    title: ["세 겹의 인프라,", "하나의 규칙."],
    lede: "신원, 결제, 인프라는 결국 한 코드베이스 안에서 만납니다. 하나를 익히면 나머지도 예측할 수 있도록 같은 규칙 위에 올렸습니다.",
    visit: "바로가기",
    soon: "준비 중",
    "laf-id": {
      layer: "Identity",
      tagline: "신원 인프라",
      description: "OAuth 2.0과 OpenID Connect 위에 올린 인증 플랫폼. 표준을 다시 구현하지 않고 안전한 로그인을 연결합니다.",
      status: "Developer Preview",
      points: ["Authorization Code + PKCE", "OIDC Discovery · JWKS", "Verify API"],
    },
    "laf-pay": {
      layer: "Payments",
      tagline: "결제·빌링 인프라",
      description: "결제, 구독, 정산을 하나의 일관된 API로 다룹니다. 결제 수단이 늘어나도 연동 코드는 그대로입니다.",
      status: "개발 중",
      points: ["일관된 결제 API", "구독 · 빌링", "정산 리포트"],
    },
    lafdock: {
      layer: "Cloud",
      tagline: "클라우드 플랫폼",
      description: "컴퓨트, 호스팅, 네트워킹을 묶은 클라우드 플랫폼. 서버를 다루는 시간을 제품 만드는 시간으로 돌려줍니다.",
      status: "개발 중",
      points: ["컴퓨트 · 호스팅", "네트워킹", "배포 파이프라인"],
    },
  },
  open: {
    eyebrow: "오픈소스",
    title: ["필요해서 만들었고,", "쓸 만해져서 열었습니다."],
    lede: "전부 제품을 만들다 막혀서 직접 만든 것들입니다. 우리가 실제로 운영에 쓰고 있고, 그래서 계속 고쳐집니다.",
    all: "GitHub에서 전체 보기",
    descriptions: {
      lafetch: "브라우저와 서버 모두에서 동작하는 가볍고 타입 우선인 HTTP 클라이언트.",
      lafwall: "Laf Secrets. 암호화 경계와 기본 차단 권한, 변경 불가능한 버전 기록을 갖춘 API 우선 시크릿 관리 플랫폼.",
      lafinvest: "금융 정보의 주장, 수치, 출처, 시점 정확성을 검증하는 AI 인프라.",
    },
  },
  principles: {
    eyebrow: "원칙",
    title: ["조용히 만들고,", "확실하게 돌아가게."],
    lede: "빠르게 만드는 방법은 많지만 오래 가는 방법은 적습니다. 우리는 매번 후자를 고릅니다.",
    items: [
      { key: "단순함", body: "문제를 푸는 가장 짧은 길을 고릅니다. 덜 만든 것은 덜 고장납니다." },
      { key: "신뢰성", body: "아무 일도 일어나지 않는 상태가 가장 좋은 상태입니다. 장애는 눈에 띄기 전에 끝냅니다." },
      { key: "보안", body: "안전한 쪽을 기본값으로 두고, 예외는 반드시 명시적으로 남깁니다." },
      { key: "확장성", body: "오늘의 규모에 맞춰 만들되, 내일의 규모를 막는 결정은 하지 않습니다." },
      { key: "일관성", body: "하나를 배우면 나머지도 짐작할 수 있어야 합니다. 놀라움은 문서가 아니라 버그입니다." },
    ],
  },
  name: {
    eyebrow: "이름에 대하여",
    laf: "재미있는 이야기, 웃음",
    labs: "만들고 실험하는 곳",
    note: "이름은 가볍게 지었지만 만드는 방식은 그렇지 않습니다. 재미있는 걸 만들려면 그 아래가 지루할 만큼 튼튼해야 한다고 믿습니다. 잘 만든 인프라는 눈에 띄지 않고, 그래서 사람들은 그 위에서 마음껏 놀 수 있습니다.",
  },
  cta: {
    eyebrow: "함께하기",
    title: ["같이 만들 사람을", "찾고 있습니다."],
    lede: "제품 도입, 기술 협업, 합류 문의 모두 환영합니다. 편하게 메일 주세요.",
    mail: "메일 보내기",
    github: "GitHub 둘러보기",
  },
  footer: {
    blurb: "재미있는 것을 만드는 소프트웨어 개발사. 신원, 결제, 클라우드 인프라를 하나의 경험으로 잇습니다.",
    products: "제품",
    open: "오픈소스",
    company: "회사",
    links: { principles: "원칙", contact: "문의하기", github: "GitHub" },
    rights: "All rights reserved.",
    location: "Seoul, South Korea",
  },
}

const en: Copy = {
  nav: { products: "Products", open: "Open source", principles: "Principles", contact: "Contact" },
  hero: {
    overline: "LafLabs Inc. — Seoul, South Korea",
    titleQuiet: "We build the",
    titleLoud: "invisible parts",
    lede: "Identity, payments, cloud. Three layers of infrastructure connected into one experience. We keep the complexity; everyone building on top of it gets the simple part.",
    primary: "See the products",
    secondary: "GitHub",
    scroll: "Scroll",
  },
  statement: {
    eyebrow: "What we believe",
    words: ["Good", "infrastructure", "is", "invisible.", "We", "build", "the", "layer", "nobody", "ever", "looks", "at."],
    footnote: "Which is why our name sits underneath the product, not on top of it.",
  },
  stripLabel: "WHAT WE BUILD WITH",
  products: {
    eyebrow: "Products",
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
      description: "Compute, hosting, and networking in one platform — so the hours you spend on servers go back into the product instead.",
      status: "In development",
      points: ["Compute & hosting", "Networking", "Deploy pipelines"],
    },
  },
  open: {
    eyebrow: "Open source",
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
    eyebrow: "Principles",
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
    eyebrow: "About the name",
    laf: "a good story, a laugh",
    labs: "where things get built",
    note: "The name is lighthearted; the engineering underneath is not. Building something fun requires a foundation boring enough to be trusted. Good infrastructure goes unnoticed — which is exactly what gives everyone above it room to play.",
  },
  cta: {
    eyebrow: "Get in touch",
    title: ["We're looking for people", "to build this with."],
    lede: "Product questions, technical partnerships, or joining the team — all welcome. Just send us a note.",
    mail: "Send an email",
    github: "Browse GitHub",
  },
  footer: {
    blurb: "A software company that builds fun things, connecting identity, payments, and cloud infrastructure into one experience.",
    products: "Products",
    open: "Open source",
    company: "Company",
    links: { principles: "Principles", contact: "Contact", github: "GitHub" },
    rights: "All rights reserved.",
    location: "Seoul, South Korea",
  },
}

export const copy: Record<Locale, Copy> = { ko, en }
