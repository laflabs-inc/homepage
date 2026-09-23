import type { ComponentEntry } from "../schema"

export const overlayComponents = [
  {
    id: "dialog",
    name: "Dialog",
    category: "overlay",
    maturity: "candidate",
    summary: { ko: "현재 흐름 위에서 집중이 필요한 작업을 엽니다.", en: "Opens a focused task above the current flow." },
    whenToUse: { ko: "짧은 확인, 설정, 폼을 현재 맥락을 유지한 채 처리할 때 씁니다.", en: "Use it for a short confirmation, setting, or form without leaving context." },
    whenNotToUse: { ko: "긴 문서나 복잡한 다단계 작업을 작은 창에 가두지 않습니다.", en: "Do not confine long documents or complex multi-step work to a modal." },
    accessibility: { ko: "제목과 설명을 제공하고 초점 가두기, Escape 닫기, 초점 복귀를 유지합니다.", en: "Provide title and description and preserve focus trap, Escape dismissal, and focus restoration." },
    sourcePath: "components/ui/dialog.tsx",
    demoKey: "dialog",
    importExample: 'import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"',
    usageExample: '<Dialog><DialogTrigger>Open</DialogTrigger><DialogContent closeLabel="Close"><DialogTitle>Title</DialogTitle><DialogDescription>Description</DialogDescription></DialogContent></Dialog>',
    relatedComponents: ["button", "dropdown-menu", "field"],
    dependencies: ["@phosphor-icons/react", "radix-ui"],
    states: [
      { id: "closed", guidance: { ko: "트리거만으로 열릴 작업을 알 수 있는지 확인합니다.", en: "Confirm the trigger describes the task it opens." } },
      { id: "open", guidance: { ko: "제목, 닫기 동작, 내부 스크롤과 초점 경계를 확인합니다.", en: "Inspect title, close action, internal scroll, and focus boundary." } },
    ],
    props: [
      { name: "open", type: "boolean", required: false, description: { ko: "제어되는 열림 상태입니다.", en: "The controlled open state." } },
      { name: "onOpenChange", type: "(open: boolean) => void", required: false, description: { ko: "열림 상태가 바뀔 때 호출됩니다.", en: "Called when open state changes." } },
      { name: "closeLabel", type: "string", required: true, description: { ko: "보이는 닫기 버튼의 접근 가능한 이름입니다.", en: "The accessible name for the visible close control." } },
    ],
  },
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
    relatedComponents: ["icon-control"],
    dependencies: ["radix-ui"],
    states: [
      { id: "closed", guidance: { ko: "툴팁 없이도 트리거 이름이 남는지 확인합니다.", en: "Confirm the trigger keeps an accessible name without the tooltip." } },
      { id: "open", guidance: { ko: "짧은 문장이 화면 안에 배치되고 트리거를 가리지 않는지 확인합니다.", en: "Confirm concise copy stays in the viewport without obscuring the trigger." } },
    ],
    props: [
      { name: "delayDuration", type: "number", required: false, description: { ko: "Provider가 hover 열림 지연을 밀리초로 정합니다.", en: "Provider delay before opening on hover, in milliseconds." } },
      { name: "side", type: '"top" | "right" | "bottom" | "left"', required: false, description: { ko: "우선 배치 방향입니다.", en: "The preferred placement side." } },
      { name: "sideOffset", type: "number", required: false, description: { ko: "트리거와의 간격입니다.", en: "The distance from the trigger." } },
    ],
  },
] as const satisfies readonly ComponentEntry[]
