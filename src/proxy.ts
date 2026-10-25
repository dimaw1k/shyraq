import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { verifyRecoveryGrant } from "./lib/security/recovery-grant";

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

function createCsp(nonce: string) {
  const isProduction = process.env.NODE_ENV === "production";
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://accounts.google.com",
    "script-src 'self' 'nonce-" + nonce + "' 'strict-dynamic' https://*.kinescope.io https://kinescope.io https://www.youtube.com https://youtube.com",
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
}

function securePrivateResponse(
  response: NextResponse,
  csp: string,
  pathname: string,
) {
  response.headers.set("Content-Security-Policy", csp);
  if (requiresPrivateNoStore(pathname)) {
    response.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate",
    );
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const csp = createCsp(nonce);
  const pathname = request.nextUrl.pathname;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js reads the request CSP to apply this nonce to framework-generated scripts.
  requestHeaders.set("Content-Security-Policy", csp);

  // A recovery grant is not an application login session. Until it is consumed,
  // allow only the recovery flow and block every other page/API route.
  const recoveryGrant = verifyRecoveryGrant(
    request.cookies.get("shyraq_recovery_grant")?.value,
  );
  if (recoveryGrant) {
    const allowedRecoveryPaths = new Set([
      "/auth/recovery",
      "/reset-password",
      "/api/auth/recovery/session",
      "/api/auth/reset-password",
    ]);

    if (!allowedRecoveryPaths.has(pathname)) {
      if (pathname.startsWith("/api/")) {
        return securePrivateResponse(
          NextResponse.json(
            { error: "Құпиясөзді қалпына келтіруді аяқтаңыз немесе жаңа сілтеме сұраңыз." },
            {
              status: 403,
              headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
            },
          ),
          csp,
          pathname,
        );
      }

      return securePrivateResponse(
        NextResponse.redirect(new URL("/reset-password?mode=update", request.url)),
        csp,
        pathname,
      );
    }
  }

  // Mentor workspaces are intentionally available. Authorization remains enforced
  // by each route's authenticated role checks and server-side data scoping.
  const response = isPublicPath(pathname)
    ? NextResponse.next({ request: { headers: requestHeaders } })
    : await updateSession(request, requestHeaders);

  return securePrivateResponse(response, csp, pathname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
