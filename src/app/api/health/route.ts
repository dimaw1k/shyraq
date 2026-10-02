import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

// Production health contract: deployment must prove real Supabase connectivity.

export async function GET() {
  const publicEnvConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const adminEnvConfigured = Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
  let supabaseReachable = false;
  let supabaseUrl = "";

  if (publicEnvConfigured) {
    try {
      const { url, publishableKey } = getSupabaseConfig();
      supabaseUrl = url;
      const response = await fetch(
        url + "/rest/v1/marathon_settings?select=id&limit=1",
        {
          headers: { apikey: publishableKey },
          cache: "no-store",
        },
      );
      supabaseReachable = response.ok;
    } catch {
      supabaseReachable = false;
    }
  }

  const ok = supabaseReachable && publicEnvConfigured && adminEnvConfigured;

  return NextResponse.json(
    {
      ok,
      service: "shyraq",
      environment: {
        appUrlConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
        publicEnvConfigured,
        adminEnvConfigured,
      },
      supabase: {
        url: supabaseUrl,
        reachable: supabaseReachable,
      },
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
