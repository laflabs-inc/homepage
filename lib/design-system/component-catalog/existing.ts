import type { ComponentEntry } from "../schema"

const imports = {
  logo: 'import { Logo } from "@/components/ui/logo"',
  action: 'import { Action } from "@/components/ui/action"',
  segmentedToggle: 'import { SegmentedToggle } from "@/components/ui/segmented-toggle"',
  iconControl: 'import { IconControl } from "@/components/ui/icon-control"',
  textLink: 'import { TextLink } from "@/components/ui/text-link"',
  codeBlock: 'import { CodeBlock } from "@/components/content/code-block"',
} as const

export const existingComponents = [
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
    relatedComponents: [],
    dependencies: ["next"],
    states: [
      {
        id: "default",
        guidance: {
          ko: "24px 심볼과 전체 워드마크가 기준선에서 함께 정렬되는지 확인합니다.",
          en: "Inspect the 24px symbol and full wordmark together on one baseline.",
        },
      },
      {
        id: "compact",
        guidance: {
          ko: "16px 심볼에서도 원본 비율과 워드마크 간격이 유지되는지 확인합니다.",
          en: "Inspect the 16px symbol for preserved proportions and wordmark spacing.",
        },
      },
    ],
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
    maturity: "stable",
    summary: {
      ko: "주요 동작을 링크나 버튼으로 표시합니다.",
      en: "A reusable primary action rendered as a link or button.",
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
    importExample: imports.action,
    usageExample: '<Action href="/design" variant="primary">Open guide</Action>',
    relatedComponents: ["text-link", "icon-control"],
    dependencies: [],
    states: [
      {
        id: "primary",
        guidance: {
          ko: "파란 배경의 실제 primary 버튼이 가장 높은 동작 우선순위를 나타내는지 확인합니다.",
          en: "Inspect the real blue primary button as the highest-priority action.",
        },
      },
      {
        id: "secondary",
        guidance: {
          ko: "Paper 배경과 선을 쓰는 실제 secondary 버튼이 보조 동작으로 읽히는지 확인합니다.",
          en: "Inspect the real outlined secondary button as a lower-priority action.",
        },
      },
      {
        id: "inverse",
        guidance: {
          ko: "Ink 면 위에서 실제 inverse 버튼의 경계와 글자가 선명한지 확인합니다.",
          en: "Inspect the real inverse button for a clear boundary and label on Ink.",
        },
      },
      {
        id: "hover",
        guidance: {
          ko: "실제 버튼에 포인터를 올려 배경과 경계 색 변화가 배치를 움직이지 않는지 확인합니다.",
          en: "Hover the real button and confirm its color change does not move the layout.",
        },
      },
      {
        id: "focus-visible",
        guidance: {
          ko: "Tab으로 실제 버튼에 초점을 옮겨 파란 2px outline을 확인합니다.",
          en: "Tab to the real button and inspect its two-pixel blue focus outline.",
        },
      },
      {
        id: "disabled",
        guidance: {
          ko: "실제 비활성 버튼이 이름은 유지하지만 실행되지 않고 낮은 불투명도로 표시되는지 확인합니다.",
          en: "Inspect the real disabled button: it stays named, cannot activate, and uses reduced opacity.",
        },
      },
    ],
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
    relatedComponents: ["icon-control"],
    dependencies: ["motion"],
    states: [
      {
        id: "default",
        guidance: {
          ko: "실제 두 option과 현재 값이 한 group으로 읽히는지 확인합니다.",
          en: "Inspect the real two-option control and its current value as one named group.",
        },
      },
      {
        id: "hover",
        guidance: {
          ko: "선택되지 않은 실제 option에 포인터를 올려 텍스트 강조를 확인합니다.",
          en: "Hover the real inactive option and inspect its text emphasis.",
        },
      },
      {
        id: "focus-visible",
        guidance: {
          ko: "Tab으로 실제 option에 초점을 옮겨 내부 focus outline을 확인합니다.",
          en: "Tab to a real option and inspect the inset focus outline.",
        },
      },
      {
        id: "selected",
        guidance: {
          ko: "다른 option을 선택해 thumb 이동과 aria-pressed 값이 함께 바뀌는지 확인합니다.",
          en: "Select the other option and confirm the thumb and aria-pressed value change together.",
        },
      },
      {
        id: "reduced-motion",
        guidance: {
          ko: "동작 줄이기 설정에서 실제 선택 표시는 남고 thumb 전환 시간만 0이 되는지 확인합니다.",
          en: "With reduced motion enabled, confirm selection remains clear while the thumb transition becomes instant.",
        },
      },
    ],
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
    maturity: "stable",
    summary: {
      ko: "한 가지 동작을 아이콘으로 표시합니다.",
      en: "A reusable button that represents one action with an icon.",
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
    importExample: imports.iconControl,
    usageExample: '<IconControl label="Search"><MagnifyingGlass aria-hidden /></IconControl>',
    relatedComponents: ["action"],
    dependencies: [],
    states: [
      {
        id: "default",
        guidance: {
          ko: "실제 34px 컨트롤 안의 아이콘과 접근성 이름을 확인합니다.",
          en: "Inspect the real 34px control, its icon, and its accessible name.",
        },
      },
      {
        id: "hover",
        guidance: {
          ko: "실제 컨트롤에 포인터를 올려 Blue 배경과 Paper 아이콘 전환을 확인합니다.",
          en: "Hover the real control and inspect its Blue surface and Paper icon.",
        },
      },
      {
        id: "focus-visible",
        guidance: {
          ko: "Tab으로 실제 컨트롤에 초점을 옮겨 외부 focus outline을 확인합니다.",
          en: "Tab to the real control and inspect its outside focus outline.",
        },
      },
      {
        id: "disabled",
        guidance: {
          ko: "실제 비활성 컨트롤이 이름을 유지하고 실행되지 않는지 확인합니다.",
          en: "Inspect the real disabled control and confirm it stays named but cannot activate.",
        },
      },
    ],
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
    maturity: "stable",
    summary: {
      ko: "텍스트와 화살표로 다음 목적지를 알립니다.",
      en: "A reusable link that pairs text with an arrow toward the next destination.",
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
    importExample: imports.textLink,
    usageExample: '<TextLink href="/design/components">Components</TextLink>',
    relatedComponents: ["action"],
    dependencies: ["@phosphor-icons/react"],
    states: [
      {
        id: "default",
        guidance: {
          ko: "실제 링크의 목적지 텍스트, 밑줄, 장식 화살표를 함께 확인합니다.",
          en: "Inspect the real link's destination text, underline, and decorative arrow.",
        },
      },
      {
        id: "hover",
        guidance: {
          ko: "실제 링크에 포인터를 올려 Blue 전환과 화살표 이동을 확인합니다.",
          en: "Hover the real link and inspect its Blue transition and arrow movement.",
        },
      },
      {
        id: "focus-visible",
        guidance: {
          ko: "Tab으로 실제 링크에 초점을 옮겨 외부 focus outline을 확인합니다.",
          en: "Tab to the real link and inspect its outside focus outline.",
        },
      },
      {
        id: "visited",
        guidance: {
          ko: "실제 링크를 연 뒤 돌아와 deep blue 방문 상태가 목적지 의미를 유지하는지 확인합니다.",
          en: "Open the real link and return to inspect the deep-blue visited state without losing its destination meaning.",
        },
      },
    ],
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
    relatedComponents: ["icon-control"],
    dependencies: [],
    states: [
      {
        id: "idle",
        guidance: {
          ko: "실제 코드 원문, 언어 이름, 복사 버튼을 초기 상태에서 확인합니다.",
          en: "Inspect the real source, language name, and copy action in the idle state.",
        },
      },
      {
        id: "copied",
        guidance: {
          ko: "실제 복사 버튼을 눌러 COPIED label과 polite 상태 안내를 확인합니다.",
          en: "Use the real copy action and inspect its COPIED label and polite status message.",
        },
      },
      {
        id: "error",
        guidance: {
          ko: "클립보드 권한을 거부한 뒤 실제 복사 버튼의 RETRY label과 선택 가능한 원문을 확인합니다.",
          en: "Deny clipboard access, then inspect the real RETRY label while the source remains selectable.",
        },
      },
    ],
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
