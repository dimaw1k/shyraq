"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  age: number;
  education_type: string;
  education_place: string;
  status: string;
  role: string;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", age: "", educationType: "", educationPlace: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/student/profile");
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Профиль жүктелмеді.");
        return;
      }
      setProfile(data.profile);
      setForm({
        fullName: data.profile.full_name,
        phone: data.profile.phone,
        age: String(data.profile.age),
        educationType: data.profile.education_type,
        educationPlace: data.profile.education_place,
      });
    })();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/student/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        phone: form.phone,
        age: Number(form.age),
        educationType: form.educationType,
        educationPlace: form.educationPlace,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setProfile(data.profile);
      setMessage("Профиль жаңартылды.");
    } else {
      setMessage(data.error ?? "Жаңарту кезінде қате.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm font-semibold">← Dashboard</Link>
        <h1 className="mt-6 text-3xl font-semibold">Профиль</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Аккаунттағы негізгі оқу деректерін басқарыңыз.</p>

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-[var(--border)] bg-white p-6">
          <label className="block text-sm font-medium">Аты-жөні
            <input required value={form.fullName} onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" />
          </label>
          <label className="block text-sm font-medium">Телефон
            <input required value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" />
          </label>
          <label className="block text-sm font-medium">Жасы
            <input required min="10" max="100" type="number" value={form.age} onChange={(e) => setForm((s) => ({ ...s, age: e.target.value }))} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" />
          </label>
          <label className="block text-sm font-medium">Оқу түрі
            <select value={form.educationType} onChange={(e) => setForm((s) => ({ ...s, educationType: e.target.value }))} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3">
              <option value="SCHOOL">Мектеп</option>
              <option value="COLLEGE">Колледж</option>
              <option value="UNIVERSITY">Университет</option>
              <option value="OTHER">Басқа</option>
            </select>
          </label>
          <label className="block text-sm font-medium">Оқу орны
            <input required value={form.educationPlace} onChange={(e) => setForm((s) => ({ ...s, educationPlace: e.target.value }))} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-zinc-50 p-4"><p className="text-xs text-[var(--muted)]">Email</p><p className="mt-1 font-medium">{profile?.email ?? "—"}</p></div>
            <div className="rounded-xl bg-zinc-50 p-4"><p className="text-xs text-[var(--muted)]">Статус</p><p className="mt-1 font-medium">{profile?.status ?? "—"}</p></div>
          </div>

          {message ? <div className="rounded-xl bg-zinc-50 p-4 text-sm">{message}</div> : null}
          <button disabled={loading} className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50">
            {loading ? "Сақталуда..." : "Сақтау"}
          </button>
        </form>
      </div>
    </main>
  );
}
