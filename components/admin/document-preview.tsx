import { MarkdownDocument } from "@/components/content/markdown-document"
import { useLocale } from "@/components/i18n/locale-provider"
import { adminCopy } from "@/lib/admin/i18n"

export function DocumentPreview({ title, source }: { title: string; source: string }) {
  const t = adminCopy[useLocale()].documents.editor

  return <MarkdownDocument title={title || t.previewUntitled} source={source || t.previewEmpty} />
}
