"use client";

import { FormEvent, useEffect, useState } from "react";
import { uiLabel } from "@/lib/ui-labels";

type Ticket = {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

const input = "mt-2 w-full rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] px-3.5 py-3 text-xs font-medium text-[#172235] outline-none focus:border-[#FF6F2C] focus:bg-white focus:ring-4 focus:ring-[#FF6F2C]/10";

export function SupportClient() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [category, setCategory] = useState("PASSWORD_RESET");
  const [subject, setSubject] = useState("Парольді қалпына келтіру");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const response = await fetch("/api/support");
    const data = await response.json().catch(() => ({}));
    if (response.ok) setTickets(data.tickets ?? []);
  }

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, message }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Өтініш жіберілмеді.");
      setMessage("");
      setNotice("Өтініш жіберілді. Жауапты платформа командасы қарайды.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Қате.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-7">
      <div className="rounded-[20px] border border-[#E8E1DA] bg-[#FFFCF9] p-4 sm:p-5">
        <h2 className="text-lg font-extrabold text-[#172235]">Қолдау қызметіне жазу</h2>
        <p className="mt-1 text-xs leading-5 text-[#8B8179]">Парольді қалпына келтіру үшін SMS/код қолданылмайды. Өтініш жіберілгеннен кейін оны жоба әзірлеушісі немесе қолдау қызметі қолмен өңдейді.</p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              if (event.target.value === "PASSWORD_RESET") setSubject("Парольді қалпына келтіру");
            }}
            className={input}
          >
            <option value="PASSWORD_RESET">Парольді қалпына келтіру</option>
            <option value="ACCOUNT">Аккаунт</option>
            <option value="TECHNICAL">Техникалық қате</option>
            <option value="OTHER">Басқа</option>
          </select>
          <input required value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Тақырып" className={input} />
          <textarea required minLength={5} rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Мәселені жазыңыз..." className={input} />
          {notice ? <div className="rounded-[14px] border border-[#E8E1DA] bg-white p-3 text-xs font-semibold text-[#5C5149]">{notice}</div> : null}
          <button disabled={loading} className="w-full rounded-[14px] bg-[#FF6F2C] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-50">{loading ? "Жіберілуде..." : "Өтініш жіберу"}</button>
        </form>
      </div>

      <div>
        <div className="flex items-center justify-between"><h3 className="text-sm font-extrabold text-[#172235]">Өтініштер тарихы</h3><span className="text-[10px] font-semibold text-[#9A9189]">{tickets.length}</span></div>
        <div className="mt-3 space-y-2.5">
          {!tickets.length ? <div className="rounded-[16px] bg-[#F6F2ED] p-4 text-xs font-semibold text-[#8B8179]">Әзірге өтініш жоқ.</div> : tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-[16px] border border-[#E8E1DA] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-extrabold text-[#172235]">{ticket.subject}</p><span className="rounded-full bg-[#FFF0E8] px-2.5 py-1 text-[9px] font-extrabold text-[#C85E2F]">{uiLabel(ticket.status)}</span></div>
              <p className="mt-2 text-xs leading-5 text-[#6F665E]">{ticket.message}</p>
              <p className="mt-3 text-[9px] font-semibold text-[#A19890]">{new Date(ticket.created_at).toLocaleString("kk-KZ")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
