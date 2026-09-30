"use client";

import { FormEvent, useMemo, useState } from "react";

export function DailyReportForm() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
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
        studyMinutes: Number(form.studyMinutes || 0),
        completedTaskCount: Number(form.completedTaskCount || 0),
        reflection: form.reflection,
        difficulties: form.difficulties,
        nextDayGoal: form.nextDayGoal,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Есеп сақталды." : (data.error ?? "Қате болды."));
    setLoading(false);
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
      <p className="text-sm font-semibold text-[var(--accent)]">DAILY REPORT</p>
      <h1 className="mt-2 text-2xl font-semibold">Бүгінгі есеп</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">Күні<input type="date" value={form.reportDate} onChange={(e) => update("reportDate", e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">Оқу минуттары<input type="number" min="0" value={form.studyMinutes} onChange={(e) => update("studyMinutes", e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
          <label className="block text-sm font-medium">Орындалған тапсырма<input type="number" min="0" value={form.completedTaskCount} onChange={(e) => update("completedTaskCount", e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
        </div>
        <label className="block text-sm font-medium">Бүгін не істедіңіз?<textarea value={form.reflection} onChange={(e) => update("reflection", e.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
        <label className="block text-sm font-medium">Қиындықтар<textarea value={form.difficulties} onChange={(e) => update("difficulties", e.target.value)} rows={2} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
        <label className="block text-sm font-medium">Ертеңгі мақсат<textarea value={form.nextDayGoal} onChange={(e) => update("nextDayGoal", e.target.value)} rows={2} className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
        {message ? <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm">{message}</div> : null}
        <button disabled={loading} className="w-full rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50">{loading ? "Сақталуда..." : "Есепті жіберу"}</button>
      </form>
    </section>
  );
}
