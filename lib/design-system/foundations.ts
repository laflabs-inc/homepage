import type { FoundationEntry } from "./schema"

export const foundations = [
  {
    id: "identity",
    title: { ko: "브랜드 아이덴티티", en: "Brand identity" },
    summary: {
      ko: "공식 로고의 형태와 비율을 그대로 유지합니다.",
      en: "Keep the official logo shape and proportions intact.",
    },
    guidance: [
      {
        ko: "공식 PNG 에셋을 사용하고 자르거나 다시 그리지 않습니다.",
        en: "Use the official PNG asset; do not crop or redraw it.",
      },
      {
        ko: "로고 둘레에 충분한 여백을 두고 바탕과 선명하게 구분합니다.",
        en: "Give the logo clear space and strong contrast against its surface.",
      },
      {
        ko: "로고에 그림자, 윤곽선, 색 효과를 더하지 않습니다.",
        en: "Do not add shadows, outlines, or color effects to the logo.",
      },
    ],
  },
  {
    id: "color",
    title: { ko: "컬러", en: "Color" },
    summary: {
      ko: "Paper와 Ink를 기본으로 두고 Primary Blue만 강조색으로 씁니다.",
      en: "Use Paper and Ink by default, with Primary Blue as the sole accent.",
    },
    guidance: [
      {
        ko: "파란색은 주요 동작, 선택 상태, 진행 방향에만 사용합니다.",
        en: "Reserve blue for key actions, selected states, and direction.",
      },
      {
        ko: "이전 route 색상은 legacy 참고값이며 새 화면의 기본색으로 쓰지 않습니다.",
        en: "Route-era colors are legacy references, not defaults for new surfaces.",
      },
      {
        ko: "상태나 의미를 색 하나로만 전달하지 않습니다.",
        en: "Never communicate state or meaning with color alone.",
      },
    ],
  },
  {
    id: "typography",
    title: { ko: "타이포그래피", en: "Typography" },
    summary: {
      ko: "Sans는 내용을, Mono는 짧은 시스템 정보를 맡습니다.",
      en: "Sans carries meaning; Mono carries compact system information.",
    },
    guidance: [
      {
        ko: "Geist Sans에 Pretendard를 이어 한글과 영문 밀도를 맞춥니다.",
        en: "Pair Geist Sans with Pretendard to balance Korean and Latin text.",
      },
      {
        ko: "큰 제목은 짧게 쓰고 본문 폭은 한눈에 읽을 수 있게 제한합니다.",
        en: "Keep large headings short and body measures easy to scan.",
      },
      {
        ko: "새 UI에서 9px 글자를 사용하지 않습니다.",
        en: "Do not introduce 9px text in new UI.",
      },
      {
        ko: "한글 문장은 의미 단위가 깨지지 않도록 줄바꿈을 확인합니다.",
        en: "Check Korean line breaks so phrases remain intact.",
      },
    ],
  },
  {
    id: "spacing-layout",
    title: { ko: "간격과 레이아웃", en: "Spacing and layout" },
    summary: {
      ko: "1280px shell과 반응형 gutter로 수평 리듬을 맞춥니다.",
      en: "A 1280px shell and responsive gutter establish horizontal rhythm.",
    },
    guidance: [
      {
        ko: "기본 shell은 min(1280px, calc(100% - 64px))입니다.",
        en: "The current shell is min(1280px, calc(100% - 64px)).",
      },
      {
        ko: "전체 폭 구간은 --gutter를 사용하고 임의의 양쪽 여백을 더하지 않습니다.",
        en: "Use --gutter for full-width sections instead of adding ad hoc inline space.",
      },
      {
        ko: "1080px에서 복잡한 구성을 쌓고 720px에서 한 열 흐름으로 정리합니다.",
        en: "Stack complex layouts at 1080px and move to a one-column flow at 720px.",
      },
      {
        ko: "구간 위아래에는 80px에서 150px 사이의 넉넉한 여백을 둡니다.",
        en: "Keep generous vertical section space between 80px and 150px.",
      },
    ],
  },
  {
    id: "shape",
    title: { ko: "형태", en: "Shape" },
    summary: {
      ko: "0px 모서리와 1px 선으로 구조를 드러냅니다.",
      en: "Use zero-radius corners and one-pixel rules to reveal structure.",
    },
    guidance: [
      {
        ko: "컨트롤, 면, 표시 요소는 사각형으로 만듭니다.",
        en: "Keep controls, surfaces, and indicators square.",
      },
      {
        ko: "카드 그림자보다 면의 대비와 선을 먼저 사용합니다.",
        en: "Prefer surface contrast and rules to card shadows.",
      },
      {
        ko: "원은 제품 의미가 분명할 때만 사용합니다.",
        en: "Use circles only when the product meaning requires one.",
      },
    ],
  },
  {
    id: "iconography",
    title: { ko: "아이콘", en: "Iconography" },
    summary: {
      ko: "새 인터페이스 아이콘은 Phosphor 한 세트로 맞춥니다.",
      en: "Use the Phosphor family consistently for new interface icons.",
    },
    guidance: [
      {
        ko: "장식용 SVG를 직접 그리지 말고 의미가 맞는 Phosphor 아이콘을 고릅니다.",
        en: "Choose a meaningful Phosphor icon instead of drawing decorative SVGs.",
      },
      {
        ko: "아이콘만 있는 컨트롤에는 접근성 이름을 제공합니다.",
        en: "Give icon-only controls an accessible name.",
      },
      {
        ko: "34px compact control 안의 아이콘은 현재 기준인 15px로 맞춥니다.",
        en: "Use the current 15px icon size inside a 34px compact control.",
      },
    ],
  },
  {
    id: "motion",
    title: { ko: "모션", en: "Motion" },
    summary: {
      ko: "모션은 진입, 진행, 상태 변화만 설명합니다.",
      en: "Motion explains entry, progress, and state changes only.",
    },
    guidance: [
      {
        ko: "Segmented Toggle은 stiffness 520, damping 38의 공통 spring을 씁니다.",
        en: "The Segmented Toggle uses the shared spring at stiffness 520 and damping 38.",
      },
      {
        ko: "hover에서 레이아웃 위치나 padding을 움직이지 않습니다.",
        en: "Do not move layout position or padding on hover.",
      },
      {
        ko: "prefers-reduced-motion에서는 최종 상태를 즉시 보여줍니다.",
        en: "Under prefers-reduced-motion, show the final state immediately.",
      },
    ],
  },
  {
    id: "accessibility",
    title: { ko: "접근성", en: "Accessibility" },
    summary: {
      ko: "키보드, 대비, 이름, 상태를 함께 확인합니다.",
      en: "Verify keyboard access, contrast, names, and states together.",
    },
    guidance: [
      {
        ko: "모든 동작 요소는 키보드로 쓸 수 있어야 하며 focus 표시가 보여야 합니다.",
        en: "Every action must work by keyboard and show a visible focus indicator.",
      },
      {
        ko: "아이콘 컨트롤과 그룹에는 용도를 알 수 있는 이름을 제공합니다.",
        en: "Give icon controls and groups names that explain their purpose.",
      },
      {
        ko: "작은 화면의 조작 영역은 44px를 확보합니다.",
        en: "Keep a 44px target area on small screens.",
      },
      {
        ko: "loading, empty, error 상태를 글로도 알립니다.",
        en: "Communicate loading, empty, and error states in text.",
      },
    ],
  },
  {
    id: "voice",
    title: { ko: "문장과 말투", en: "Voice" },
    summary: {
      ko: "짧고 구체적으로 쓰며 기술 용어는 원형을 유지합니다.",
      en: "Write briefly and concretely while preserving technical terms.",
    },
    guidance: [
      {
        ko: "한 문장으로 충분한 설명은 늘리지 않습니다.",
        en: "Do not expand an explanation when one sentence is enough.",
      },
      {
        ko: "API, token 같은 기술 용어와 영어 식별자는 그대로 둡니다.",
        en: "Keep technical terms such as API and token, and preserve English identifiers.",
      },
      {
        ko: "한글과 영문은 같은 정보를 담되 문장 순서를 억지로 맞추지 않습니다.",
        en: "Keep Korean and English equivalent without forcing identical word order.",
      },
    ],
  },
  {
    id: "claims",
    title: { ko: "사실과 주장", en: "Factual claims" },
    summary: {
      ko: "출처로 확인한 사실만 공개 문서에 씁니다.",
      en: "Publish only claims that can be verified.",
    },
    guidance: [
      {
        ko: "고객, 지표, 제품 상태, 채용 정보는 출처를 확인한 뒤에만 씁니다.",
        en: "Mention customers, metrics, product status, or hiring only when a source verifies it.",
      },
      {
        ko: "확인하지 못한 내용은 unavailable로 표시하거나 문서에서 뺍니다.",
        en: "Mark unverified material unavailable or omit it.",
      },
      {
        ko: "빈 화면을 그럴듯한 수치나 사례로 채우지 않습니다.",
        en: "Never fill an empty surface with invented numbers or examples.",
      },
    ],
  },
] as const satisfies readonly FoundationEntry[]
