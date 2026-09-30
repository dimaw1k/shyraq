const FALLBACK_SUPABASE_URL = "https://sqjjqnisnndulkzcqfwb.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_i7uhxzZL3xKMMOYWk4o7ew_NoXCx8ER";

function readPublicEnv(name: string, fallback: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export const SUPABASE_URL = readPublicEnv(
  "NEXT_PUBLIC_SUPABASE_URL",
  FALLBACK_SUPABASE_URL,
);

export const SUPABASE_PUBLISHABLE_KEY = readPublicEnv(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  FALLBACK_SUPABASE_PUBLISHABLE_KEY,
);
