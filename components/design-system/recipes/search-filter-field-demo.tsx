import { MagnifyingGlass, X } from "@phosphor-icons/react/dist/ssr"

import { Combobox } from "@/components/ui/combobox"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import type { RecipeDemoProps } from "./recipe-demo-registry"
import styles from "./recipe-demos.module.css"

export function SearchFilterFieldDemo({ locale, state = "default" }: RecipeDemoProps) {
  const invalid = state === "invalid"
  const copy = locale === "ko"
    ? {
        label: "문서 검색",
        description: "제목과 본문을 검색하고 상태로 범위를 좁힙니다.",
        placeholder: "검색어 입력",
        clear: "검색어 지우기",
        filter: "문서 상태로 필터",
        empty: "일치하는 상태가 없습니다.",
        error: "두 글자 이상의 검색어를 입력해 주세요.",
      }
    : {
        label: "Search documents",
        description: "Search titles and content, then narrow the scope by status.",
        placeholder: "Enter a query",
        clear: "Clear query",
        filter: "Filter by document status",
        empty: "No matching status.",
        error: "Enter a query with at least two characters.",
      }

  return (
    <div className={styles.searchRecipe}>
      <Field className={styles.searchField} invalid={invalid}>
        <FieldLabel>{copy.label}</FieldLabel>
        <FieldDescription>{copy.description}</FieldDescription>
        <InputGroup>
          <InputGroupAddon placement="inline-start">
            <MagnifyingGlass aria-hidden size={18} weight="bold" />
          </InputGroupAddon>
          <InputGroupInput
            defaultValue={state === "empty" ? "release archive" : invalid ? "x" : undefined}
            placeholder={copy.placeholder}
            type="search"
          />
          <InputGroupAddon placement="inline-end">
            <InputGroupButton aria-label={copy.clear} size="icon">
              <X aria-hidden weight="bold" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        {invalid ? <FieldError>{copy.error}</FieldError> : null}
      </Field>
      <Field className={styles.filterField}>
        <FieldLabel>{copy.filter}</FieldLabel>
        <Combobox
          aria-label={copy.filter}
          defaultValue="all"
          emptyText={copy.empty}
          options={[
            { value: "all", label: locale === "ko" ? "모든 상태" : "All statuses" },
            { value: "draft", label: locale === "ko" ? "초안" : "Draft" },
            { value: "published", label: locale === "ko" ? "발행됨" : "Published" },
          ]}
        />
      </Field>
    </div>
  )
}
