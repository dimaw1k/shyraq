import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function GET() {
  let supabaseReachable = false;

  try {
    const { url, publishableKey } = getSupabaseConfig();
    // Health must not query a private table with the anonymous/publishable key:
    // its RLS policy correctly denies anonymous reads, which caused false 503s.
    // Supabase documents this Auth endpoint as the service health check.
    const response = await fetch(url + "/auth/v1/health", {
      headers: { apikey: publishableKey },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    supabaseReachable = response.ok;
  } catch {
    supabaseReachable = false;
  }

  // A reachable Supabase Auth endpoint alone is not enough for this app to be ready:
  // most server-side workflows need the server-only admin key for scoped operations.
  // Report not-ready rather than returning a misleading green health check.
  const serverAdminKeyConfigured = Boolean(
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
  const ok = supabaseReachable && serverAdminKeyConfigured;

  return NextResponse.json(
    { ok },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
