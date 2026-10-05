import type { ComponentEntry } from "../schema"

export const structureComponents = [
  {
    id: "panel",
    name: "Panel",
    category: "structure",
    maturity: "candidate",
    summary: {
      ko: "관련된 정보와 동작을 하나의 명확한 경계 안에 구성합니다.",
      en: "Structures related information and actions within one clear boundary.",
    },
    whenToUse: {
      ko: "설정 묶음, 요약 모듈처럼 콘텐츠의 독립된 경계가 실제로 필요할 때 씁니다.",
      en: "Use it when a settings group or summary module needs a genuine independent boundary.",
    },
    whenNotToUse: {
      ko: "모든 섹션과 목록 행을 감싸거나 Panel 안에 Panel을 중첩하지 않습니다.",
      en: "Do not wrap every section or list row, and do not nest Panels inside Panels.",
    },
    accessibility: {
      ko: "독립된 영역이면 aria-label 또는 aria-labelledby로 이름을 붙이고 제목 단계는 문서 구조에 맞춥니다.",
      en: "Name independent regions with aria-label or aria-labelledby and keep heading levels consistent with the document.",
    },
    sourcePath: "components/ui/panel.tsx",
    demoKey: "panel",
    importExample: 'import { Panel, PanelContent, PanelDescription, PanelHeader, PanelTitle } from "@/components/ui/panel"',
    usageExample: `<Panel aria-labelledby="settings-title" tone="subtle">
  <PanelHeader>
    <PanelTitle id="settings-title">Notification settings</PanelTitle>
    <PanelDescription>Choose which updates to receive.</PanelDescription>
  </PanelHeader>
  <PanelContent>...</PanelContent>
</Panel>`,
    relatedComponents: ["separator", "button", "status-label"],
    dependencies: [],
    states: [
      { id: "default", guidance: { ko: "Paper 면과 1px 경계가 주변 콘텐츠와 구분되는지 확인합니다.", en: "Confirm the Paper surface and one-pixel boundary separate the module from surrounding content." } },
      { id: "subtle", guidance: { ko: "옅은 파란 면이 내용보다 먼저 튀지 않는지 확인합니다.", en: "Confirm the quiet blue surface does not compete with the content." } },
      { id: "inverse", guidance: { ko: "Ink 면에서 제목, 설명, 상태의 대비를 확인합니다.", en: "Confirm title, description, and status retain sufficient contrast on Ink." } },
      { id: "action", guidance: { ko: "좁은 화면에서 제목과 동작이 한 열로 자연스럽게 쌓이는지 확인합니다.", en: "Confirm the title and action stack naturally into one column on narrow screens." } },
    ],
    props: [
      { name: "tone", type: '"default" | "subtle" | "inverse"', required: false, description: { ko: "주변 표면과 정보 위계에 맞는 면 색입니다.", en: "The surface tone chosen for the surrounding context and information hierarchy." } },
      { name: "aria-label / aria-labelledby", type: "string", required: false, description: { ko: "독립된 영역으로 노출할 때 쓰는 접근 가능한 이름입니다.", en: "An accessible name used when the Panel is exposed as an independent region." } },
      { name: "children", type: "ReactNode", required: false, description: { ko: "Header, Content, Footer 등 조합할 Panel 부분입니다.", en: "Composable Panel parts such as Header, Content, and Footer." } },
      { name: "PanelTitle as", type: '"h2" | "h3" | "h4"', required: false, description: { ko: "주변 문서 구조에 맞는 제목 단계입니다. 기본값은 h3입니다.", en: "The heading level that matches the surrounding document. Defaults to h3." } },
    ],
  },
] as const satisfies readonly ComponentEntry[]
