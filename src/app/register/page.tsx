"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [form, setForm] = useState({
    phone: "",
    email: "",
    fullName: "",
    age: "",
    educationType: "UNIVERSITY",
    educationPlace: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          role: "STUDENT",
          phone: form.phone,
          full_name: form.fullName,
          age: Number(form.age),
          education_type: form.educationType,
          education_place: form.educationPlace,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-[var(--accent)]">
          ← Shyraq
        </Link>
        <h1 className="mt-6 text-3xl font-semibold">Тіркелу</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Топқа автоматты түрде бөлінбейсіз. Кейін ментор сізді телефон нөмірі
          арқылы өз командасына қосады.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Телефон нөмірі</span>
            <input
              required
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="+7 700 000 00 00"
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium">Аты-жөні</span>
            <input
              required
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Жасы</span>
            <input
              required
              min={10}
              max={100}
              type="number"
              value={form.age}
              onChange={(event) => updateField("age", event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Оқу түрі</span>
            <select
              value={form.educationType}
              onChange={(event) => updateField("educationType", event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
            >
              <option value="SCHOOL">Мектеп</option>
              <option value="COLLEGE">Колледж</option>
              <option value="UNIVERSITY">Университет</option>
              <option value="OTHER">Басқа</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium">Оқу орны</span>
            <input
              required
              value={form.educationPlace}
              onChange={(event) =>
                updateField("educationPlace", event.target.value)
              }
              placeholder="Мектеп / университет атауы"
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium">Құпиясөз</span>
            <input
              required
              minLength={6}
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none focus:border-[var(--accent)]"
            />
          </label>

          {error ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">
              {error}
            </div>
          ) : null}

          <button
            disabled={loading}
            type="submit"
            className="rounded-xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-50 md:col-span-2"
          >
            {loading ? "Тіркелу..." : "Тіркелу"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Аккаунтыңыз бар ма?{" "}
          <Link href="/login" className="font-semibold text-black">
            Кіру
          </Link>
        </p>
      </div>
    </main>
  );
}
