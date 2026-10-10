import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PRIVATE_PATH_ROOTS = [
  "/api",
  "/dashboard",
  "/habits",
  "/lessons",
  "/login",
  "/marathon",
  "/mentor",
  "/chief-mentor",
  "/leader",
  "/profile",
  "/rankings",
  "/register",
  "/reports",
  "/reset-password",
  "/settings",
  "/tasks",
  "/tests",
  "/auth",
];

function requiresPrivateNoStore(pathname: string) {
  return PRIVATE_PATH_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    ["/login", "/register", "/reset-password", "/auth/recovery"].some(
      (root) => pathname === root || pathname.startsWith(`${root}/`),
    )
  );
}

export async function proxy(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const isProduction = process.env.NODE_ENV === "production";
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://accounts.google.com",
    "script-src 'self' 'nonce-" + nonce + "' 'strict-dynamic' https://*.kinescope.io https://kinescope.io https://www.youtube.com https://youtube.com",
    // Nonce-protect style elements while retaining support for CSS style attributes
    // used by some UI components. Do not add unsafe-inline to script-src.
    "style-src 'self' 'nonce-" + nonce + "'",
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://sqjjqnisnndulkzcqfwb.supabase.co https://*.kinescope.io https://kinescope.io",
    "font-src 'self' data:",
    "media-src 'self' blob: data: https://*.kinescope.io https://kinescope.io",
    "connect-src 'self' https://sqjjqnisnndulkzcqfwb.supabase.co https://*.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://*.kinescope.io wss://*.supabase.co",
    "frame-src 'self' https://*.kinescope.io https://kinescope.io https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com",
    isProduction ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js extracts this nonce while rendering framework-generated inline scripts.
  // Sending the policy only on the response is not enough for nonce propagation.
  requestHeaders.set("Content-Security-Policy", csp);

  // API mutations are authenticated with browser session cookies. Reject cross-origin
  // writes centrally, even if a future route accidentally omits its own Origin check.
  // Same-origin browser requests naturally send the origin of the current host; cron
  // sync is GET-only and is not affected by this guard.
  const isApiMutation =
    request.nextUrl.pathname.startsWith("/api/") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  if (isApiMutation) {
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    const crossOrigin = origin !== null && origin !== request.nextUrl.origin;
    const originlessCrossSite = origin === null && fetchSite === "cross-site";

    if (crossOrigin || originlessCrossSite) {
      const denied = NextResponse.json(
        { error: "Cross-origin API mutation blocked." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
      denied.headers.set("Content-Security-Policy", csp);
      return denied;
    }
  }

  // Public marketing/auth entry pages must still render if Supabase is temporarily
  // unavailable or the Preview environment has no Supabase credentials configured.
  // Protected workspaces and API routes continue through Supabase session refresh.
  const response = isPublicPath(request.nextUrl.pathname)
    ? NextResponse.next({
        request: { headers: requestHeaders },
      })
    : await updateSession(request, requestHeaders);
  response.headers.set("Content-Security-Policy", csp);

  // Authenticated pages and API responses may contain user-specific information.
  // Prevent shared caches from storing session-dependent content.
  if (requiresPrivateNoStore(request.nextUrl.pathname)) {
    response.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate",
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
