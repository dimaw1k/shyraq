import crypto from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./src/lib/supabase/config";

const STAFF_ROLES = new Set(["MENTOR", "CHIEF_MENTOR", "LEADER"]);

const PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/health",
  "/api/cron/meet-sync",
];

const PUBLIC_PAGE_PREFIXES = [
  "/auth/callback",
  "/auth/recovery",
  "/auth/mfa",
];

const PROTECTED_PAGE_PREFIXES = [
  "/dashboard",
  "/decks",
  "/review",
  "/settings",
  "/statistics",
  "/mentor",
  "/leader",
  "/chief-mentor",
  "/student",
  "/lessons",
  "/habits",
  "/rankings",
  "/reports",
  "/tasks",
  "/tests",
  "/profile",
];

function startsWithPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

function isProtectedPath(pathname: string) {
  if (PUBLIC_PAGE_PREFIXES.some((prefix) => startsWithPrefix(pathname, prefix))) {
    return false;
  }

  if (pathname.startsWith("/api/")) {
    return !PUBLIC_API_PREFIXES.some((prefix) => startsWithPrefix(pathname, prefix));
  }

  return PROTECTED_PAGE_PREFIXES.some((prefix) => startsWithPrefix(pathname, prefix));
}

function safeNextPath(request: NextRequest) {
  const value = request.nextUrl.pathname + request.nextUrl.search;
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

function copyResponseCookies(from: NextResponse, to: NextResponse) {
  const sourceHeaders = from.headers as HeadersWithSetCookie;
  const setCookies = sourceHeaders.getSetCookie?.() ?? [];

  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      to.headers.append("set-cookie", cookie);
    }
  } else {
    const setCookie = from.headers.get("set-cookie");
    if (setCookie) {
      to.headers.set("set-cookie", setCookie);
    }
  }

  for (const headerName of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(headerName);
    if (value) to.headers.set(headerName, value);
  }
}

function createContentSecurityPolicy(nonce: string) {
  const isProduction = process.env.NODE_ENV === "production";
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://accounts.google.com",
    "script-src 'self' 'nonce-" + nonce + "' 'strict-dynamic' https://*.kinescope.io https://kinescope.io https://www.youtube.com https://accounts.google.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://sqjjqnisnndulkzcqfwb.supabase.co https://*.kinescope.io https://kinescope.io https://i.ytimg.com https://img.youtube.com",
    "font-src 'self' data:",
    "connect-src 'self' https://sqjjqnisnndulkzcqfwb.supabase.co https://*.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://*.kinescope.io https://kinescope.io https://www.youtube.com https://*.youtube.com wss://*.supabase.co",
    "media-src 'self' blob: data: https://*.kinescope.io https://kinescope.io https://www.youtube.com https://*.youtube.com",
    "frame-src 'self' https://*.kinescope.io https://kinescope.io https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com",
    isProduction ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function applyContentSecurityPolicy(response: NextResponse, policy: string) {
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = createContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js reads this request header and adds the nonce to framework-generated scripts.
  requestHeaders.set("Content-Security-Policy", csp);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return applyContentSecurityPolicy(
        NextResponse.json(
          { error: "Cross-origin request blocked." },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        ),
        csp,
      );
    }
  }

  // Public pages never enter the Supabase pipeline. This keeps the landing
  // page independent from Auth network availability and avoids blocking SSR.
  if (!isProtectedPath(pathname)) {
    return applyContentSecurityPolicy(response, csp);
  }

  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        requestHeaders.set("cookie", request.cookies.toString());
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  response.headers.set("Cache-Control", "private, no-store");

  // Supabase recommends getClaims() in server-side protection because it
  // verifies the JWT without requiring a network lookup on every request.
  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return applyContentSecurityPolicy(response, csp);
  }

  const userId = String(claimsData.claims.sub);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile || profile.status !== "ACTIVE" || !STAFF_ROLES.has(profile.role)) {
    return applyContentSecurityPolicy(response, csp);
  }

  const {
    data: assurance,
    error: assuranceError,
  } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  const currentLevel = assurance?.currentLevel ?? "aal1";
  if (!assuranceError && currentLevel === "aal2") {
    return applyContentSecurityPolicy(response, csp);
  }

  const nextPath = safeNextPath(request);

  if (pathname.startsWith("/api/")) {
    return applyContentSecurityPolicy(
      NextResponse.json(
        {
          error: "MFA_REQUIRED",
          message: "Бұл қызметкер аккаунты үшін көп факторлы аутентификация қажет.",
          next: "/auth/mfa?next=" + encodeURIComponent(nextPath),
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      ),
      csp,
    );
  }

  const target = new URL("/auth/mfa", request.url);
  target.searchParams.set("next", nextPath);

  const redirectResponse = NextResponse.redirect(target);
  copyResponseCookies(response, redirectResponse);
  return applyContentSecurityPolicy(redirectResponse, csp);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
