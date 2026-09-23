import type { ComponentEntry } from "../schema"

export const navigationComponents = [
  {
    id: "dropdown-menu",
    name: "Dropdown Menu",
    category: "navigation",
    maturity: "candidate",
    summary: { ko: "한 트리거에서 관련 명령과 설정을 엽니다.", en: "Opens related commands and settings from one trigger." },
    whenToUse: { ko: "자주 쓰지 않는 관련 동작을 한곳에 묶을 때 씁니다.", en: "Use it to group related, secondary commands in one place." },
    whenNotToUse: { ko: "주요 행동을 숨기거나 단순한 페이지 이동 목록을 대신하지 않습니다.", en: "Do not hide primary actions or replace straightforward page navigation." },
    accessibility: { ko: "방향키, typeahead, Escape, 하위 메뉴와 트리거 초점 복귀를 유지합니다.", en: "Preserves arrow keys, typeahead, Escape, submenus, and trigger focus restoration." },
    sourcePath: "components/ui/dropdown-menu.tsx",
    demoKey: "dropdown-menu",
    importExample: 'import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"',
    usageExample: '<DropdownMenu><DropdownMenuTrigger>More</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>Edit</DropdownMenuItem></DropdownMenuContent></DropdownMenu>',
    relatedComponents: ["button", "select", "dialog"],
    dependencies: ["@phosphor-icons/react", "radix-ui"],
    states: [
      { id: "default", guidance: { ko: "트리거가 메뉴의 목적을 분명히 말하는지 확인합니다.", en: "Confirm the trigger clearly names the menu purpose." } },
      { id: "open", guidance: { ko: "현재 항목과 키보드 초점이 명확한지 확인합니다.", en: "Confirm the current item and keyboard focus are clear." } },
      { id: "disabled", guidance: { ko: "비활성 명령을 건너뛰면서 상태는 전달하는지 확인합니다.", en: "Confirm disabled commands are skipped while their state remains clear." } },
    ],
    props: [
      { name: "open", type: "boolean", required: false, description: { ko: "제어되는 열림 상태입니다.", en: "The controlled open state." } },
      { name: "onOpenChange", type: "(open: boolean) => void", required: false, description: { ko: "열림 상태가 바뀔 때 호출됩니다.", en: "Called when open state changes." } },
      { name: "modal", type: "boolean", required: false, description: { ko: "메뉴가 바깥 상호작용을 제한할지 정합니다.", en: "Whether the menu limits outside interaction." } },
    ],
  },
] as const satisfies readonly ComponentEntry[]
