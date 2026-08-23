import { MarkdownDocument } from "@/components/content/markdown-document"

export function DocumentPreview({ title, source }: { title: string; source: string }) {
  return <MarkdownDocument title={title || "Untitled document"} source={source || "_No content yet._"} />
}
