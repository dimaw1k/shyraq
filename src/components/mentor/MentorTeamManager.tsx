"use client";

import { useState } from "react";

type Student = { id: string; full_name: string; phone: string; email: string; status: string };

export function MentorTeamManager({ teamId, students }: { teamId: string; students: Student[] }) {
  const [phone, setPhone] = useState("");
  const [found, setFound] = useState<Student | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    setMessage("");
    setFound(null);
    const response = await fetch("/api/mentor/students/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
    const data = await response.json().catch(() => ({}));
    setFound(data.student ?? null);
    setMessage(response.ok ? (data.student ? "Оқушы табылды." : "Оқушы табылмады.") : (data.error ?? "Қате"));
    setLoading(false);
  }

  async function addStudent() {
    if (!found) return;
    setLoading(true);
    const response = await fetch("/api/mentor/students/add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: found.id }) });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Оқушы командаға қосылды." : (data.error ?? "Қосу кезінде қате"));
    setLoading(false);
    if (response.ok) window.location.reload();
  }

  async function syncMeet() {
    setLoading(true);
    const response = await fetch("/api/mentor/meet/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamId }) });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Meet sync: " + String(data.attendanceRows ?? 0) + " attendance rows." : (data.error ?? "Meet sync failed"));
    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-xl font-semibold">Оқушы қосу</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Студент тіркелген телефон нөмірін енгізіңіз.</p>
        <div className="mt-5 flex gap-2">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 700 000 00 00" className="min-w-0 flex-1 rounded-xl border border-[var(--border)] px-4 py-3" />
          <button type="button" disabled={loading} onClick={search} className="rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white">Іздеу</button>
        </div>
        {found ? <div className="mt-5 rounded-xl bg-zinc-50 p-4"><p className="font-semibold">{found.full_name}</p><p className="mt-1 text-sm text-[var(--muted)]">{found.phone} · {found.email}</p><button type="button" onClick={addStudent} disabled={loading} className="mt-4 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Командаға қосу</button></div> : null}
        {message ? <p className="mt-4 text-sm text-[var(--muted)]">{message}</p> : null}
        <button type="button" onClick={syncMeet} disabled={loading} className="mt-6 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold">Google Meet sync</button>
        <a href="/api/integrations/google/start" className="mt-3 block text-center text-sm font-semibold text-[var(--accent)]">Google аккаунтын қосу →</a>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-xl font-semibold">Команда оқушылары</h2>
        <div className="mt-5 space-y-3">
          {students.map((student) => (
            <div key={student.id} className="rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-center justify-between gap-4"><p className="font-medium">{student.full_name}</p><span className="text-xs text-[var(--muted)]">{student.status}</span></div>
              <p className="mt-1 text-sm text-[var(--muted)]">{student.phone} · {student.email}</p>
            </div>
          ))}
          {!students.length ? <p className="text-sm text-[var(--muted)]">Командада әзірге оқушы жоқ.</p> : null}
        </div>
      </section>
    </div>
  );
}
