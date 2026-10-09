import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";

export async function updateSession(
  request: NextRequest,
  requestHeaders = new Headers(request.headers),
) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const { url, publishableKey } = getSupabaseConfig();

  const supabase = createServerClient(url, publishableKey, {
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        supabaseResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data: claimsResult } = await supabase.auth.getClaims();
  const userId = typeof claimsResult?.claims?.sub === "string" ? claimsResult.claims.sub : null;

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.status === "INACTIVE") {
      // A profile-level deactivation must revoke access even when the Auth
      // session/JWT has not expired yet.
      await supabase.auth.signOut({ scope: "local" });

      const blockedResponse = request.nextUrl.pathname.startsWith("/api/")
        ? NextResponse.json(
            { error: "Бұл аккаунт белсенді емес." },
            { status: 403, headers: { "Cache-Control": "no-store" } },
          )
        : NextResponse.redirect(new URL("/login?disabled=1", request.url));

      for (const cookie of supabaseResponse.cookies.getAll()) {
        blockedResponse.cookies.set(cookie);
      }

      return blockedResponse;
    }
  }

  return supabaseResponse;
}
