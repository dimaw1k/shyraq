"use client";

import { FormEvent, useMemo, useState } from "react";

const input = "mt-2 w-full rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] px-3.5 py-3 text-xs font-medium text-[#172235] outline-none transition focus:border-[#FF6F2C] focus:bg-white focus:ring-4 focus:ring-[#FF6F2C]/10";

export function DailyReportForm({ marathonDay }: { marathonDay?: number }) {
  const today = useMemo(() => {
    const date = new Date();
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }, []);
  const [form, setForm] = useState({ reportDate: today, studyMinutes: "", completedTaskCount: "", reflection: "", difficulties: "", nextDayGoal: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/reports/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportDate: form.reportDate,
        marathonDay,
        studyMinutes: Number(form.studyMinutes || 0),
        completedTaskCount: Number(form.completedTaskCount || 0),
        reflection: form.reflection,
        difficulties: form.difficulties,
        nextDayGoal: form.nextDayGoal,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Есеп жіберілді." : (data.error ?? "Қате болды."));
    setLoading(false);
  }

  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">{marathonDay ? marathonDay + "-КҮН" : "БҮГІН"}</p>
      <h2 className="mt-1.5 text-[18px] font-extrabold tracking-[-.03em] text-[#172235]">Оқу есебі</h2>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-[11px] font-extrabold text-[#3F3832]">Күні<input type="date" value={form.reportDate} onChange={(e) => update("reportDate", e.target.value)} className={input} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[11px] font-extrabold text-[#3F3832]">Оқу минуттары<input type="number" min="0" value={form.studyMinutes} onChange={(e) => update("studyMinutes", e.target.value)} className={input} /></label>
          <label className="block text-[11px] font-extrabold text-[#3F3832]">Орындалған тапсырма<input type="number" min="0" value={form.completedTaskCount} onChange={(e) => update("completedTaskCount", e.target.value)} className={input} /></label>
        </div>
        <label className="block text-[11px] font-extrabold text-[#3F3832]">Бүгін не істедің?<textarea required value={form.reflection} onChange={(e) => update("reflection", e.target.value)} rows={3} className={input} placeholder="Қысқаша жаз..." /></label>
        <label className="block text-[11px] font-extrabold text-[#3F3832]">Қиындықтар<textarea value={form.difficulties} onChange={(e) => update("difficulties", e.target.value)} rows={2} className={input} placeholder="Қажет болса..." /></label>
        <label className="block text-[11px] font-extrabold text-[#3F3832]">Ертеңгі мақсат<textarea value={form.nextDayGoal} onChange={(e) => update("nextDayGoal", e.target.value)} rows={2} className={input} placeholder="Бір нақты мақсат..." /></label>
        {message ? <div className="rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] px-3.5 py-3 text-xs font-semibold text-[#5C5149]">{message}</div> : null}
        <button disabled={loading} className="w-full rounded-[14px] bg-[#FF6F2C] px-4 py-3 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(255,111,44,.16)] transition hover:bg-[#F26120] disabled:opacity-50">{loading ? "Жіберілуде..." : "Есепті жіберу"}</button>
      </form>
    </div>
  );
}
