import type { RecipeEntry } from "./schema"

export const recipes = [
  {
    id: "document-publishing",
    title: { ko: "문서 작성과 발행", en: "Document publishing" },
    summary: {
      ko: "메타데이터 입력부터 검증, 저장, 발행까지 한 흐름으로 구성합니다.",
      en: "Compose metadata, validation, saving, and publishing as one continuous workflow.",
    },
    steps: [
      {
        ko: "FieldSet과 Field로 문서 정보와 본문 설정을 구분합니다.",
        en: "Separate document metadata from body settings with FieldSet and Field.",
      },
      {
        ko: "저장과 발행 동작은 Button Group에 모으되 우선순위를 분명히 합니다.",
        en: "Group save and publish actions while keeping their priority explicit.",
      },
      {
        ko: "검증 오류는 해당 필드와 Alert에 함께 표시하고, 완료 결과는 Toast로 알립니다.",
        en: "Show validation errors beside the field and in Alert, then announce completion with Toast.",
      },
    ],
    relatedComponents: [
      "field",
      "input-group",
      "switch",
      "button-group",
      "alert",
      "status-label",
      "toast",
    ],
    states: [
      {
        id: "draft",
        condition: { ko: "편집 가능한 초안", en: "Editable draft" },
        presentation: {
          ko: "입력 필드와 초안 상태를 표시하고 저장 동작을 활성화합니다.",
          en: "Show editable fields and draft status with Save available.",
        },
        nextAction: { ko: "변경 내용을 저장합니다.", en: "Save the current changes." },
      },
      {
        id: "saving",
        condition: { ko: "저장 요청 진행 중", en: "Save request in progress" },
        presentation: {
          ko: "제출 동작을 잠그고 Button의 loading 상태를 유지합니다.",
          en: "Lock submission and keep the Button in its loading state.",
        },
        nextAction: { ko: "완료될 때까지 중복 제출을 막습니다.", en: "Prevent duplicate submission until completion." },
      },
      {
        id: "validation-error",
        condition: { ko: "필수 정보가 없거나 잘못됨", en: "Required information is missing or invalid" },
        presentation: {
          ko: "FieldError와 Alert에 문제와 수정 방법을 구체적으로 표시합니다.",
          en: "Name the problem and recovery in FieldError and Alert.",
        },
        nextAction: { ko: "첫 오류 필드로 이동해 수정합니다.", en: "Move to and correct the first invalid field." },
      },
      {
        id: "published",
        condition: { ko: "발행 완료", en: "Publication completed" },
        presentation: {
          ko: "발행 상태를 갱신하고 결과를 Toast로 짧게 알립니다.",
          en: "Update the publication status and confirm it briefly with Toast.",
        },
        nextAction: { ko: "공개 문서를 확인하거나 편집을 이어갑니다.", en: "Open the public document or continue editing." },
      },
    ],
  },
  {
    id: "searchable-collection",
    title: { ko: "검색 가능한 목록", en: "Searchable collection" },
    summary: {
      ko: "검색, 필터, 결과, 페이지 이동을 하나의 예측 가능한 목록 흐름으로 묶습니다.",
      en: "Combine search, filters, results, and pagination into one predictable collection flow.",
    },
    steps: [
      {
        ko: "검색과 필터는 목록보다 먼저 읽히는 하나의 Field 영역에 둡니다.",
        en: "Place search and filters in one Field region before the collection.",
      },
      {
        ko: "결과 구조에 따라 Item, Data Table, Pagination을 선택합니다.",
        en: "Choose Item, Data Table, and Pagination according to the result structure.",
      },
      {
        ko: "로딩, 결과 없음, 오류를 같은 위치에서 서로 배타적으로 표시합니다.",
        en: "Render loading, empty, and error states exclusively in the collection region.",
      },
    ],
    relatedComponents: [
      "field",
      "input-group",
      "combobox",
      "item",
      "data-table",
      "pagination",
      "skeleton",
      "empty-state",
      "alert",
    ],
    states: [
      {
        id: "idle",
        condition: { ko: "조회 전 또는 필터 대기", en: "Ready for a query or filter" },
        presentation: {
          ko: "현재 조건과 기존 결과를 유지합니다.",
          en: "Keep the current criteria and existing results visible.",
        },
        nextAction: { ko: "검색어나 필터를 변경합니다.", en: "Change the query or filters." },
      },
      {
        id: "loading",
        condition: { ko: "새 결과 조회 중", en: "New results are loading" },
        presentation: {
          ko: "목록 구조를 닮은 Skeleton을 표시하고 검색 조건은 유지합니다.",
          en: "Show a collection-shaped Skeleton while preserving the query controls.",
        },
        nextAction: { ko: "현재 요청이 끝날 때까지 결과 영역을 유지합니다.", en: "Hold the result region until the request completes." },
      },
      {
        id: "results",
        condition: { ko: "일치하는 항목이 있음", en: "Matching entries are available" },
        presentation: {
          ko: "결과와 현재 페이지를 표시하고 이동 가능한 Pagination만 활성화합니다.",
          en: "Show results and the current page, enabling only valid Pagination destinations.",
        },
        nextAction: { ko: "항목을 열거나 다음 결과로 이동합니다.", en: "Open an item or move to another result page." },
      },
      {
        id: "empty",
        condition: { ko: "일치하는 결과가 없음", en: "No entries match" },
        presentation: {
          ko: "Empty State에 적용된 조건과 되돌릴 동작을 함께 표시합니다.",
          en: "Use Empty State to name the active criteria and a way to reset them.",
        },
        nextAction: { ko: "검색어나 필터를 초기화합니다.", en: "Clear the query or filters." },
      },
      {
        id: "error",
        condition: { ko: "목록 조회 실패", en: "Collection request failed" },
        presentation: {
          ko: "Alert에 실패 원인과 재시도 동작을 표시합니다.",
          en: "Use Alert to explain the failure and provide Retry.",
        },
        nextAction: { ko: "같은 조건으로 다시 시도합니다.", en: "Retry with the same criteria." },
      },
    ],
  },
  {
    id: "consequential-action",
    title: { ko: "되돌리기 어려운 동작", en: "Consequential action" },
    summary: {
      ko: "삭제나 권한 변경처럼 결과가 큰 동작은 확인, 진행, 결과를 분리해 보여줍니다.",
      en: "Separate confirmation, progress, and outcome for deletion or permission changes.",
    },
    steps: [
      {
        ko: "위험 동작의 Button은 대상과 결과를 구체적으로 이름 붙입니다.",
        en: "Name the target and consequence in the initiating Button.",
      },
      {
        ko: "Alert Dialog는 취소와 실행 중 하나를 명시적으로 선택하게 합니다.",
        en: "Require an explicit Cancel or Action decision in Alert Dialog.",
      },
      {
        ko: "실패는 문맥 안의 Alert로 남기고, 완료는 상태 갱신과 Toast로 확인합니다.",
        en: "Keep failure in an inline Alert; confirm success through updated state and Toast.",
      },
    ],
    relatedComponents: ["button", "alert-dialog", "alert", "status-label", "toast"],
    states: [
      {
        id: "ready",
        condition: { ko: "동작 가능", en: "Action is available" },
        presentation: {
          ko: "위험 동작과 대상을 구체적으로 표시합니다.",
          en: "Show the action with its target and consequence.",
        },
        nextAction: { ko: "확인 대화상자를 엽니다.", en: "Open the confirmation dialog." },
      },
      {
        id: "confirming",
        condition: { ko: "사용자 결정 대기", en: "Waiting for a decision" },
        presentation: {
          ko: "Alert Dialog에 결과 설명, 취소, 실행 동작을 표시합니다.",
          en: "Show consequence, Cancel, and Action in Alert Dialog.",
        },
        nextAction: { ko: "취소하거나 동작을 실행합니다.", en: "Cancel or confirm the action." },
      },
      {
        id: "submitting",
        condition: { ko: "동작 처리 중", en: "Action is in progress" },
        presentation: {
          ko: "실행 동작을 loading 상태로 두고 중복 입력을 막습니다.",
          en: "Keep the Action loading and block duplicate input.",
        },
        nextAction: { ko: "결과를 기다립니다.", en: "Wait for the outcome." },
      },
      {
        id: "success",
        condition: { ko: "동작 완료", en: "Action completed" },
        presentation: {
          ko: "화면 상태를 먼저 갱신하고 Toast로 완료를 알립니다.",
          en: "Update the visible state first, then confirm completion with Toast.",
        },
        nextAction: { ko: "갱신된 상태에서 작업을 이어갑니다.", en: "Continue from the updated state." },
      },
      {
        id: "error",
        condition: { ko: "동작 실패", en: "Action failed" },
        presentation: {
          ko: "대화상자나 원래 문맥의 Alert에 원인과 복구 방법을 남깁니다.",
          en: "Keep the cause and recovery in the dialog or originating inline Alert.",
        },
        nextAction: { ko: "문제를 해결한 뒤 다시 시도합니다.", en: "Resolve the problem and retry." },
      },
    ],
  },
] as const satisfies readonly RecipeEntry[]
