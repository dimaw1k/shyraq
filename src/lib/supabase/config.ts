export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !url.trim()) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }

  if (!publishableKey || !publishableKey.trim()) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not configured");
  }

  return {
    url: url.trim(),
    publishableKey: publishableKey.trim(),
  };
}
