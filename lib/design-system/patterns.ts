import type { PatternEntry } from "./schema"

export const patterns = [
  {
    id: "site-chrome",
    title: { ko: "사이트 공통 영역", en: "Site chrome" },
    summary: {
      ko: "기존 Site Header와 Footer가 모든 공개 화면을 감쌉니다.",
      en: "The existing Site Header and Footer frame every public surface.",
    },
    guidance: [
      {
        ko: "페이지 안에 두 번째 고정 내비게이션을 만들지 않습니다.",
        en: "Do not add a second fixed navbar inside a page.",
      },
      {
        ko: "로고, 언어 선택, 검색, 문서 이동은 기존 공통 영역에 둡니다.",
        en: "Keep logo, locale, search, and document navigation in their established chrome positions.",
      },
      {
        ko: "현재 페이지의 로컬 탐색은 콘텐츠 shell 안에 둡니다.",
        en: "Place page-local navigation inside the content shell.",
      },
    ],
    relatedComponents: ["logo", "segmented-toggle", "icon-control", "text-link"],
  },
  {
    id: "editorial-heading",
    title: { ko: "편집형 제목", en: "Editorial heading" },
    summary: {
      ko: "짧은 제목과 필요한 설명만으로 구간의 목적을 밝힙니다.",
      en: "A short heading and only the necessary copy establish a section's purpose.",
    },
    guidance: [
      {
        ko: "보조 라벨, 번호, 부제를 습관처럼 겹치지 않습니다.",
        en: "Do not stack an eyebrow, number, and subtitle by default.",
      },
      {
        ko: "제목과 설명의 폭을 따로 제한해 위계를 분명히 합니다.",
        en: "Constrain heading and description measures separately to clarify hierarchy.",
      },
      {
        ko: "다음 목적지가 필요할 때만 Text Link를 붙입니다.",
        en: "Add a Text Link only when the section needs an onward destination.",
      },
    ],
    relatedComponents: ["text-link"],
  },
  {
    id: "collection-row",
    title: { ko: "컬렉션 행", en: "Collection row" },
    summary: {
      ko: "여백과 1px 선으로 반복 항목을 나누는 전체 폭 행입니다.",
      en: "A full-width row separated by space and one-pixel rules.",
    },
    guidance: [
      {
        ko: "카드로 감싸지 않고 항목 사이의 선과 간격을 유지합니다.",
        en: "Keep rules and spacing between items instead of wrapping each item in a card.",
      },
      {
        ko: "이름, 설명, 상태나 동작의 열을 같은 기준선에 맞춥니다.",
        en: "Align name, description, and status or action to shared columns.",
      },
      {
        ko: "hover에서 padding을 움직이지 않습니다.",
        en: "Do not animate padding on hover.",
      },
    ],
    relatedComponents: ["button", "separator", "status-label", "text-link"],
  },
  {
    id: "selected-work",
    title: { ko: "선택한 작업", en: "Selected work" },
    summary: {
      ko: "실제 이미지와 확인된 설명을 한 편집 모듈에 묶습니다.",
      en: "An editorial module pairing a real image with verified project copy.",
    },
    guidance: [
      {
        ko: "public에 있는 실제 이미지만 사용하며 가짜 화면은 만들지 않습니다.",
        en: "Use real images from public and never fabricate a product screen.",
      },
      {
        ko: "제품 상태와 목적지는 현재 데이터에 있을 때만 표시합니다.",
        en: "Show product status and destinations only when current data provides them.",
      },
      {
        ko: "이전과 다음 동작은 이름 있는 button으로 만들고 키보드 조작을 지원합니다.",
        en: "Provide previous and next actions as named, keyboard-operable buttons.",
      },
    ],
    relatedComponents: ["button", "segmented-toggle", "icon-control", "text-link"],
  },
  {
    id: "document-surface",
    title: { ko: "문서 화면", en: "Document surface" },
    summary: {
      ko: "목록과 읽기 화면은 같은 shell과 본문 리듬을 유지합니다.",
      en: "A shared shell and reading rhythm connect document indices and detail pages.",
    },
    guidance: [
      {
        ko: "본문 폭, 제목 단계, 날짜와 메타데이터 위치를 문서마다 바꾸지 않습니다.",
        en: "Keep body measure, heading levels, dates, and metadata placement consistent.",
      },
      {
        ko: "코드는 Code Block으로 표시하고 inline 식별자와 구분합니다.",
        en: "Use Code Block for multiline code and distinguish it from inline identifiers.",
      },
      {
        ko: "목록과 본문 사이의 이동은 직접적인 링크로 제공합니다.",
        en: "Use direct links between document indices and reading surfaces.",
      },
    ],
    relatedComponents: ["field", "code-block", "panel", "separator", "text-link"],
  },
  {
    id: "system-states",
    title: { ko: "시스템 상태", en: "System states" },
    summary: {
      ko: "loading, empty, error 상태를 같은 화면 문법으로 설명합니다.",
      en: "Loading, empty, and error states share one visual and verbal grammar.",
    },
    guidance: [
      {
        ko: "상태와 다음 동작을 짧은 문장으로 알립니다.",
        en: "Name the state and the next available action in short copy.",
      },
      {
        ko: "error에는 가능한 경우 retry 동작을 제공합니다.",
        en: "Provide a retry action for errors when recovery is available.",
      },
      {
        ko: "empty 상태를 임의의 예시 데이터로 채우지 않습니다.",
        en: "Do not fill empty states with invented example data.",
      },
    ],
    relatedComponents: ["alert", "button", "empty-state", "panel", "skeleton", "status-label", "text-link"],
  },
  {
    id: "responsive-collapse",
    title: { ko: "반응형 쌓기", en: "Responsive collapse" },
    summary: {
      ko: "넓은 화면의 관계를 작은 화면에서 한 열의 읽기 순서로 바꿉니다.",
      en: "Desktop relationships become a one-column reading order on small screens.",
    },
    guidance: [
      {
        ko: "1080px에서 복잡한 grid를 쌓고 720px에서 탐색과 동작을 정리합니다.",
        en: "Stack complex grids at 1080px and simplify navigation and actions at 720px.",
      },
      {
        ko: "데스크톱 도식을 축소하지 말고 같은 내용을 읽기 순서로 다시 배치합니다.",
        en: "Reorder the same content for reading instead of shrinking a desktop diagram.",
      },
      {
        ko: "작은 화면의 동작 영역은 44px를 유지합니다.",
        en: "Keep a 44px target area on small screens.",
      },
    ],
    relatedComponents: ["button", "button-group", "field", "segmented-toggle", "icon-control"],
  },
  {
    id: "contrast-band",
    title: { ko: "대비 구간", en: "Contrast band" },
    summary: {
      ko: "밝은 공개 화면 안에서 Ink 면을 제한적으로 사용해 흐름을 나눕니다.",
      en: "A restrained Ink surface divides the flow of the light public theme.",
    },
    guidance: [
      {
        ko: "어두운 구간은 회사 소개처럼 분명한 내용 전환에만 씁니다.",
        en: "Use a dark band only for a clear content shift, such as the company statement.",
      },
      {
        ko: "기본 텍스트는 흰색, 짧은 강조는 Blue Light를 사용합니다.",
        en: "Use white for primary text and Blue Light for short highlights.",
      },
      {
        ko: "legacy인 Page Navy를 새 공개 화면의 기본 배경으로 되살리지 않습니다.",
        en: "Do not restore legacy Page Navy as the default surface for new public pages.",
      },
    ],
    relatedComponents: ["logo", "action", "text-link"],
  },
] as const satisfies readonly PatternEntry[]
