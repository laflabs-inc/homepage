import type { DesignToken, TypographySpecimen } from "./schema"

const typographySpecimens = {
  familySans: { fontFamily: "sans", fontSize: "16px", fontWeight: 400, lineHeight: 1.5, letterSpacing: "0em" },
  familyMono: { fontFamily: "mono", fontSize: "11px", fontWeight: 600, lineHeight: 1.45, letterSpacing: "0em" },
  homepageHero: { fontFamily: "sans", fontSize: "clamp(64px, 6.2vw, 80px)", fontWeight: 780, lineHeight: 0.98, letterSpacing: "-0.04em" },
  companyStatement: { fontFamily: "sans", fontSize: "clamp(52px, 5.6vw, 72px)", fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.04em" },
  sectionHeading: { fontFamily: "sans", fontSize: "clamp(44px, 4.5vw, 60px)", fontWeight: 720, lineHeight: 1.06, letterSpacing: "-0.04em" },
  methodMark: { fontFamily: "sans", fontSize: "clamp(88px, 10.5vw, 154px)", fontWeight: 850, lineHeight: 0.75, letterSpacing: "-0.08em" },
  heroFieldMark: { fontFamily: "sans", fontSize: "clamp(116px, 14vw, 210px)", fontWeight: 850, lineHeight: 0.75, letterSpacing: "-0.08em" },
  panelTitle: { fontFamily: "sans", fontSize: "clamp(27px, 2.5vw, 36px)", fontWeight: 710, lineHeight: 1.08, letterSpacing: "-0.04em" },
  workTitle: { fontFamily: "sans", fontSize: "clamp(32px, 3.4vw, 44px)", fontWeight: 720, lineHeight: 1, letterSpacing: "-0.04em" },
  searchInput: { fontFamily: "sans", fontSize: "clamp(42px, 4.5vw, 64px)", fontWeight: 760, lineHeight: 1, letterSpacing: "-0.04em" },
  searchResult: { fontFamily: "sans", fontSize: "clamp(20px, 1.8vw, 26px)", fontWeight: 720, lineHeight: 1.12, letterSpacing: "-0.04em" },
  compactTitle: { fontFamily: "sans", fontSize: "22px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.04em" },
  monoLabel: { fontFamily: "mono", fontSize: "clamp(10px, 0.8vw, 11px)", fontWeight: 600, lineHeight: 1.45, letterSpacing: "0em" },
  bodyDefault: { fontFamily: "sans", fontSize: "16px", fontWeight: 400, lineHeight: 1.7, letterSpacing: "0em" },
  mobileHomepageHero: { fontFamily: "sans", fontSize: "clamp(40px, 11.6vw, 48px)", fontWeight: 780, lineHeight: 0.98, letterSpacing: "-0.04em" },
  mobileCompany: { fontFamily: "sans", fontSize: "clamp(36px, 10.8vw, 44px)", fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.04em" },
  mobileSection: { fontFamily: "sans", fontSize: "clamp(32px, 9.6vw, 40px)", fontWeight: 720, lineHeight: 1.06, letterSpacing: "-0.04em" },
  mobileMethodMark: { fontFamily: "sans", fontSize: "clamp(94px, 33vw, 136px)", fontWeight: 850, lineHeight: 0.75, letterSpacing: "-0.08em" },
  mobileSearchInput: { fontFamily: "sans", fontSize: "clamp(30px, 9vw, 38px)", fontWeight: 760, lineHeight: 1, letterSpacing: "-0.04em" },
  mobileSearchResult: { fontFamily: "sans", fontSize: "clamp(18px, 5.6vw, 22px)", fontWeight: 720, lineHeight: 1.12, letterSpacing: "-0.04em" },
} as const satisfies Record<string, TypographySpecimen>

export const designTokens = [
  {
    id: "color.primary",
    group: "color",
    value: "#2563eb",
    cssVariable: "--blue",
    purpose: {
      ko: "주요 동작과 선택 상태, 구조를 표시하는 기본 강조색입니다.",
      en: "The primary accent for key actions, selected states, and structure.",
    },
    contrast: {
      ko: "넓은 파란 면에는 흰색을 쓰고 작은 글자에는 대비를 다시 확인합니다.",
      en: "Use white on broad blue surfaces and recheck contrast for small text.",
    },
  },
  {
    id: "color.primary-deep",
    group: "color",
    value: "#1e40af",
    cssVariable: "--deep",
    purpose: {
      ko: "Primary Blue 동작의 hover와 pressed 상태에 씁니다.",
      en: "The hover and pressed color for Primary Blue actions.",
    },
    contrast: {
      ko: "흰색 텍스트와 함께 사용합니다.",
      en: "Pair it with white text.",
    },
  },
  {
    id: "color.paper",
    group: "color",
    value: "#f8fafc",
    cssVariable: "--paper",
    purpose: {
      ko: "페이지와 기본 컨트롤의 바탕색입니다.",
      en: "The default page and control surface.",
    },
    contrast: {
      ko: "본문은 Ink, 보조 설명은 Muted를 사용합니다.",
      en: "Use Ink for body copy and Muted for supporting copy.",
    },
  },
  {
    id: "color.ink",
    group: "color",
    value: "#0f172a",
    cssVariable: "--ink",
    purpose: {
      ko: "기본 텍스트와 선, 어두운 대비 구간에 씁니다.",
      en: "The default text, rule, and dark contrast-band color.",
    },
    contrast: {
      ko: "Paper 위에서는 텍스트와 선에 쓰고 넓은 면에서는 흰색을 올립니다.",
      en: "Use it for text and rules on Paper, or pair an Ink surface with white.",
    },
  },
  {
    id: "color.muted",
    group: "color",
    value: "#64748b",
    cssVariable: "--muted",
    purpose: {
      ko: "보조 설명과 덜 중요한 메타데이터에 씁니다.",
      en: "Supporting copy and lower-priority metadata.",
    },
    contrast: {
      ko: "작은 글자나 어두운 바탕에는 사용하지 않습니다.",
      en: "Do not use it for small text or on dark surfaces.",
    },
  },
  {
    id: "color.line",
    group: "color",
    value: "#cbd5e1",
    cssVariable: "--line",
    purpose: {
      ko: "눈에 덜 띄는 구분선과 비활성 외곽선에 씁니다.",
      en: "Quiet dividers and inactive outlines.",
    },
    contrast: {
      ko: "정보를 색이나 선만으로 구분하지 않습니다.",
      en: "Never rely on color or a rule alone to convey information.",
    },
  },
  {
    id: "color.slate-soft",
    group: "color",
    value: "#94a3b8",
    purpose: {
      ko: "어두운 대비 구간의 메타데이터에 씁니다.",
      en: "Metadata on dark contrast bands.",
    },
  },
  {
    id: "color.slate-detail",
    group: "color",
    value: "#475569",
    purpose: {
      ko: "밝은 바탕의 작은 편집 정보에 씁니다.",
      en: "Compact editorial detail on light surfaces.",
    },
  },
  {
    id: "color.blue-pale",
    group: "color",
    value: "#dbeafe",
    purpose: {
      ko: "큰 비활성 마크와 파란 면의 보조 텍스트에 씁니다.",
      en: "Large passive marks and supporting text on blue surfaces.",
    },
  },
  {
    id: "color.blue-light",
    group: "color",
    value: "#60a5fa",
    purpose: {
      ko: "어두운 대비 구간에서 짧은 강조에 씁니다.",
      en: "Short highlights inside dark contrast bands.",
    },
  },
  {
    id: "color.pure-white",
    group: "color",
    value: "#fff",
    purpose: {
      ko: "어두운 면과 Primary Blue 위의 전경색입니다.",
      en: "Foreground color on Ink and Primary Blue surfaces.",
    },
  },
  {
    id: "color.route-blue",
    group: "color",
    value: "#165dff",
    legacy: true,
    purpose: {
      ko: "이전 route 화면의 채운 버튼과 구조 강조에 쓰던 색입니다.",
      en: "Legacy fill and structural accent from the route-era interface.",
    },
  },
  {
    id: "color.route-blue-deep",
    group: "color",
    value: "#0f4bd8",
    legacy: true,
    purpose: {
      ko: "이전 route 화면의 주요 버튼 hover 색입니다.",
      en: "Legacy primary-button hover color from the route-era interface.",
    },
  },
  {
    id: "color.route-blue-soft",
    group: "color",
    value: "#112b5d",
    legacy: true,
    purpose: {
      ko: "이전 route 화면에서 눈에 덜 띄는 활성 배경입니다.",
      en: "Legacy quiet active surface from the route-era interface.",
    },
  },
  {
    id: "color.page-navy",
    group: "color",
    value: "#0b1328",
    legacy: true,
    purpose: {
      ko: "이전 route 화면의 기본 바탕색입니다.",
      en: "Legacy default page surface from the route-era interface.",
    },
  },
  {
    id: "color.raised-navy",
    group: "color",
    value: "#101c35",
    legacy: true,
    purpose: {
      ko: "이전 route 화면에서 기본 배경보다 밝게 띄운 요소에 쓰던 색입니다.",
      en: "Legacy raised dark detail from the route-era interface.",
    },
  },
  {
    id: "color.subtle-navy",
    group: "color",
    value: "#0e1931",
    legacy: true,
    purpose: {
      ko: "이전 route 화면에서 번갈아 배치한 구간의 바탕색입니다.",
      en: "Legacy alternating section surface from the route-era interface.",
    },
  },
  {
    id: "color.inverse-navy",
    group: "color",
    value: "#071022",
    legacy: true,
    purpose: {
      ko: "이전 route 화면의 문의 구간 바탕색입니다.",
      en: "Legacy contact-section surface from the route-era interface.",
    },
  },
  {
    id: "color.off-white",
    group: "color",
    value: "#f4f7fb",
    legacy: true,
    purpose: {
      ko: "이전 route 화면의 기본 글자와 밝은 컨트롤 색입니다.",
      en: "Legacy text and light-control color from the route-era interface.",
    },
  },
  {
    id: "color.blue-grey",
    group: "color",
    value: "#8ba7d9",
    legacy: true,
    purpose: {
      ko: "이전 route 화면의 보조 글자와 unavailable 상태에 쓰던 색입니다.",
      en: "Legacy supporting copy and unavailable-state color.",
    },
  },
  {
    id: "color.border-blue",
    group: "color",
    value: "#263d68",
    legacy: true,
    purpose: {
      ko: "이전 route 화면의 기본 1px 선 색입니다.",
      en: "Legacy one-pixel rule color from the route-era interface.",
    },
  },
  {
    id: "color.border-blue-strong",
    group: "color",
    value: "#385a91",
    legacy: true,
    purpose: {
      ko: "이전 route 화면의 강조 선과 outline 버튼에 쓰던 색입니다.",
      en: "Legacy emphasized rule and outline-action border color.",
    },
  },
  {
    id: "color.route-line",
    group: "color",
    value: "#8fb6ff",
    legacy: true,
    purpose: {
      ko: "이전 route 화면의 경로와 focus 표시 색입니다.",
      en: "Legacy route, metadata, and focus color.",
    },
  },
  {
    id: "color.route-endpoint",
    group: "color",
    value: "#5e8fe8",
    legacy: true,
    purpose: {
      ko: "이전 route 화면의 경로 끝점 선 색입니다.",
      en: "Legacy route-endpoint stroke color.",
    },
  },
  {
    id: "color.button-ink",
    group: "color",
    value: "#0a0e18",
    legacy: true,
    purpose: {
      ko: "이전 route 화면의 밝은 문의 버튼 글자색입니다.",
      en: "Legacy text color for the light contact action.",
    },
  },
  {
    id: "color.mask-black",
    group: "color",
    value: "#000",
    legacy: true,
    purpose: {
      ko: "이전 기술 목록 마스크의 불투명 지점이며 화면 색으로 쓰지 않습니다.",
      en: "Legacy opaque mask stop, not a visible surface color.",
    },
  },
  {
    id: "typography.family-sans",
    group: "typography",
    value: "Geist Sans, Pretendard, sans-serif",
    specimen: typographySpecimens.familySans,
    purpose: {
      ko: "제목과 본문에 쓰는 기본 글꼴 묶음입니다.",
      en: "The default family stack for headings and body copy.",
    },
  },
  {
    id: "typography.family-mono",
    group: "typography",
    value: "Geist Mono, monospace",
    specimen: typographySpecimens.familyMono,
    purpose: {
      ko: "상태, 인덱스, 기술 메타데이터에만 씁니다.",
      en: "Reserved for status, indices, and technical metadata.",
    },
  },
  {
    id: "typography.homepage-hero",
    group: "typography",
    value: "clamp(64px, 6.2vw, 80px)",
    specimen: typographySpecimens.homepageHero,
    purpose: {
      ko: "홈페이지 핵심 문장에 씁니다. weight 780, line-height 0.98, tracking -0.04em입니다.",
      en: "Homepage proposition at weight 780, line-height 0.98, and -0.04em tracking.",
    },
  },
  {
    id: "typography.company-statement",
    group: "typography",
    value: "clamp(52px, 5.6vw, 72px)",
    specimen: typographySpecimens.companyStatement,
    purpose: {
      ko: "어두운 회사 소개 구간에 씁니다. weight 700, line-height 1.04, tracking -0.04em입니다.",
      en: "Dark-band company statement at weight 700, line-height 1.04, and -0.04em tracking.",
    },
  },
  {
    id: "typography.section-heading",
    group: "typography",
    value: "clamp(44px, 4.5vw, 60px)",
    specimen: typographySpecimens.sectionHeading,
    purpose: {
      ko: "주요 구간 제목에 씁니다. weight 720, line-height 1.06, tracking -0.04em입니다.",
      en: "Major section headings at weight 720, line-height 1.06, and -0.04em tracking.",
    },
  },
  {
    id: "typography.method-mark",
    group: "typography",
    value: "clamp(88px, 10.5vw, 154px)",
    specimen: typographySpecimens.methodMark,
    purpose: {
      ko: "ASK, BUILD, RUN 그래픽 문자에만 씁니다. weight 850, line-height 0.75입니다.",
      en: "Graphic ASK, BUILD, and RUN marks only, at weight 850 and line-height 0.75.",
    },
  },
  {
    id: "typography.hero-field-mark",
    group: "typography",
    value: "clamp(116px, 14vw, 210px)",
    specimen: typographySpecimens.heroFieldMark,
    purpose: {
      ko: "홈페이지 hero 영역의 큰 필드 마크에만 씁니다. weight 850, line-height 0.75입니다.",
      en: "The large homepage hero field mark only, at weight 850 and line-height 0.75.",
    },
  },
  {
    id: "typography.panel-title",
    group: "typography",
    value: "clamp(27px, 2.5vw, 36px)",
    specimen: typographySpecimens.panelTitle,
    purpose: {
      ko: "경계가 있는 모듈의 제목에 씁니다. weight 710, line-height 1.08입니다.",
      en: "Titles inside bounded modules at weight 710 and line-height 1.08.",
    },
  },
  {
    id: "typography.work-title",
    group: "typography",
    value: "clamp(32px, 3.4vw, 44px)",
    specimen: typographySpecimens.workTitle,
    purpose: {
      ko: "선택한 작업의 제목에 씁니다. weight 720, line-height 1입니다.",
      en: "Selected-work titles at weight 720 and line-height 1.",
    },
  },
  {
    id: "typography.search-input",
    group: "typography",
    value: "clamp(42px, 4.5vw, 64px)",
    specimen: typographySpecimens.searchInput,
    purpose: {
      ko: "검색 overlay 입력에 씁니다. weight 760, line-height 1입니다.",
      en: "Search-overlay input at weight 760 and line-height 1.",
    },
  },
  {
    id: "typography.search-result",
    group: "typography",
    value: "clamp(20px, 1.8vw, 26px)",
    specimen: typographySpecimens.searchResult,
    purpose: {
      ko: "검색 결과 제목에 씁니다. weight 720, line-height 1.12입니다.",
      en: "Search-result headings at weight 720 and line-height 1.12.",
    },
  },
  {
    id: "typography.compact-title",
    group: "typography",
    value: "22px",
    specimen: typographySpecimens.compactTitle,
    purpose: {
      ko: "작은 목록과 저장소 제목에 씁니다. weight 700입니다.",
      en: "Compact list and repository titles at weight 700.",
    },
  },
  {
    id: "typography.mono-label",
    group: "typography",
    value: "10–11px",
    specimen: typographySpecimens.monoLabel,
    purpose: {
      ko: "인덱스, 메타데이터, 상태, 짧은 내비게이션 label에 씁니다.",
      en: "Indices, metadata, states, and compact navigation labels.",
    },
  },
  {
    id: "typography.body-default",
    group: "typography",
    value: "16px",
    specimen: typographySpecimens.bodyDefault,
    purpose: {
      ko: "기본 본문 크기입니다. 문맥에 따라 14px에서 17px 사이를 사용합니다.",
      en: "Default body size, with contextual sizes ranging from 14px to 17px.",
    },
  },
  {
    id: "typography.mobile-homepage-hero",
    group: "typography",
    value: "clamp(40px, 11.6vw, 48px)",
    specimen: typographySpecimens.mobileHomepageHero,
    purpose: {
      ko: "작은 화면의 홈페이지 핵심 문장에 씁니다.",
      en: "The homepage proposition on small screens.",
    },
  },
  {
    id: "typography.mobile-company",
    group: "typography",
    value: "clamp(36px, 10.8vw, 44px)",
    specimen: typographySpecimens.mobileCompany,
    purpose: {
      ko: "작은 화면의 회사 소개 문장에 씁니다.",
      en: "Company statements on small screens.",
    },
  },
  {
    id: "typography.mobile-section",
    group: "typography",
    value: "clamp(32px, 9.6vw, 40px)",
    specimen: typographySpecimens.mobileSection,
    purpose: {
      ko: "작은 화면의 주요 구간 제목에 씁니다.",
      en: "Major section headings on small screens.",
    },
  },
  {
    id: "typography.mobile-method-mark",
    group: "typography",
    value: "clamp(94px, 33vw, 136px)",
    specimen: typographySpecimens.mobileMethodMark,
    purpose: {
      ko: "작은 화면의 ASK, BUILD, RUN 마크에 씁니다.",
      en: "ASK, BUILD, and RUN marks on small screens.",
    },
  },
  {
    id: "typography.mobile-search-input",
    group: "typography",
    value: "clamp(30px, 9vw, 38px)",
    specimen: typographySpecimens.mobileSearchInput,
    purpose: {
      ko: "작은 화면의 검색 입력에 씁니다.",
      en: "Search input on small screens.",
    },
  },
  {
    id: "typography.mobile-search-result",
    group: "typography",
    value: "clamp(18px, 5.6vw, 22px)",
    specimen: typographySpecimens.mobileSearchResult,
    purpose: {
      ko: "작은 화면의 검색 결과 제목에 씁니다.",
      en: "Search-result headings on small screens.",
    },
  },
  {
    id: "spacing.section-vertical",
    group: "spacing",
    value: "80px–150px",
    purpose: {
      ko: "콘텐츠 양과 화면 폭에 따라 구간 위아래 여백을 조절합니다.",
      en: "Responsive vertical section space, adjusted to content and viewport width.",
    },
  },
  {
    id: "layout.shell",
    group: "layout",
    value: "min(1280px, calc(100% - 64px))",
    cssVariable: "--shell",
    purpose: {
      ko: "현재 공개 화면의 최대 콘텐츠 폭과 양쪽 여백을 정합니다.",
      en: "The current public-shell maximum width and inline space.",
    },
  },
  {
    id: "layout.gutter",
    group: "layout",
    value: "max(32px, calc((100vw - 1280px) / 2))",
    cssVariable: "--gutter",
    purpose: {
      ko: "전체 폭 구간의 반응형 양쪽 여백입니다.",
      en: "Responsive inline space for full-width sections.",
    },
  },
  {
    id: "layout.breakpoint-stack",
    group: "layout",
    value: "1080px",
    purpose: {
      ko: "복잡한 데스크톱 구성을 쌓기 시작하는 기준입니다.",
      en: "The breakpoint where complex desktop arrangements begin to stack.",
    },
  },
  {
    id: "layout.breakpoint-mobile",
    group: "layout",
    value: "720px",
    purpose: {
      ko: "탐색과 다단 구성을 한 열로 바꾸는 작은 화면 기준입니다.",
      en: "The small-screen breakpoint for collapsed navigation and one-column layout.",
    },
  },
  {
    id: "layout.compact-control",
    group: "layout",
    value: "34px",
    purpose: {
      ko: "데스크톱의 언어 선택과 Icon Control에 쓰는 시각 크기입니다.",
      en: "The desktop visual size for language and icon controls.",
    },
  },
  {
    id: "shape.radius",
    group: "shape",
    value: "0px",
    purpose: {
      ko: "컨트롤, 면, 표시 요소의 기본 모서리 값입니다.",
      en: "The default corner radius for controls, surfaces, and indicators.",
    },
  },
  {
    id: "shape.rule",
    group: "shape",
    value: "1px",
    purpose: {
      ko: "구간과 목록, 컨트롤을 나누는 기본 선 두께입니다.",
      en: "The default rule width for sections, rows, and controls.",
    },
  },
  {
    id: "motion.segmented-toggle",
    group: "motion",
    value: "spring(stiffness: 520, damping: 38)",
    purpose: {
      ko: "Segmented Toggle의 선택 표시가 이동할 때 쓰는 공통 spring입니다.",
      en: "The shared spring for the Segmented Toggle selection thumb.",
    },
  },
  {
    id: "motion.reduced",
    group: "motion",
    value: "0ms",
    purpose: {
      ko: "reduced motion 환경에서는 상태 전환을 즉시 끝냅니다.",
      en: "State transitions complete immediately when reduced motion is requested.",
    },
  },
] as const satisfies readonly DesignToken[]
