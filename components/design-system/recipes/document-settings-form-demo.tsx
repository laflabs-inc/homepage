import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { StatusLabel } from "@/components/ui/status-label"
import { Switch } from "@/components/ui/switch"
import type { RecipeDemoProps } from "./recipe-demo-registry"
import styles from "./recipe-demos.module.css"

export function DocumentSettingsFormDemo({ locale, state = "default" }: RecipeDemoProps) {
  const saving = state === "saving"
  const saved = state === "saved"
  const disabled = state === "disabled" || saving
  const invalid = state === "invalid"
  const copy = locale === "ko"
    ? {
        legend: "문서 설정",
        title: "문서 제목",
        titleDescription: "목록과 브라우저 제목에 표시됩니다.",
        titleError: "문서 제목을 입력해 주세요.",
        category: "문서 종류",
        notice: "공지사항",
        disclosure: "공시",
        pin: "목록 상단에 고정",
        pinDescription: "중요한 문서를 먼저 표시합니다.",
        publish: "저장 후 바로 공개",
        publishDescription: "검토가 끝난 문서에만 사용합니다.",
        publishing: "발행 동작",
        cancel: "취소",
        save: "변경 사항 저장",
        saved: "저장됨",
        saveHint: "변경 사항은 저장하기 전까지 공개되지 않습니다.",
        saving: "문서 설정 저장 중",
      }
    : {
        legend: "Document settings",
        title: "Document title",
        titleDescription: "Shown in lists and the browser title.",
        titleError: "Enter a document title.",
        category: "Document type",
        notice: "Notice",
        disclosure: "Disclosure",
        pin: "Pin to the top of the list",
        pinDescription: "Show important documents first.",
        publish: "Publish immediately after saving",
        publishDescription: "Use only after the document has been reviewed.",
        publishing: "Publishing behavior",
        cancel: "Cancel",
        save: "Save changes",
        saved: "Saved",
        saveHint: "Changes remain private until you save them.",
        saving: "Saving document settings",
      }

  return (
    <FieldSet className={styles.settingsForm} disabled={disabled}>
      <FieldLegend>{copy.legend}</FieldLegend>
      <FieldGroup>
        <Field invalid={invalid}>
          <FieldLabel>{copy.title}</FieldLabel>
          <Input defaultValue={invalid ? "" : locale === "ko" ? "운영 정책 업데이트" : "Operations policy update"} />
          <FieldDescription>{copy.titleDescription}</FieldDescription>
          {invalid ? <FieldError>{copy.titleError}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel>{copy.category}</FieldLabel>
          <NativeSelect defaultValue="notice">
            <option value="notice">{copy.notice}</option>
            <option value="disclosure">{copy.disclosure}</option>
          </NativeSelect>
        </Field>
        <FieldSeparator>{copy.publishing}</FieldSeparator>
        <Checkbox
          defaultChecked
          description={copy.pinDescription}
          label={copy.pin}
        />
        <Switch
          description={copy.publishDescription}
          label={copy.publish}
        />
        <div className={styles.settingsActions}>
          <div className={styles.settingsStatus}>
            {saved ? (
              <span aria-label={copy.saved} aria-live="polite" role="status">
                <StatusLabel tone="success">{copy.saved}</StatusLabel>
              </span>
            ) : (
              <span>{copy.saveHint}</span>
            )}
          </div>
          <div className={styles.settingsButtons}>
            <Button disabled={disabled} variant="secondary">{copy.cancel}</Button>
            <Button className={styles.settingsSave} loading={saving}>
              {saving ? <Spinner label={copy.saving} size="compact" /> : null}
              {saving ? copy.saving : copy.save}
            </Button>
          </div>
        </div>
      </FieldGroup>
    </FieldSet>
  )
}
