import crypto from "node:crypto";
import { type NextRequest } from "next/server";
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

export async function proxy(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const isProduction = process.env.NODE_ENV === "production";
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://accounts.google.com",
    "script-src 'self' 'nonce-" + nonce + "' 'strict-dynamic' https://*.kinescope.io https://kinescope.io",
    // Nonce-protect style elements while retaining support for CSS style attributes
    // used by some UI components. Do not add unsafe-inline to script-src.
    "style-src 'self' 'nonce-" + nonce + "'",
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://sqjjqnisnndulkzcqfwb.supabase.co https://*.kinescope.io https://kinescope.io",
    "font-src 'self' data:",
    "media-src 'self' blob: data: https://*.kinescope.io https://kinescope.io",
    "connect-src 'self' https://sqjjqnisnndulkzcqfwb.supabase.co https://*.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://*.kinescope.io wss://*.supabase.co",
    "frame-src 'self' https://*.kinescope.io https://kinescope.io",
    isProduction ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js extracts this nonce while rendering framework-generated inline scripts.
  // Sending the policy only on the response is not enough for nonce propagation.
  requestHeaders.set("Content-Security-Policy", csp);

  const response = await updateSession(request, requestHeaders);
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
