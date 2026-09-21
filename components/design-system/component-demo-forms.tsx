import type { ComponentType } from "react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
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
    <Field className={styles.demoField} invalid={invalid} required={state === "required"}>
      <FieldLabel>{locale === "ko" ? "연락처" : "Contact"}</FieldLabel>
      <Input placeholder="contact@laflabs.co" />
      <FieldDescription>
        {locale === "ko" ? "답변을 받을 이메일 주소입니다." : "The email address for a reply."}
      </FieldDescription>
      {invalid ? (
        <FieldError>{locale === "ko" ? "주소를 확인해 주세요." : "Check the address."}</FieldError>
      ) : null}
    </Field>
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
