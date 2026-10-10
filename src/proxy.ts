import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./lib/supabase/config";
import { verifyRecoveryGrant } from "./lib/security/recovery-grant";

// TEMPORARY EDITING LOCKS. Remove the matching paths from these lists when
// the corresponding sections have been reviewed and are ready to reopen.
const LOCKED_MENTOR_PATHS = ["/mentor", "/api/mentor"];
const LOCKED_CHIEF_MENTOR_PATHS = [
  "/chief-mentor/lessons",
  "/chief-mentor/tasks",
  "/chief-mentor/submissions",
  "/chief-mentor/reports",
  "/chief-mentor/analytics",
  "/chief-mentor/audit",
  "/chief-mentor/support",
  "/chief-mentor/settings",
  "/api/chief-mentor/lessons",
  "/api/chief-mentor/tasks",
  "/api/chief-mentor/submissions",
  "/api/chief-mentor/reports",
  "/api/chief-mentor/analytics",
  "/api/chief-mentor/audit",
  "/api/chief-mentor/support",
  "/api/chief-mentor/settings",
];

function matchesLockedPath(pathname: string, roots: string[]) {
  return roots.some((root) => pathname === root || pathname.startsWith(root + "/"));
}

export default async function proxy(request: NextRequest) {
  // A recovery grant is intentionally not an application login session.
  // Until it is consumed, allow only the recovery flow and block every other
  // page/API route, even if a caller tries to navigate directly to an endpoint.
  const recoveryGrant = verifyRecoveryGrant(
    request.cookies.get("shyraq_recovery_grant")?.value,
  );
  if (recoveryGrant) {
    const pathname = request.nextUrl.pathname;
    const allowedRecoveryPaths = new Set([
      "/auth/recovery",
      "/reset-password",
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

  const requestedPath = request.nextUrl.pathname;
  const isTemporarilyLocked =
    matchesLockedPath(requestedPath, LOCKED_MENTOR_PATHS) ||
    matchesLockedPath(requestedPath, LOCKED_CHIEF_MENTOR_PATHS);

  if (isTemporarilyLocked) {
    if (requestedPath.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Бұл бөлім уақытша жабық. Жаңарту жұмыстары жүріп жатыр." },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
            Pragma: "no-cache",
            "Retry-After": "3600",
          },
        },
      );
    }

    const target = request.nextUrl.clone();
    target.pathname = "/temporarily-closed";
    target.search = "";
    return NextResponse.rewrite(target, {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
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
