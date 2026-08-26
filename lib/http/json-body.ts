const DEFAULT_MAX_JSON_BYTES = 1024 * 1024

type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; response: Response }

export function jsonNoStore(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set("Cache-Control", "no-store")
  return Response.json(body, { ...init, headers })
}

export function withNoStore(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set("Cache-Control", "no-store")
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function errorResponse(error: string, status: number): BoundedJsonResult {
  return { ok: false, response: jsonNoStore({ error }, { status }) }
}

async function readBoundedBytes(request: Request, maxBytes: number): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array()

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let length = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maxBytes) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

export async function readBoundedJson(
  request: Request,
  maxBytes = DEFAULT_MAX_JSON_BYTES,
): Promise<BoundedJsonResult> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase()
  if (contentType !== "application/json") {
    return errorResponse("unsupported_media_type", 415)
  }

  const declaredLength = request.headers.get("content-length")
  if (declaredLength !== null) {
    const length = Number(declaredLength)
    if (!Number.isSafeInteger(length) || length < 0) return errorResponse("invalid_request", 400)
    if (length > maxBytes) return errorResponse("payload_too_large", 413)
  }

  let bytes: Uint8Array | null
  try {
    bytes = await readBoundedBytes(request, maxBytes)
  } catch {
    return errorResponse("invalid_request", 400)
  }
  if (!bytes) return errorResponse("payload_too_large", 413)

  try {
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    return { ok: true, value: JSON.parse(raw) }
  } catch {
    return errorResponse("invalid_request", 400)
  }
}
