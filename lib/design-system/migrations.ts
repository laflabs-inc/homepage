import type { MigrationEntry } from "./schema"

export const migrations = [
  {
    id: "action-to-button",
    legacyApi: "Action",
    recommendedApi: "Button / ButtonLink",
    summary: {
      ko: "실행과 이동을 분리해 올바른 HTML 의미와 상호작용을 유지합니다.",
      en: "Separate actions from navigation to preserve native semantics and interaction.",
    },
    guidance: [
      { ko: "현재 화면의 동작은 Button을 사용합니다.", en: "Use Button for an action in the current interface." },
      { ko: "다른 주소로 이동하면 ButtonLink를 사용합니다.", en: "Use ButtonLink when the result is navigation." },
    ],
    replacementComponents: ["button", "button-link"],
  },
  {
    id: "icon-control-to-button",
    legacyApi: "IconControl",
    recommendedApi: "Button size=\"icon\"",
    summary: {
      ko: "아이콘 전용 동작도 Button의 상태와 접근성 계약을 그대로 사용합니다.",
      en: "Icon-only actions now share Button states and accessibility contracts.",
    },
    guidance: [
      { ko: "보이는 텍스트가 없으면 aria-label로 동작을 설명합니다.", en: "Provide aria-label when no visible label is present." },
      { ko: "장식 아이콘은 보조 기술에서 숨깁니다.", en: "Hide the decorative icon from assistive technology." },
    ],
    replacementComponents: ["button"],
  },
  {
    id: "segmented-toggle-to-segmented-control",
    legacyApi: "SegmentedToggle",
    recommendedApi: "SegmentedControl",
    summary: {
      ko: "두 개에 한정된 토글 대신 여러 선택지를 지원하는 하나의 선택 계약을 사용합니다.",
      en: "Replace the two-option toggle with one selection contract that supports multiple values.",
    },
    guidance: [
      { ko: "선택지가 둘 이상이어도 같은 items 구조를 사용합니다.", en: "Use the same items structure for two or more options." },
      { ko: "현재 선택값과 그룹 이름을 항상 제공합니다.", en: "Always provide the current value and a group label." },
    ],
    replacementComponents: ["segmented-control"],
  },
  {
    id: "status-label-tone",
    legacyApi: "StatusLabel variant",
    recommendedApi: "StatusLabel tone",
    summary: {
      ko: "상태의 의미를 시각 변형이 아닌 semantic tone으로 지정합니다.",
      en: "Express status meaning with semantic tone instead of a visual variant.",
    },
    guidance: [
      { ko: "variant는 호환용이며 새 코드는 tone을 사용합니다.", en: "variant remains compatible; new code uses tone." },
      { ko: "색상만으로 상태를 전달하지 말고 텍스트를 함께 씁니다.", en: "Pair tone with text instead of communicating through color alone." },
    ],
    replacementComponents: ["status-label"],
  },
  {
    id: "alert-compound-anatomy",
    legacyApi: "Alert title prop",
    recommendedApi: "Alert compound anatomy",
    summary: {
      ko: "아이콘, 제목, 설명, 동작을 필요한 만큼 직접 조합합니다.",
      en: "Compose icon, title, description, and action explicitly as needed.",
    },
    guidance: [
      { ko: "AlertIcon, AlertContent, AlertTitle, AlertDescription을 사용합니다.", en: "Use AlertIcon, AlertContent, AlertTitle, and AlertDescription." },
      { ko: "title prop은 기존 화면의 호환을 위해 유지됩니다.", en: "The title prop remains for compatibility with existing surfaces." },
    ],
    replacementComponents: ["alert"],
  },
  {
    id: "notice-toast-to-toast",
    legacyApi: "NoticeToastProvider / useNoticeToast",
    recommendedApi: "ToastProvider / useToast",
    summary: {
      ko: "하나의 Toast 큐와 상태 계약으로 일시적인 결과 안내를 통합합니다.",
      en: "Unify transient outcomes under one Toast queue and state contract.",
    },
    guidance: [
      { ko: "기존 이름은 현재 호환되지만 새 코드는 Toast API를 사용합니다.", en: "Legacy names remain compatible; new code uses the Toast API." },
      { ko: "지속적인 오류나 복구 동작은 Alert를 사용합니다.", en: "Use Alert for persistent errors or recovery actions." },
    ],
    replacementComponents: ["toast", "alert"],
  },
  {
    id: "dialog-compound-body",
    legacyApi: "DialogContent closeLabel-only composition",
    recommendedApi: "DialogBody / DialogClose composition",
    summary: {
      ko: "긴 내용과 동작을 분리하고 닫기 제어의 위치를 화면이 직접 결정합니다.",
      en: "Separate long content from actions and let the surface place its close control.",
    },
    guidance: [
      { ko: "스크롤되는 내용은 DialogBody 안에 둡니다.", en: "Place scrollable content inside DialogBody." },
      { ko: "명시적인 닫기 동작은 DialogClose로 조합합니다.", en: "Compose an explicit close action with DialogClose." },
      { ko: "closeLabel은 기존 X 버튼 호환용으로만 유지합니다.", en: "Keep closeLabel only for the compatible legacy X control." },
    ],
    replacementComponents: ["dialog", "button"],
  },
] as const satisfies readonly MigrationEntry[]
