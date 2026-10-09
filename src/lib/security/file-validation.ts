const MIME_SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes) =>
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a,
  "image/webp": (bytes) =>
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP",
  "application/pdf": (bytes) => String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-",
  "application/msword": (bytes) =>
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0 &&
    bytes[4] === 0xa1 &&
    bytes[5] === 0xb1 &&
    bytes[6] === 0x1a &&
    bytes[7] === 0xe1,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (bytes) =>
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04,
};

/** Check leading file bytes against the allow-listed MIME type. */
export async function hasValidFileSignature(file: File, mimeType: string): Promise<boolean> {
  const check = MIME_SIGNATURES[mimeType];
  if (!check || file.size < 4) return false;

  try {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    return check(bytes);
  } catch {
    return false;
  }
}
