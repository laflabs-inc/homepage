import type { ComponentType } from "react"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  Label,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import type { DemoKey } from "@/lib/design-system/schema"
import type { ComponentDemoProps } from "./component-demo-registry"
import styles from "./design-system.module.css"

function FieldDemo({ locale, state }: ComponentDemoProps) {
  const invalid = state === "invalid"
  return (
    <FieldSet className={styles.demoFormRecipe}>
      <FieldLegend>{locale === "ko" ? "문서 설정" : "Document settings"}</FieldLegend>
      <FieldGroup>
        <Field orientation="responsive">
          <FieldContent>
            <FieldTitle>{locale === "ko" ? "발행 정보" : "Publishing details"}</FieldTitle>
            <FieldLabel>{locale === "ko" ? "문서 종류" : "Document type"}</FieldLabel>
            <FieldDescription>
              {locale === "ko" ? "목록과 주소에 사용할 분류입니다." : "Used for listing and routing."}
            </FieldDescription>
          </FieldContent>
          <NativeSelect defaultValue="notice">
            <option value="notice">{locale === "ko" ? "공지사항" : "Notice"}</option>
            <option value="disclosure">{locale === "ko" ? "공시" : "Disclosure"}</option>
          </NativeSelect>
        </Field>
        <Field invalid={invalid} orientation="responsive" required={state === "required"}>
          <FieldContent>
            <FieldLabel>{locale === "ko" ? "슬러그" : "Slug"}</FieldLabel>
            <FieldDescription>
              {locale === "ko" ? "공개 주소에 쓰는 짧은 식별자입니다." : "A short public URL identifier."}
            </FieldDescription>
            {invalid ? (
              <FieldError>{locale === "ko" ? "영문 소문자와 하이픈만 사용하세요." : "Use lowercase letters and hyphens."}</FieldError>
            ) : null}
          </FieldContent>
          <Input defaultValue="platform-update" />
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}

function LabelDemo({ locale, state }: ComponentDemoProps) {
  return (
    <div className={styles.demoField}>
      <Label htmlFor="design-demo-query">
        {locale === "ko" ? "검색어" : "Search query"}{state === "required" ? " *" : ""}
      </Label>
      <Input id="design-demo-query" defaultValue={locale === "ko" ? "디자인 시스템" : "Design system"} />
    </div>
  )
}

function InputDemo({ locale, state }: ComponentDemoProps) {
  const invalid = state === "invalid"
  return (
    <Field className={styles.demoField} invalid={invalid}>
      <FieldLabel>{locale === "ko" ? "이메일" : "Email"}</FieldLabel>
      <Input disabled={state === "disabled"} placeholder="contact@laflabs.co" type="email" />
      {invalid ? (
        <FieldError>{locale === "ko" ? "이메일 형식을 확인해 주세요." : "Check the email format."}</FieldError>
      ) : null}
    </Field>
  )
}

function TextareaDemo({ locale, state }: ComponentDemoProps) {
  const invalid = state === "invalid"
  return (
    <Field className={styles.demoField} invalid={invalid}>
      <FieldLabel>{locale === "ko" ? "문의 내용" : "Message"}</FieldLabel>
      <Textarea
        defaultValue={locale === "ko" ? "함께 만들고 싶은 제품을 알려 주세요." : "Tell us what you want to build together."}
        rows={4}
      />
      {invalid ? (
        <FieldError>{locale === "ko" ? "내용을 조금 더 자세히 적어 주세요." : "Add a little more detail."}</FieldError>
      ) : null}
    </Field>
  )
}

function NativeSelectDemo({ locale, state }: ComponentDemoProps) {
  return (
    <Field className={styles.demoField}>
      <FieldLabel>{locale === "ko" ? "문의 유형" : "Inquiry type"}</FieldLabel>
      <NativeSelect defaultValue="general" disabled={state === "disabled"}>
        <option value="general">{locale === "ko" ? "일반 문의" : "General"}</option>
        <option value="project">{locale === "ko" ? "프로젝트" : "Project"}</option>
      </NativeSelect>
    </Field>
  )
}

export const formDemos = {
  field: FieldDemo,
  label: LabelDemo,
  input: InputDemo,
  textarea: TextareaDemo,
  "native-select": NativeSelectDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>
