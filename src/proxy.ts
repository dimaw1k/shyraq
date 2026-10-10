import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./lib/supabase/config";

export default async function proxy(request: NextRequest) {
  // A recovery grant is intentionally not an application login session.
  // Until it is consumed, allow only the recovery flow and block every other
  // page/API route, even if a caller tries to navigate directly to an endpoint.
  const recoveryGrant = request.cookies.get("shyraq_recovery_grant")?.value;
  if (recoveryGrant) {
    const pathname = request.nextUrl.pathname;
    const allowedRecoveryPaths = new Set([
      "/auth/recovery",
      "/reset-password",
      "/api/auth/recovery/exchange",
      "/api/auth/recovery/session",
      "/api/auth/reset-password",
    ]);

    if (!allowedRecoveryPaths.has(pathname)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Құпиясөзді қалпына келтіруді аяқтаңыз немесе жаңа сілтеме сұраңыз." },
          {
            status: 403,
            headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
          },
        );
      }

      return NextResponse.redirect(
        new URL("/reset-password?mode=update", request.url),
      );
    }
  }

  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient(
    url,
    publishableKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  await supabase.auth.getUser();
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"] };
