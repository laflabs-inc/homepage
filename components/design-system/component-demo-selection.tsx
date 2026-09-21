import type { ComponentType } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import type { DemoKey } from "@/lib/design-system/schema"
import type { ComponentDemoProps } from "./component-demo-registry"

function CheckboxDemo({ locale, state }: ComponentDemoProps) {
  return (
    <Checkbox
      defaultChecked={state === "checked"}
      disabled={state === "disabled"}
      indeterminate={state === "indeterminate"}
      label={locale === "ko" ? "업데이트 알림 받기" : "Receive update notices"}
    />
  )
}

function RadioGroupDemo({ locale, state }: ComponentDemoProps) {
  return (
    <RadioGroup
      defaultValue={state === "default" ? undefined : "ko"}
      disabled={state === "disabled"}
      legend={locale === "ko" ? "문서 언어" : "Document language"}
      name={`demo-locale-${state ?? "default"}`}
      options={[
        { value: "ko", label: locale === "ko" ? "한국어" : "Korean" },
        { value: "en", label: locale === "ko" ? "영어" : "English" },
      ]}
    />
  )
}

function SwitchDemo({ locale, state }: ComponentDemoProps) {
  return (
    <Switch
      defaultChecked={state === "on"}
      disabled={state === "disabled"}
      label={locale === "ko" ? "분석 쿠키 허용" : "Allow analytics cookies"}
    />
  )
}

export const selectionDemos = {
  checkbox: CheckboxDemo,
  "radio-group": RadioGroupDemo,
  switch: SwitchDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>
