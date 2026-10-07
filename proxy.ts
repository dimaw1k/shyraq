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

function copyResponseCookies(from: NextResponse, to: NextResponse) {
  to.cookies.setAll(from.cookies.getAll());

  for (const headerName of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(headerName);
    if (value) to.headers.set(headerName, value);
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let response = NextResponse.next({ request });

  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { error: "Cross-origin request blocked." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  // Public pages never enter the Supabase pipeline. This keeps the landing
  // page independent from Auth network availability and avoids blocking SSR.
  if (!isProtectedPath(pathname)) {
    return response;
  }

  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
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
    return response;
  }

  const userId = String(claimsData.claims.sub);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile || profile.status !== "ACTIVE" || !STAFF_ROLES.has(profile.role)) {
    return response;
  }

  const {
    data: assurance,
    error: assuranceError,
  } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  const currentLevel = assurance?.currentLevel ?? "aal1";
  if (!assuranceError && currentLevel === "aal2") {
    return response;
  }

  const nextPath = safeNextPath(request);

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
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
    );
  }

  const target = new URL("/auth/mfa", request.url);
  target.searchParams.set("next", nextPath);

  const redirectResponse = NextResponse.redirect(target);
  copyResponseCookies(response, redirectResponse);
  return redirectResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
