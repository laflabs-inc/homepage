import type { ComponentType } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import type { DemoKey } from "@/lib/design-system/schema"
import type { ComponentDemoProps } from "./component-demo-registry"
import styles from "./design-system.module.css"

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
  const checked = state === "on"
  const disabled = state === "disabled"
  return (
    <div className={styles.demoSwitchTones}>
      <Switch
        defaultChecked={checked}
        disabled={disabled}
        label={locale === "ko" ? "기본 알림" : "Default notifications"}
        tone="primary"
      />
      <Switch
        defaultChecked={checked}
        disabled={disabled}
        label={locale === "ko" ? "동기화 알림" : "Sync notifications"}
        tone="success"
      />
      <Switch
        defaultChecked={checked}
        disabled={disabled}
        label={locale === "ko" ? "위험 작업 알림" : "Dangerous action notices"}
        tone="danger"
      />
    </div>
  )
}

export const selectionDemos = {
  checkbox: CheckboxDemo,
  "radio-group": RadioGroupDemo,
  switch: SwitchDemo,
} satisfies Partial<Record<DemoKey, ComponentType<ComponentDemoProps>>>
