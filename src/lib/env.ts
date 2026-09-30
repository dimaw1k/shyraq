export type PublicEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  appUrl: string;
};

export const env: PublicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

export function assertPublicEnv() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) {
    throw new Error("Supabase public environment variables are missing");
  }
}
