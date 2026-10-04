"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Provider = "google" | "apple";

export function SocialAuthButtons() {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  async function signIn(provider: Provider) {
    setLoading(provider);
    setError("");

    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });

      if (oauthError) {
        setError(
          provider === "google"
            ? "Google арқылы кіруді іске қосу мүмкін болмады."
            : "Apple арқылы кіруді іске қосу мүмкін болмады.",
        );
        setLoading(null);
      }
    } catch {
      setError("Әлеуметтік желі арқылы кіру кезінде қате болды.");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative py-1">
        <div className="h-px bg-[#ECE7E1]" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[10px] font-bold text-[#A49A90]">
          НЕМЕСЕ
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => void signIn("google")}
          className="inline-flex min-h-[46px] items-center justify-center gap-2.5 rounded-[15px] border border-[#E7E0D8] bg-white px-4 text-[12px] font-extrabold text-[#3F3832] transition hover:-translate-y-0.5 hover:border-[#D8CFC6] hover:bg-[#FCFBF9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M21.35 12.23c0-.68-.06-1.34-.18-1.98H12v3.75h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.13Z"/>
            <path fill="#34A853" d="M12 21.75c2.64 0 4.85-.87 6.47-2.39l-3.14-2.43c-.87.58-1.98.92-3.33.92-2.56 0-4.73-1.73-5.51-4.06H3.24v2.51A9.77 9.77 0 0 0 12 21.75Z"/>
            <path fill="#FBBC05" d="M6.49 13.79a5.88 5.88 0 0 1 0-3.58V7.7H3.24a9.77 9.77 0 0 0 0 8.6l3.25-2.51Z"/>
            <path fill="#EA4335" d="M12 6.15c1.44 0 2.73.5 3.75 1.48l2.81-2.81C16.85 3.23 14.64 2.25 12 2.25a9.77 9.77 0 0 0-8.76 5.45l3.25 2.51c.78-2.33 2.95-4.06 5.51-4.06Z"/>
          </svg>
          {loading === "google" ? "Ашылуда..." : "Google арқылы"}
        </button>

        <button
          type="button"
          disabled={loading !== null}
          onClick={() => void signIn("apple")}
          className="inline-flex min-h-[46px] items-center justify-center gap-2.5 rounded-[15px] border border-[#E7E0D8] bg-white px-4 text-[12px] font-extrabold text-[#3F3832] transition hover:-translate-y-0.5 hover:border-[#D8CFC6] hover:bg-[#FCFBF9] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.05 12.54c0-2.35 1.92-3.48 2.01-3.54-1.1-1.61-2.82-1.83-3.43-1.85-1.44-.15-2.84.86-3.57.86-.74 0-1.88-.85-3.09-.83-1.59.03-3.05.92-3.86 2.35-1.66 2.88-.42 7.12 1.17 9.45.8 1.14 1.72 2.42 2.95 2.37 1.19-.05 1.64-.76 3.07-.76 1.43 0 1.83.76 3.08.73 1.28-.02 2.09-1.16 2.87-2.31.9-1.32 1.28-2.6 1.3-2.67-.03-.01-2.47-.95-2.5-3.8Zm-2.35-6.92c.64-.77 1.07-1.84.95-2.92-.92.04-2.03.61-2.69 1.37-.59.68-1.1 1.76-.96 2.8 1.03.08 2.09-.52 2.7-1.25Z"/>
          </svg>
          {loading === "apple" ? "Ашылуда..." : "Apple арқылы"}
        </button>
      </div>

      {error ? (
        <p className="rounded-[12px] border border-red-100 bg-red-50 px-3.5 py-2.5 text-[11px] font-semibold leading-4 text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
