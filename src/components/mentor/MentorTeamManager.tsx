"use client";

import { useState } from "react";
import { Search, UserPlus, RefreshCw, ArrowRight } from "lucide-react";
import { StatusPill } from "@/components/ui/ShyraqUI";

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
    setLoading(true); setMessage(""); setFound(null);
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
    <div className="grid gap-4 lg:grid-cols-[.72fr_1.28fr]">
      <section className="rounded-[20px] border border-[#E8E1DA] bg-[#FFFCF9] p-4 sm:p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">КОМАНДА</p>
        <h2 className="mt-1.5 text-[16px] font-extrabold text-[#172235]">Оқушы қосу</h2>
        <p className="mt-1.5 text-[11px] leading-5 text-[#766E66]">Телефон нөмірі арқылы тіркелген оқушыны тап.</p>

        <div className="mt-4 flex gap-2">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 700 000 00 00" className="min-w-0 flex-1 rounded-[13px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#FF6F2C] focus:ring-4 focus:ring-[#FF6F2C]/10" />
          <button type="button" disabled={loading} onClick={() => void search()} className="grid h-[40px] w-[42px] place-items-center rounded-[13px] bg-[#FF6F2C] text-white transition hover:bg-[#F26120] disabled:opacity-50" aria-label="Іздеу"><Search size={16} /></button>
        </div>

        {found ? (
          <div className="mt-3 rounded-[15px] border border-[#E8E1DA] bg-white p-3.5">
            <p className="text-[12px] font-extrabold text-[#172235]">{found.full_name}</p>
            <p className="mt-1 text-[10px] font-medium text-[#8B8179]">{found.phone} · {found.email}</p>
            <button type="button" onClick={() => void addStudent()} disabled={loading} className="mt-3 inline-flex items-center gap-1.5 rounded-[12px] bg-[#172235] px-3.5 py-2.5 text-[10px] font-extrabold text-white transition hover:bg-[#0F1826] disabled:opacity-50"><UserPlus size={13} /> Командаға қосу</button>
          </div>
        ) : null}

        {message ? <p className="mt-3 rounded-[13px] bg-white p-3 text-[10px] font-semibold leading-5 text-[#655B53]">{message}</p> : null}

        <button type="button" onClick={() => void syncMeet()} disabled={loading} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#E8E1DA] bg-white px-4 py-2.5 text-[10px] font-extrabold text-[#4C423A] transition hover:bg-[#F6F2ED] disabled:opacity-50"><RefreshCw size={13} /> Google Meet sync</button>
        <a href="/api/integrations/google/start" className="mt-3 block text-center text-[10px] font-extrabold text-[#FF6F2C]">Google аккаунтын қосу →</a>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">STUDENTS</p><h2 className="mt-1.5 text-[16px] font-extrabold text-[#172235]">Команда оқушылары</h2></div>
          <span className="text-[10px] font-semibold text-[#9A9189]">{students.length} оқушы</span>
        </div>

        <div className="mt-3 space-y-2.5">
          {students.map((student) => (
            <div key={student.id} className="rounded-[18px] border border-[#E8E1DA] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-[12px] font-extrabold text-[#172235]">{student.full_name}</p><p className="mt-1 truncate text-[10px] font-medium text-[#9A9189]">{student.phone} · {student.email}</p></div>
                <StatusPill>{student.status}</StatusPill>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  ["Ұпай", String(student.score)],
                  ["Reports", String(student.reportCount)],
                  ["Tasks", String(student.taskSubmittedCount)],
                  ["Meet", student.attendanceAverage.toFixed(1) + "%"],
                  ["Video", student.videoAverage.toFixed(0) + "%"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[12px] bg-[#FFFCF9] px-3 py-2.5"><p className="text-[9px] font-extrabold uppercase tracking-[.08em] text-[#A19890]">{label}</p><p className="mt-1 text-[13px] font-extrabold text-[#172235]">{value}</p></div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-[9px] font-semibold text-[#9A9189]"><span>Ашылған тесттер: {student.unlockedTests}</span><ArrowRight size={12} className="text-[#B4A9A0]" /></div>
            </div>
          ))}
          {!students.length ? <div className="rounded-[18px] border border-dashed border-[#DED6CE] px-6 py-10 text-center text-xs text-[#9A9189]">Командада әзірге оқушы жоқ.</div> : null}
        </div>
      </section>
    </div>
  );
}
