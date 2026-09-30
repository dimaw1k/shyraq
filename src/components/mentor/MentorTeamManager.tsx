"use client";

import { useState } from "react";

type Student = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  status: string;
  score: number;
  reportCount: number;
  taskSubmittedCount: number;
  attendanceAverage: number;
  videoAverage: number;
  unlockedTests: number;
};

export function MentorTeamManager({ teamId, students }: { teamId: string; students: Student[] }) {
  const [phone, setPhone] = useState("");
  const [found, setFound] = useState<Student | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    setMessage("");
    setFound(null);
    const response = await fetch("/api/mentor/students/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await response.json().catch(() => ({}));
    setFound(data.student ?? null);
    setMessage(response.ok ? (data.student ? "Оқушы табылды." : "Оқушы табылмады.") : (data.error ?? "Қате"));
    setLoading(false);
  }

  async function addStudent() {
    if (!found) return;
    setLoading(true);
    const response = await fetch("/api/mentor/students/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: found.id }),
    });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Оқушы командаға қосылды." : (data.error ?? "Қосу кезінде қате"));
    setLoading(false);
    if (response.ok) window.location.reload();
  }

  async function syncMeet() {
    setLoading(true);
    const response = await fetch("/api/mentor/meet/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId }),
    });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Meet sync: " + String(data.attendanceRows ?? 0) + " attendance rows." : (data.error ?? "Meet sync failed"));
    setLoading(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C25100]">TEAM</p>
        <h2 className="mt-1 text-sm font-semibold tracking-tight text-gray-900">Оқушы қосу</h2>
        <p className="mt-1 text-xs leading-5 text-gray-500">Тіркелген студентті телефон нөмірі арқылы іздеңіз.</p>

        <div className="mt-4 flex gap-2">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 700 000 00 00" className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-all duration-300 ease-in-out focus:border-[#C25100] focus:ring-4 focus:ring-[#C25100]/10" />
          <button type="button" disabled={loading} onClick={() => void search()} className="rounded-xl bg-[#C25100] px-3.5 py-2.5 text-xs font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50">Іздеу</button>
        </div>

        {found ? (
          <div className="mt-3 rounded-xl bg-[#FAFAFA] p-3.5">
            <p className="text-sm font-semibold text-gray-900">{found.full_name}</p>
            <p className="mt-1 text-xs text-gray-500">{found.phone} · {found.email}</p>
            <button type="button" onClick={() => void addStudent()} disabled={loading} className="mt-3 rounded-xl bg-[#C25100] px-3.5 py-2.5 text-xs font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50">Командаға қосу</button>
          </div>
        ) : null}

        {message ? <p className="mt-3 rounded-xl bg-[#FAFAFA] p-3 text-xs leading-5 text-gray-600">{message}</p> : null}

        <button type="button" onClick={() => void syncMeet()} disabled={loading} className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-50">
          Google Meet sync
        </button>
        <a href="/api/integrations/google/start" className="mt-2 block text-center text-xs font-semibold text-[#C25100] transition-colors duration-300 hover:text-[#9f4200]">
          Google аккаунтын қосу →
        </a>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C25100]">STUDENTS</p>
            <h2 className="mt-1 text-sm font-semibold tracking-tight text-gray-900">Команда оқушылары</h2>
          </div>
          <span className="text-xs text-gray-400">{students.length} оқушы</span>
        </div>

        <div className="mt-4 space-y-2">
          {students.map((student) => (
            <div key={student.id} className="rounded-xl bg-[#FAFAFA] p-3.5 transition-all duration-300 ease-in-out hover:bg-white hover:shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{student.full_name}</p>
                  <p className="mt-1 truncate text-xs text-gray-500">{student.phone} · {student.email}</p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-gray-400">{student.status}</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  ["Ұпай", String(student.score)],
                  ["Reports", String(student.reportCount)],
                  ["Tasks", String(student.taskSubmittedCount)],
                  ["Meet", student.attendanceAverage.toFixed(1) + "%"],
                  ["Video", student.videoAverage.toFixed(0) + "%"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-white px-2.5 py-2 shadow-soft">
                    <p className="text-[10px] text-gray-400">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-gray-400">Ашылған тесттер: {student.unlockedTests}</p>
            </div>
          ))}
          {!students.length ? <p className="py-8 text-center text-sm text-gray-500">Командада әзірге оқушы жоқ.</p> : null}
        </div>
      </section>
    </div>
  );
}
