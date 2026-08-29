import { markdownAuthoringGuideDocument } from "@/lib/markdown/authoring-guide"

export const dynamic = "force-static"
export const revalidate = 3600

export function GET() {
  return new Response(`${markdownAuthoringGuideDocument}\n`, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Disposition": "inline; filename=\"laflabs-markdown-guide.md\"",
      "Content-Type": "text/markdown; charset=utf-8",
    },
  })
}
