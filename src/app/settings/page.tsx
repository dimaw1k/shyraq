"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";

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

const inputClass = "mt-2 w-full rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] px-3.5 py-3 text-xs font-medium text-[#172235] outline-none transition focus:border-[#FF6F2C] focus:bg-white focus:ring-4 focus:ring-[#FF6F2C]/10";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", age: "", educationType: "", educationPlace: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/student/profile");
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? "Профиль жүктелмеді."); return; }
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

  return (
    <AppShell role={profile?.role ?? "STUDENT"} userName={profile?.full_name ?? undefined} title="Баптаулар" description="Жеке профиліңдегі негізгі деректер.">
      <PageContainer className="max-w-5xl">
        <div className="space-y-5">
          <SectionHeader eyebrow="АККАУНТ" title="Баптаулар" description="Тек қажет деректерді өзгерте аласың." />
          <Card className="p-5 sm:p-6">
            <form onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-[11px] font-extrabold text-[#3F3832] sm:col-span-2">Аты-жөні<input required value={form.fullName} onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))} className={inputClass} /></label>
                <label className="text-[11px] font-extrabold text-[#3F3832]">Телефон<input required value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} className={inputClass} /></label>
                <label className="text-[11px] font-extrabold text-[#3F3832]">Жасы<input required min="10" max="100" type="number" value={form.age} onChange={(e) => setForm((s) => ({ ...s, age: e.target.value }))} className={inputClass} /></label>
                <label className="text-[11px] font-extrabold text-[#3F3832]">Оқу түрі<select value={form.educationType} onChange={(e) => setForm((s) => ({ ...s, educationType: e.target.value }))} className={inputClass}><option value="SCHOOL">Мектеп</option><option value="COLLEGE">Колледж</option><option value="UNIVERSITY">Университет</option><option value="OTHER">Басқа</option></select></label>
                <label className="text-[11px] font-extrabold text-[#3F3832] sm:col-span-2">Оқу орны<input required value={form.educationPlace} onChange={(e) => setForm((s) => ({ ...s, educationPlace: e.target.value }))} className={inputClass} /></label>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[16px] bg-[#F6F2ED] p-4"><p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">EMAIL</p><p className="mt-1.5 text-xs font-extrabold text-[#172235]">{profile?.email ?? "—"}</p></div>
                <div className="rounded-[16px] bg-[#F6F2ED] p-4"><p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">СТАТУС</p><p className="mt-1.5 text-xs font-extrabold text-[#172235]">{profile?.status ?? "—"}</p></div>
              </div>

              {message ? <div className="mt-4 rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] p-3 text-xs font-semibold text-[#5C5149]">{message}</div> : null}

              <button disabled={loading} className="mt-5 w-full rounded-[14px] bg-[#FF6F2C] px-4 py-3 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(255,111,44,.16)] transition hover:bg-[#F26120] disabled:opacity-50">
                {loading ? "Сақталуда..." : "Өзгерістерді сақтау"}
              </button>
            </form>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
