import type { ComponentEntry } from "./schema"

const imports = {
  logo: 'import { Logo } from "@/components/ui/logo"',
  segmentedToggle: 'import { SegmentedToggle } from "@/components/ui/segmented-toggle"',
  codeBlock: 'import { CodeBlock } from "@/components/content/code-block"',
} as const

export const components = [
  {
    id: "logo",
    name: "Logo",
    category: "brand",
    maturity: "stable",
    summary: {
      ko: "공식 심볼과 LafLabs 워드마크를 함께 표시합니다.",
      en: "Displays the official symbol with the LafLabs wordmark.",
    },
    whenToUse: {
      ko: "사이트 헤더와 푸터처럼 LafLabs임을 분명히 밝혀야 할 때 씁니다.",
      en: "Use it where the LafLabs identity must be explicit, such as the site header and footer.",
    },
    whenNotToUse: {
      ko: "장식 배경이나 반복 무늬로 사용하지 않습니다.",
      en: "Do not use it as a decorative background or repeating motif.",
    },
    accessibility: {
      ko: "Logo 단독 사용 시 LafLabs로 읽힙니다. 링크 안에서는 이름을 한 번만 제공합니다.",
      en: "The component exposes the LafLabs name; check that an enclosing link does not create a redundant label.",
    },
    sourcePath: "components/ui/logo.tsx",
    demoKey: "logo",
    importExample: imports.logo,
    usageExample: "<Logo size={24} />",
    states: ["default", "compact"],
    props: [
      {
        name: "size",
        type: "number",
        required: false,
        description: {
          ko: "공식 심볼의 가로와 세로 크기입니다. 기본값은 24입니다.",
          en: "The width and height of the official symbol. Defaults to 24.",
        },
      },
    ],
  },
  {
    id: "action",
    name: "Action",
    category: "action",
    maturity: "candidate",
    summary: {
      ko: "주요 동작을 링크나 버튼으로 표시하며 아직 API가 바뀔 수 있습니다.",
      en: "A candidate component for primary actions rendered as links or buttons.",
    },
    whenToUse: {
      ko: "명확한 이동이나 실행 동작에 primary, secondary, inverse 변형이 필요할 때 씁니다.",
      en: "Use it for a clear navigation or execution action in primary, secondary, or inverse form.",
    },
    whenNotToUse: {
      ko: "문장 안의 가벼운 이동이나 아이콘만 있는 동작에는 쓰지 않습니다.",
      en: "Do not use it for inline navigation or icon-only actions.",
    },
    accessibility: {
      ko: "이동은 링크, 현재 화면의 동작은 버튼으로 만들고 focus 표시를 유지합니다.",
      en: "Use a link for navigation and a button for in-place actions, with visible focus in both cases.",
    },
    sourcePath: "components/ui/action.tsx",
    demoKey: "action",
    usageExample: '<Action href="/design" variant="primary">Open guide</Action>',
    states: ["primary", "secondary", "inverse", "hover", "focus-visible", "disabled"],
    props: [
      {
        name: "href",
        type: "string",
        required: false,
        description: {
          ko: "값을 주면 anchor로 렌더링합니다.",
          en: "Renders an anchor when provided.",
        },
      },
      {
        name: "variant",
        type: '"primary" | "secondary" | "inverse"',
        required: false,
        description: {
          ko: "표면과 우선순위에 맞는 시각 변형입니다. 기본값은 primary입니다.",
          en: "The visual treatment for the surface and priority. Defaults to primary.",
        },
      },
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: {
          ko: "동작을 설명하는 짧은 텍스트입니다.",
          en: "Short text that describes the action.",
        },
      },
    ],
  },
  {
    id: "segmented-toggle",
    name: "Segmented Toggle",
    category: "action",
    maturity: "stable",
    summary: {
      ko: "서로 배타적인 두 값을 한 자리에서 바꿉니다.",
      en: "Switches between two mutually exclusive values in place.",
    },
    whenToUse: {
      ko: "언어처럼 두 선택지가 짧고 같은 수준일 때 씁니다.",
      en: "Use it when two short options, such as languages, have equal weight.",
    },
    whenNotToUse: {
      ko: "선택지가 셋 이상이거나 각 항목에 긴 설명이 필요하면 쓰지 않습니다.",
      en: "Do not use it for more than two choices or options that need long descriptions.",
    },
    accessibility: {
      ko: "group과 각 button에 이름을 붙이고 선택 상태는 aria-pressed로 알립니다.",
      en: "Name the group and each button; expose selection with aria-pressed.",
    },
    sourcePath: "components/ui/segmented-toggle.tsx",
    demoKey: "segmented-toggle",
    importExample: imports.segmentedToggle,
    usageExample: `<SegmentedToggle
  label="Language"
  value={locale}
  options={[
    { value: "ko", label: "Korean", content: "KO" },
    { value: "en", label: "English", content: "EN" },
  ]}
  onValueChange={setLocale}
/>`,
    states: ["default", "hover", "focus-visible", "selected", "reduced-motion"],
    props: [
      {
        name: "label",
        type: "string",
        required: true,
        description: {
          ko: "두 선택지를 묶는 접근성 이름입니다.",
          en: "The accessible name for the option group.",
        },
      },
      {
        name: "value",
        type: "Value",
        required: true,
        description: {
          ko: "현재 선택한 option 값입니다.",
          en: "The currently selected option value.",
        },
      },
      {
        name: "options",
        type: "readonly [SegmentedToggleOption<Value>, SegmentedToggleOption<Value>]",
        required: true,
        description: {
          ko: "값, 이름, 화면 내용을 담은 두 option입니다.",
          en: "Exactly two options with values, labels, and visible content.",
        },
      },
      {
        name: "onValueChange",
        type: "(value: Value) => void",
        required: true,
        description: {
          ko: "다른 option을 선택했을 때 호출합니다.",
          en: "Called when the other option is selected.",
        },
      },
      {
        name: "className",
        type: "string",
        required: false,
        description: {
          ko: "배치에 필요한 선택 class 이름입니다.",
          en: "An optional class name for placement.",
        },
      },
    ],
  },
  {
    id: "icon-control",
    name: "Icon Control",
    category: "action",
    maturity: "candidate",
    summary: {
      ko: "한 가지 동작을 아이콘으로 표시하며 아직 API가 바뀔 수 있습니다.",
      en: "A candidate button that represents one action with an icon.",
    },
    whenToUse: {
      ko: "검색 열기처럼 익숙하고 단순한 동작을 좁은 공간에 둘 때 씁니다.",
      en: "Use it for a familiar, simple action such as opening search in a compact area.",
    },
    whenNotToUse: {
      ko: "아이콘만으로 뜻을 알기 어렵거나 이동 목적지가 핵심이면 쓰지 않습니다.",
      en: "Do not use it when the icon is ambiguous or navigation is the primary purpose.",
    },
    accessibility: {
      ko: "label을 반드시 제공하고 작은 화면에서는 44px 조작 영역을 유지합니다.",
      en: "Always provide a label and keep a 44px target area on small screens.",
    },
    sourcePath: "components/ui/icon-control.tsx",
    demoKey: "icon-control",
    usageExample: '<IconControl label="Search"><MagnifyingGlass aria-hidden /></IconControl>',
    states: ["default", "hover", "focus-visible", "disabled"],
    props: [
      {
        name: "label",
        type: "string",
        required: true,
        description: {
          ko: "동작을 설명하는 접근성 이름입니다.",
          en: "The accessible name that describes the action.",
        },
      },
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: {
          ko: "화면에 표시할 Phosphor 아이콘입니다.",
          en: "The visible Phosphor icon.",
        },
      },
    ],
  },
  {
    id: "text-link",
    name: "Text Link",
    category: "navigation",
    maturity: "candidate",
    summary: {
      ko: "텍스트와 화살표로 다음 목적지를 알리며 아직 API가 바뀔 수 있습니다.",
      en: "A candidate link that pairs text with an arrow toward the next destination.",
    },
    whenToUse: {
      ko: "구간 끝이나 목록 행에서 다음 페이지를 가볍게 안내할 때 씁니다.",
      en: "Use it at the end of a section or row for lightweight onward navigation.",
    },
    whenNotToUse: {
      ko: "주요 제출 동작이나 아이콘만 있는 컨트롤에는 쓰지 않습니다.",
      en: "Do not use it for primary submission actions or icon-only controls.",
    },
    accessibility: {
      ko: "링크 텍스트만 읽어도 목적지를 알 수 있어야 하며 화살표는 장식으로 처리합니다.",
      en: "The link text must identify its destination; treat the arrow as decorative.",
    },
    sourcePath: "components/ui/text-link.tsx",
    demoKey: "text-link",
    usageExample: '<TextLink href="/design/components">Components</TextLink>',
    states: ["default", "hover", "focus-visible", "visited"],
    props: [
      {
        name: "href",
        type: "string",
        required: true,
        description: {
          ko: "이동할 내부 또는 외부 주소입니다.",
          en: "The internal or external destination.",
        },
      },
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: {
          ko: "목적지를 설명하는 텍스트입니다.",
          en: "Text that identifies the destination.",
        },
      },
    ],
  },
  {
    id: "code-block",
    name: "Code Block",
    category: "content",
    maturity: "stable",
    summary: {
      ko: "언어 이름과 복사 동작을 갖춘 코드 읽기 영역입니다.",
      en: "A readable code region with a language label and copy action.",
    },
    whenToUse: {
      ko: "문서에서 여러 줄의 코드나 명령을 원문 그대로 보여줄 때 씁니다.",
      en: "Use it to present multiline code or commands verbatim in documentation.",
    },
    whenNotToUse: {
      ko: "짧은 inline 식별자나 실행 가능한 편집기에는 쓰지 않습니다.",
      en: "Do not use it for short inline identifiers or as an executable editor.",
    },
    accessibility: {
      ko: "복사 버튼 이름에는 언어를 넣습니다. 실패해도 원문을 선택할 수 있어야 합니다.",
      en: "The copy button names the language, and the source remains selectable after a copy failure.",
    },
    sourcePath: "components/content/code-block.tsx",
    demoKey: "code-block",
    importExample: imports.codeBlock,
    usageExample: `<CodeBlock language="ts" source={source}>
  {highlightedCode}
</CodeBlock>`,
    states: ["idle", "copied", "error"],
    props: [
      {
        name: "children",
        type: "ReactNode",
        required: true,
        description: {
          ko: "pre 안에 표시할 코드 내용입니다.",
          en: "The rendered code content placed inside the pre element.",
        },
      },
      {
        name: "language",
        type: "string",
        required: false,
        description: {
          ko: "toolbar에 표시할 언어 식별자입니다.",
          en: "The language identifier shown in the toolbar.",
        },
      },
      {
        name: "source",
        type: "string",
        required: true,
        description: {
          ko: "클립보드에 복사할 원문입니다.",
          en: "The exact source copied to the clipboard.",
        },
      },
    ],
  },
] as const satisfies readonly ComponentEntry[]
