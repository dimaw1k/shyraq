import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./lib/supabase/config";

const STAFF_ROLES = new Set(["MENTOR", "CHIEF_MENTOR", "LEADER"]);

const MFA_EXEMPT_PREFIXES = [
  "/auth/callback",
  "/auth/recovery",
  "/auth/mfa",
  "/api/auth",
  "/api/health",
];

const AUTH_REQUIRED_PREFIXES = [
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
  "/api/",
];

function isMfaExempt(pathname: string) {
  return MFA_EXEMPT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

function requiresAuth(pathname: string) {
  return AUTH_REQUIRED_PREFIXES.some((prefix) =>
    prefix.endsWith("/") ? pathname.startsWith(prefix) : pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

function safeNextPath(request: NextRequest) {
  const value = request.nextUrl.pathname + request.nextUrl.search;
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { error: "Cross-origin request blocked." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  // Public pages never enter the authentication pipeline.
  // This avoids any Supabase/network dependency for the landing page and auth pages.
  if (!requiresAuth(pathname) || isMfaExempt(pathname)) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.status !== "ACTIVE" || !STAFF_ROLES.has(profile.role)) {
    return response;
  }

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

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
  return NextResponse.redirect(target);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/decks/:path*",
    "/review/:path*",
    "/settings/:path*",
    "/statistics/:path*",
    "/mentor/:path*",
    "/leader/:path*",
    "/chief-mentor/:path*",
    "/student/:path*",
    "/lessons/:path*",
    "/habits/:path*",
    "/rankings/:path*",
    "/reports/:path*",
    "/tasks/:path*",
    "/tests/:path*",
    "/profile/:path*",
    "/api/:path*",
  ],
};
