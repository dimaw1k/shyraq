export type LimitedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "too-large" | "invalid-json" };

/**
 * Read JSON request bodies with a byte limit before parsing. This prevents an
 * unauthenticated endpoint from buffering arbitrarily large JSON payloads.
 */
export async function readLimitedJson(
  request: Request,
  maxBytes: number,
): Promise<LimitedJsonResult> {
  const contentLength = request.headers.get("content-length");
  if (
    contentLength !== null &&
    (!/^\d+$/.test(contentLength) || Number(contentLength) > maxBytes)
  ) {
    return { ok: false, reason: "too-large" };
  }

  if (!request.body) return { ok: false, reason: "invalid-json" };

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
    return { ok: false, reason: "invalid-json" };
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, reason: "invalid-json" };
  }
}
