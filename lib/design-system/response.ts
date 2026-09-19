import { strongEtag } from "./serialize"

const cacheControl = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
const safeFilename = /^[A-Za-z0-9._-]+$/

export async function designTextResponse(
  body: string | Uint8Array,
  contentType: string,
  filename?: string,
): Promise<Response> {
  if (filename && !safeFilename.test(filename)) {
    throw new Error(`Unsafe download filename: ${filename}`)
  }

  const bytes = new Uint8Array(
    typeof body === "string" ? new TextEncoder().encode(body) : body,
  )
  const headers = new Headers({
    "Cache-Control": cacheControl,
    "Content-Type": contentType,
    ETag: await strongEtag(bytes),
    "X-Content-Type-Options": "nosniff",
  })

  if (filename) headers.set("Content-Disposition", `attachment; filename="${filename}"`)

  return new Response(bytes.buffer, { headers })
}
