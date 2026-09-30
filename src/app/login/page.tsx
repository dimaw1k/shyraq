"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-[var(--accent)]">
          ← Shyraq
        </Link>
        <h1 className="mt-6 text-3xl font-semibold">Кіру</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Shyraq аккаунтыңызға кіріңіз.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Құпиясөз</span>
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
            />
          </label>

          {error ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Кіру..." : "Кіру"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Аккаунтыңыз жоқ па?{" "}
          <Link href="/register" className="font-semibold text-black">
            Тіркелу
          </Link>
        </p>
      </div>
    </main>
  );
}
