"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell, UserChip } from "@/components/app/AppNav";

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
    setMessage(response.ok ? "Профиль жаңартылды." : (data.error ?? "Жаңарту кезінде қате."));
    if (response.ok) setProfile(data.profile);
    setLoading(false);
  }

  const role = profile?.role ?? "STUDENT";

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title="Баптаулар" description="Профильдегі негізгі оқу деректерін басқарыңыз." right={<UserChip name={profile?.full_name ?? undefined} role={role} />}>
      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
        <form onSubmit={submit} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-900">
              Аты-жөні
              <input required value={form.fullName} onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10 sm:col-span-2" />
            </label>
            <label className="text-sm font-medium text-gray-900">
              Телефон
              <input required value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" />
            </label>
            <label className="text-sm font-medium text-gray-900">
              Жасы
              <input required min="10" max="100" type="number" value={form.age} onChange={(e) => setForm((s) => ({ ...s, age: e.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" />
            </label>
            <label className="text-sm font-medium text-gray-900">
              Оқу түрі
              <select value={form.educationType} onChange={(e) => setForm((s) => ({ ...s, educationType: e.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10">
                <option value="SCHOOL">Мектеп</option>
                <option value="COLLEGE">Колледж</option>
                <option value="UNIVERSITY">Университет</option>
                <option value="OTHER">Басқа</option>
              </select>
            </label>
            <label className="text-sm font-medium text-gray-900 sm:col-span-2">
              Оқу орны
              <input required value={form.educationPlace} onChange={(e) => setForm((s) => ({ ...s, educationPlace: e.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" />
            </label>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-[#FAFAFA] p-3.5">
              <p className="text-[11px] text-gray-400">Email</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{profile?.email ?? "—"}</p>
            </div>
            <div className="rounded-xl bg-[#FAFAFA] p-3.5">
              <p className="text-[11px] text-gray-400">Статус</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{profile?.status ?? "—"}</p>
            </div>
          </div>

          {message ? <div className="mt-4 rounded-xl bg-[#FAFAFA] p-3.5 text-sm text-gray-700">{message}</div> : null}

          <button disabled={loading} className="mt-4 w-full rounded-xl bg-[#C25100] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Сақталуда..." : "Өзгерістерді сақтау"}
          </button>
        </form>
      </main>
    </AppShell>
  );
}
