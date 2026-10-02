export type PublicEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  appUrl: string;
};

export const env: PublicEnv = {
  get supabaseUrl() {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  },
  get supabasePublishableKey() {
    return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
};

export function assertPublicEnv() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error("Supabase public environment variables are missing");
  }
}
