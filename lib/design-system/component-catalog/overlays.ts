import type { ComponentEntry } from "../schema"
import { interactiveInspection } from "../state-inspection"

export const overlayComponents = [
  {
    id: "tooltip",
    name: "Tooltip",
    category: "overlay",
    maturity: "candidate",
    summary: { ko: "짧은 보조 설명을 hover와 focus에 제공합니다.", en: "Provides a short supporting description on hover and focus." },
    whenToUse: { ko: "아이콘처럼 보이는 이름만으로 뜻이 부족한 컨트롤을 보완할 때 씁니다.", en: "Use it to clarify controls whose visible name, such as an icon, is insufficient." },
    whenNotToUse: { ko: "필수 정보, 긴 설명, 터치만으로 접근해야 하는 행동에 의존하지 않습니다.", en: "Do not rely on it for essential information, long copy, or touch-only actions." },
    accessibility: { ko: "hover뿐 아니라 keyboard focus에서도 열리고 트리거 설명으로 연결됩니다.", en: "Opens on keyboard focus as well as hover and is associated as the trigger description." },
    sourcePath: "components/ui/tooltip.tsx",
    demoKey: "tooltip",
    importExample: 'import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"',
    usageExample: '<TooltipProvider><Tooltip><TooltipTrigger aria-label="Status">●</TooltipTrigger><TooltipContent>Operational</TooltipContent></Tooltip></TooltipProvider>',
    relatedComponents: ["button"],
    dependencies: ["radix-ui"],
    states: [
      { id: "closed", guidance: { ko: "툴팁 없이도 트리거 이름이 남는지 확인합니다.", en: "Confirm the trigger keeps an accessible name without the tooltip." } },
      { id: "open", guidance: { ko: "짧은 문장이 화면 안에 배치되고 트리거를 가리지 않는지 확인합니다.", en: "Confirm concise copy stays in the viewport without obscuring the trigger." }, inspection: interactiveInspection },
    ],
    props: [
      { name: "delayDuration", type: "number", required: false, description: { ko: "Provider가 hover 열림 지연을 밀리초로 정합니다.", en: "Provider delay before opening on hover, in milliseconds." } },
      { name: "side", type: '"top" | "right" | "bottom" | "left"', required: false, description: { ko: "우선 배치 방향입니다.", en: "The preferred placement side." } },
      { name: "sideOffset", type: "number", required: false, description: { ko: "트리거와의 간격입니다.", en: "The distance from the trigger." } },
    ],
  },
] as const satisfies readonly ComponentEntry[]
