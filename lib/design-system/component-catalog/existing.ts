import type { ComponentEntry } from "../schema"
import { environmentInspection, interactiveInspection } from "../state-inspection"

const imports = {
  logo: 'import { Logo } from "@/components/ui/logo"',
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
    relatedComponents: ["button-link"],
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
        inspection: interactiveInspection,
      },
      {
        id: "focus-visible",
        guidance: {
          ko: "Tab으로 실제 링크에 초점을 옮겨 외부 focus outline을 확인합니다.",
          en: "Tab to the real link and inspect its outside focus outline.",
        },
        inspection: interactiveInspection,
      },
      {
        id: "visited",
        guidance: {
          ko: "실제 링크를 연 뒤 돌아와 deep blue 방문 상태가 목적지 의미를 유지하는지 확인합니다.",
          en: "Open the real link and return to inspect the deep-blue visited state without losing its destination meaning.",
        },
        inspection: interactiveInspection,
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
    relatedComponents: ["button"],
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
        inspection: interactiveInspection,
      },
      {
        id: "error",
        guidance: {
          ko: "클립보드 권한을 거부한 뒤 실제 복사 버튼의 RETRY label과 선택 가능한 원문을 확인합니다.",
          en: "Deny clipboard access, then inspect the real RETRY label while the source remains selectable.",
        },
        inspection: environmentInspection,
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
