function readRequiredPublicEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(name + " is not configured");
  }

  return value.trim();
}

export function getSupabaseConfig() {
  return {
    url: readRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    publishableKey: readRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  };
}
