import { formatComponentUsageExample } from "./format-code-example"
import type { RecipeEntry } from "./schema"
import { fixtureInspection, interactiveInspection } from "./state-inspection"

const recipeEntries = [
  {
    id: "document-publishing-toolbar",
    title: { ko: "문서 발행 도구 모음", en: "Document publishing toolbar" },
    summary: {
      ko: "문서 상태와 저장·발행 동작을 하나의 예측 가능한 작업 흐름으로 묶습니다.",
      en: "Combines document status, saving, and publishing into one predictable workflow.",
    },
    whenToUse: {
      ko: "초안 저장과 발행처럼 순서와 우선순위가 분명한 문서 작업에 사용합니다.",
      en: "Use for document work with a clear order and priority, such as saving and publishing.",
    },
    whenNotToUse: {
      ko: "서로 관계없는 동작이나 한 개의 단순 제출 버튼에는 사용하지 않습니다.",
      en: "Do not use for unrelated actions or a form with one simple submit action.",
    },
    accessibility: {
      ko: "상태는 텍스트로 표시하고 저장, 발행, 추가 옵션의 키보드 순서를 유지합니다.",
      en: "Expose status in text and preserve keyboard order across save, publish, and more options.",
    },
    category: "action",
    demoKey: "document-publishing-toolbar",
    components: ["button-group", "button", "dropdown-menu", "status-label"],
    relatedPatterns: ["document-surface", "responsive-collapse"],
    anatomy: [
      { ko: "현재 문서 상태", en: "Current document status" },
      { ko: "보조 저장 동작", en: "Secondary save action" },
      { ko: "주요 발행 동작", en: "Primary publish action" },
      { ko: "추가 발행 옵션", en: "Additional publishing options" },
    ],
    states: [
      {
        id: "draft",
        guidance: {
          ko: "초안 상태와 사용할 수 있는 저장·발행 동작을 함께 보여줍니다.",
          en: "Shows draft status with available save and publish actions.",
        },
        inspection: fixtureInspection,
      },
      {
        id: "publish-options",
        guidance: {
          ko: "추가 발행 옵션은 현재 도구 모음의 맥락을 유지한 채 열립니다.",
          en: "Additional publishing options open without leaving the toolbar context.",
        },
        inspection: interactiveInspection,
      },
      {
        id: "publishing",
        guidance: {
          ko: "발행 중에는 중복 실행을 막고 진행 상태를 텍스트로 알립니다.",
          en: "Publishing prevents duplicate activation and communicates progress in text.",
        },
        inspection: fixtureInspection,
      },
    ],
    responsive: [
      {
        ko: "작은 화면에서는 상태를 동작 위에 두고 버튼 그룹을 전체 폭으로 배치합니다.",
        en: "On small screens, place status above a full-width action group.",
      },
      {
        ko: "저장, 발행, 추가 옵션의 순서는 화면 크기와 관계없이 유지합니다.",
        en: "Keep save, publish, and more-options order at every viewport size.",
      },
    ],
    sourcePaths: [
      "components/design-system/recipes/document-publishing-toolbar-demo.tsx",
    ],
    usageExample: "<ButtonGroup label=\"Document publishing\"><StatusLabel tone=\"neutral\">Draft</StatusLabel><Button variant=\"secondary\">Save</Button><Button>Publish</Button><DropdownMenu><DropdownMenuTrigger asChild><Button aria-label=\"More publishing options\" size=\"icon\">...</Button></DropdownMenuTrigger></DropdownMenu></ButtonGroup>",
  },
  {
    id: "search-filter-field",
    title: { ko: "검색과 필터 필드", en: "Search and filter field" },
    summary: {
      ko: "검색어 입력과 구조화된 필터를 하나의 이름 있는 탐색 작업으로 구성합니다.",
      en: "Combines a query and structured filters into one named discovery task.",
    },
    whenToUse: {
      ko: "문서나 레코드 목록을 검색하고 제한된 필터로 범위를 좁힐 때 사용합니다.",
      en: "Use to search a document or record collection and narrow it with a small filter set.",
    },
    whenNotToUse: {
      ko: "검색 없이 하나의 고정 값을 고르는 폼 필드에는 사용하지 않습니다.",
      en: "Do not use for a form field that selects one fixed value without search.",
    },
    accessibility: {
      ko: "검색 label, 설명, 오류를 입력과 연결하고 필터 popup의 키보드 탐색을 유지합니다.",
      en: "Connect label, description, and error to the query while preserving popup keyboard navigation.",
    },
    category: "form",
    demoKey: "search-filter-field",
    components: ["field", "input-group", "combobox", "button"],
    relatedPatterns: ["collection-row", "responsive-collapse"],
    anatomy: [
      { ko: "검색 필드 label", en: "Search field label" },
      { ko: "검색어 입력", en: "Query input" },
      { ko: "필터 선택", en: "Filter selection" },
      { ko: "지우기 동작과 필드 피드백", en: "Clear action and field feedback" },
    ],
    states: [
      {
        id: "default",
        guidance: {
          ko: "검색과 필터가 비어 있는 기본 탐색 상태입니다.",
          en: "The default discovery state with an empty query and filters.",
        },
        inspection: fixtureInspection,
      },
      {
        id: "filters-open",
        guidance: {
          ko: "필터 popup을 직접 열어 검색과 키보드 이동을 확인합니다.",
          en: "Open the filter popup directly to inspect search and keyboard movement.",
        },
        inspection: interactiveInspection,
      },
      {
        id: "empty",
        guidance: {
          ko: "일치하는 결과가 없을 때 검색 조건을 유지하고 다음 행동을 안내합니다.",
          en: "When no result matches, retain the query and explain the next action.",
        },
        inspection: fixtureInspection,
      },
      {
        id: "invalid",
        guidance: {
          ko: "지원하지 않는 검색 값은 입력과 연결된 오류로 설명합니다.",
          en: "Explain an unsupported query through an error connected to the input.",
        },
        inspection: fixtureInspection,
      },
    ],
    responsive: [
      {
        ko: "작은 화면에서는 필터를 검색 입력 아래의 전체 폭 행으로 옮깁니다.",
        en: "On small screens, move filters below the query as a full-width row.",
      },
      {
        ko: "label과 오류는 재배치 뒤에도 같은 입력을 설명합니다.",
        en: "Keep the label and error associated with the same input after reflow.",
      },
    ],
    sourcePaths: ["components/design-system/recipes/search-filter-field-demo.tsx"],
    usageExample: "<Field><FieldLabel>Search documents</FieldLabel><InputGroup><InputGroupInput type=\"search\" /><InputGroupAddon placement=\"inline-end\"><Combobox aria-label=\"Filter documents\" /></InputGroupAddon></InputGroup></Field>",
  },
  {
    id: "document-settings-form",
    title: { ko: "문서 설정 폼", en: "Document settings form" },
    summary: {
      ko: "문서 메타데이터와 공개 설정을 하나의 의미 있는 폼 구조로 연결합니다.",
      en: "Connects document metadata and publishing settings in one meaningful form structure.",
    },
    whenToUse: {
      ko: "여러 관련 필드와 즉시 적용 설정을 한 작업으로 편집할 때 사용합니다.",
      en: "Use when editing related fields and immediately applied settings as one task.",
    },
    whenNotToUse: {
      ko: "서로 관계없는 설정을 한 Panel에 모으거나 읽기 전용 요약을 표시할 때는 사용하지 않습니다.",
      en: "Do not group unrelated settings or use it as a read-only summary.",
    },
    accessibility: {
      ko: "fieldset과 legend로 작업을 이름 붙이고 모든 안내와 오류를 해당 필드에 연결합니다.",
      en: "Name the task with fieldset and legend, and connect all guidance and errors to their fields.",
    },
    category: "form",
    demoKey: "document-settings-form",
    components: ["field", "input", "native-select", "checkbox", "switch", "alert"],
    relatedPatterns: ["document-surface", "responsive-collapse"],
    anatomy: [
      { ko: "설정 그룹 legend", en: "Settings group legend" },
      { ko: "문서 식별 정보", en: "Document identity fields" },
      { ko: "공개와 고정 설정", en: "Publishing and pinning settings" },
      { ko: "저장 상태 피드백", en: "Save-state feedback" },
    ],
    states: [
      {
        id: "default",
        guidance: { ko: "편집 가능한 기본 문서 설정입니다.", en: "Editable default document settings." },
        inspection: fixtureInspection,
      },
      {
        id: "invalid",
        guidance: {
          ko: "문제가 있는 필드만 오류 상태와 구체적인 안내를 표시합니다.",
          en: "Only the affected field shows an invalid state and specific guidance.",
        },
        inspection: fixtureInspection,
      },
      {
        id: "disabled",
        guidance: {
          ko: "권한이나 문서 상태로 편집할 수 없는 설정을 명확히 비활성화합니다.",
          en: "Clearly disables settings unavailable because of permission or document state.",
        },
        inspection: fixtureInspection,
      },
      {
        id: "saving",
        guidance: {
          ko: "저장 중에는 중복 제출을 막고 현재 진행 상태를 알립니다.",
          en: "Saving prevents duplicate submission and communicates current progress.",
        },
        inspection: fixtureInspection,
      },
    ],
    responsive: [
      {
        ko: "작은 화면에서는 가로 필드를 label 다음 입력 순서의 한 열로 바꿉니다.",
        en: "On small screens, collapse horizontal fields into one label-then-input column.",
      },
      {
        ko: "설명과 오류는 관련 입력 바로 아래에 남깁니다.",
        en: "Keep descriptions and errors immediately below their related input.",
      },
    ],
    sourcePaths: ["components/design-system/recipes/document-settings-form-demo.tsx"],
    usageExample: "<FieldSet><FieldLegend>Document settings</FieldLegend><FieldGroup><Field><FieldLabel>Title</FieldLabel><Input /></Field><Field><FieldLabel>Category</FieldLabel><NativeSelect /></Field><Checkbox>Pin document</Checkbox><Switch>Publish immediately</Switch></FieldGroup></FieldSet>",
  },
  {
    id: "collection-state-surface",
    title: { ko: "컬렉션 상태 화면", en: "Collection state surface" },
    summary: {
      ko: "하나의 목록 영역에서 loading, 결과, empty, error 상태를 일관되게 설명합니다.",
      en: "Explains loading, results, empty, and error states consistently in one collection surface.",
    },
    whenToUse: {
      ko: "표나 목록이 비동기 데이터를 기다리고 여러 결과 상태를 가질 때 사용합니다.",
      en: "Use when a table or list waits for asynchronous data and has multiple outcomes.",
    },
    whenNotToUse: {
      ko: "즉시 표시되는 정적 콘텐츠나 단일 폼 제출 결과에는 사용하지 않습니다.",
      en: "Do not use for immediate static content or one form-submission result.",
    },
    accessibility: {
      ko: "상태 제목과 다음 동작을 텍스트로 제공하고 loading과 error를 중복 발표하지 않습니다.",
      en: "Name the state and next action in text without announcing loading or errors twice.",
    },
    category: "system-state",
    demoKey: "collection-state-surface",
    components: [
      "panel",
      "table",
      "item",
      "pagination",
      "skeleton",
      "empty-state",
      "alert",
      "status-label",
      "button",
    ],
    relatedPatterns: ["collection-row", "system-states", "responsive-collapse"],
    anatomy: [
      { ko: "컬렉션 이름과 범위", en: "Collection name and scope" },
      { ko: "현재 상태의 본문", en: "Current state body" },
      { ko: "상태별 다음 동작", en: "State-specific next action" },
      { ko: "결과가 있을 때의 페이지 이동", en: "Pagination when results exist" },
    ],
    states: [
      {
        id: "loading",
        guidance: {
          ko: "최종 목록 구조와 같은 Skeleton으로 공간을 유지합니다.",
          en: "Reserve space with a Skeleton matching the final collection structure.",
        },
        inspection: fixtureInspection,
      },
      {
        id: "populated",
        guidance: {
          ko: "실제 비교 가능한 열과 상태, 페이지 이동을 표시합니다.",
          en: "Shows comparable columns, explicit status, and pagination.",
        },
        inspection: fixtureInspection,
      },
      {
        id: "empty",
        guidance: {
          ko: "빈 이유와 가능한 첫 행동을 설명하고 가짜 결과를 만들지 않습니다.",
          en: "Explains why the collection is empty and the first available action without fake results.",
        },
        inspection: fixtureInspection,
      },
      {
        id: "error",
        guidance: {
          ko: "오류와 복구 가능한 재시도 동작을 목록 맥락 안에 둡니다.",
          en: "Keeps the error and recoverable retry action inside the collection context.",
        },
        inspection: fixtureInspection,
      },
    ],
    responsive: [
      {
        ko: "작은 화면에서는 비교에 필요한 열만 유지하고 나머지는 Item 행으로 재배치합니다.",
        en: "On small screens, keep essential comparisons and reflow the rest into Item rows.",
      },
      {
        ko: "상태 제목과 재시도 동작은 가로 overflow 밖으로 숨기지 않습니다.",
        en: "Never hide the state title or retry action behind horizontal overflow.",
      },
    ],
    sourcePaths: ["components/design-system/recipes/collection-state-surface-demo.tsx"],
    usageExample: "<Panel><PanelHeader><PanelTitle>Documents</PanelTitle></PanelHeader><PanelContent><Table /><Pagination aria-label=\"Document pages\" /></PanelContent></Panel>",
  },
] as const satisfies readonly RecipeEntry[]

export const recipes = recipeEntries.map((recipe) => ({
  ...recipe,
  usageExample: formatComponentUsageExample(recipe.usageExample),
})) satisfies readonly RecipeEntry[]
