import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTrustedAppUrl, sanitizeLocalReturnTo } from "@/lib/app-url";

function safeNext(value: string | null, origin: string) {
  // Reuse the shared same-origin redirect validator. It rejects protocol-relative
  // URLs, backslashes and control characters that a URL parser may normalize.
  return new URL(sanitizeLocalReturnTo(value, "/dashboard"), origin);
}

function isResetPasswordTarget(next: URL) {
  return next.pathname === "/reset-password";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  // Never trust the incoming Host header to choose the origin for redirects.
  const origin = getTrustedAppUrl().origin;
  const code = searchParams.get("code");
  const flowId = searchParams.get("sb_flow_id");
  const next = safeNext(searchParams.get("next"), origin);

  if (!code) {
    if (isResetPasswordTarget(next)) {
      return NextResponse.redirect(
        new URL("/reset-password?error=invalid_or_expired", origin),
      );
    }

    return NextResponse.redirect(new URL("/login?oauth=missing_code", origin));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  );

  if (error) {
    console.error("[auth/callback] code exchange failed", {
      code: error.code,
      status: error.status,
    });

    if (isResetPasswordTarget(next)) {
      return NextResponse.redirect(
        new URL("/reset-password?error=invalid_or_expired", origin),
      );
    }

    return NextResponse.redirect(new URL("/login?oauth=failed", origin));
  }

  return NextResponse.redirect(next);
}
