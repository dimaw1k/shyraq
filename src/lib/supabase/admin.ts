import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

export function createAdminSupabaseClient() {
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey) {
    throw new Error("Supabase server secret key is missing");
  }

  return createClient(SUPABASE_URL, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
