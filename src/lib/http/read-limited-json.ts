export type LimitedBodyResult =
  | { ok: true; value: ArrayBuffer }
  | { ok: false; reason: "too-large" | "invalid-body" };

export type LimitedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "too-large" | "invalid-json" };

export type LimitedFormDataResult =
  | { ok: true; value: FormData }
  | { ok: false; reason: "too-large" | "invalid-form" };

/**
 * Read a request stream with a byte limit before buffering it. Content-Length is
 * checked as an early rejection only; the actual streamed byte count is always
 * enforced too, so clients cannot bypass the limit by omitting that header.
 */
export async function readLimitedBody(
  request: Request,
  maxBytes: number,
): Promise<LimitedBodyResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new Error("maxBytes must be a positive safe integer");
  }

  const contentLength = request.headers.get("content-length");
  if (
    contentLength !== null &&
    (!/^\d+$/.test(contentLength) || Number(contentLength) > maxBytes)
  ) {
    return { ok: false, reason: "too-large" };
  }

  if (!request.body) return { ok: false, reason: "invalid-body" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, reason: "too-large" };
      }

      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "invalid-body" };
  }

  const buffer = new ArrayBuffer(totalBytes);
  const bytes = new Uint8Array(buffer);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true, value: buffer };
}

/** Read and parse JSON only after the entire request is bounded. */
export async function readLimitedJson(
  request: Request,
  maxBytes: number,
): Promise<LimitedJsonResult> {
  const result = await readLimitedBody(request, maxBytes);
  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason === "too-large" ? "too-large" : "invalid-json",
    };
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(result.value);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, reason: "invalid-json" };
  }
}

/** Parse multipart uploads only after enforcing the whole-body byte limit. */
export async function readLimitedFormData(
  request: Request,
  maxBytes: number,
): Promise<LimitedFormDataResult> {
  const contentType = request.headers.get("content-type") ?? "";
  if (
    !/^multipart\/form-data\s*;/i.test(contentType) ||
    !/(?:^|;)\s*boundary=/i.test(contentType)
  ) {
    return { ok: false, reason: "invalid-form" };
  }

  const result = await readLimitedBody(request, maxBytes);
  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason === "too-large" ? "too-large" : "invalid-form",
    };
  }

  try {
    const boundedRequest = new Request(request.url, {
      method: "POST",
      headers: { "content-type": contentType },
      body: result.value,
    });
    return { ok: true, value: await boundedRequest.formData() };
  } catch {
    return { ok: false, reason: "invalid-form" };
  }
}
