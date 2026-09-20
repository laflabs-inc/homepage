import { strongEtag } from "./serialize"

const cacheControl = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
const safeFilename = /^[A-Za-z0-9._-]+$/

export type DesignResourceFailureCode =
  | "design_resource_unavailable"
  | "design_skill_file_unavailable"

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

export function designResourceFailureResponse(code: DesignResourceFailureCode): Response {
  return new Response(`${code}\n`, {
    status: 503,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  })
}

export async function designResourceResponse(
  produce: () => string | Uint8Array | undefined,
  contentType: string,
  options: Readonly<{
    filename?: string
    missingCode?: DesignResourceFailureCode
  }> = {},
): Promise<Response> {
  try {
    const body = produce()
    if (body === undefined) {
      return designResourceFailureResponse(options.missingCode ?? "design_resource_unavailable")
    }
    return await designTextResponse(body, contentType, options.filename)
  } catch {
    return designResourceFailureResponse("design_resource_unavailable")
  }
}
