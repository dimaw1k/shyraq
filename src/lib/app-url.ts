const DEVELOPMENT_ORIGIN = "http://localhost:3000";
const INTERNAL_VALIDATION_ORIGIN = "https://shyraq.invalid";

/**
 * Returns the configured canonical app origin for redirects and auth callback URLs.
 * Never derive trusted links from an incoming Host header.
 */
export function getTrustedAppUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_APP_URL must be configured in production");
    }
    return new URL(DEVELOPMENT_ORIGIN);
  }

  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be a valid absolute URL");
  }

  const hasUnexpectedComponents =
    Boolean(parsed.username) ||
    Boolean(parsed.password) ||
    parsed.pathname !== "/" ||
    Boolean(parsed.search) ||
    Boolean(parsed.hash);

  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    hasUnexpectedComponents ||
    (process.env.NODE_ENV === "production" && parsed.protocol !== "https:")
  ) {
    throw new Error("NEXT_PUBLIC_APP_URL must be a trusted HTTPS origin in production");
  }

  return new URL(parsed.origin);
}

/**
 * Accept only same-origin relative paths. Literal backslashes and control
 * characters are rejected to prevent URL parser normalization/open redirects.
 */
export function sanitizeLocalReturnTo(
  candidate: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (
    !candidate ||
    candidate.length > 2048 ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return fallback;
  }

  try {
    const resolved = new URL(candidate, INTERNAL_VALIDATION_ORIGIN);
    if (resolved.origin !== INTERNAL_VALIDATION_ORIGIN) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
