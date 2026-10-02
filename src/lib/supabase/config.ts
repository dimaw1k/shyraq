function readRequiredPublicEnv(name: string) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`${name} is not configured`);
  }

  return value.trim();
}

export const SUPABASE_URL = readRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL");
export const SUPABASE_PUBLISHABLE_KEY = readRequiredPublicEnv(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
);
