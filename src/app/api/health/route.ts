import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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

  // Validate that the server-only credential actually works, not just that
  // an environment variable is non-empty. This query returns no rows and does
  // not expose data; it checks the service-only rate-limit table's permissions.
  let adminCredentialValid = false;
  try {
    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("security_rate_limit_buckets")
      .select("bucket_key")
      .limit(0);
    adminCredentialValid = !error;
  } catch {
    adminCredentialValid = false;
  }

  const ok = supabaseReachable && adminCredentialValid;

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
