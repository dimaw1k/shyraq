"use client";

import { useEffect, useState } from "react";

type Ticket = {
  id: string;
  student_id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  staff_note: string | null;
  created_at: string;
  updated_at: string;
  profiles: { full_name: string; phone: string; email: string } | null;
};

function statusLabel(status: string) {
  if (status === "NEW") return "Жаңа";
  if (status === "IN_PROGRESS") return "Қаралуда";
  if (status === "RESOLVED") return "Шешілді";
  return status;
}

export function ҚолдауTicketManager() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/leader/support", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.ok) setTickets(data.tickets ?? []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function update(id: string, status: string) {
    setLoading(id);
    try {
      const response = await fetch("/api/leader/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, staffNote: notes[id] ?? "" }),
      });
      if (response.ok) await load();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {!tickets.length ? (
        <div className="rounded-[16px] bg-[#F6F2ED] p-5 text-xs font-semibold text-[#8B8179]">Жаңа қолдау өтініштері жоқ.</div>
      ) : (
        tickets.map((ticket) => (
          <div key={ticket.id} className="rounded-[18px] border border-[#E8E1DA] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#FF8000]">{ticket.category}</p>
                <h3 className="mt-1 text-sm font-extrabold text-[#172235]">{ticket.subject}</h3>
                <p className="mt-1 text-[10px] font-semibold text-[#8B8179]">{ticket.profiles?.full_name ?? "Оқушы"} · {ticket.profiles?.phone ?? ""}</p>
              </div>
              <span className="rounded-full bg-[#FFF1E2] px-2.5 py-1 text-[9px] font-extrabold text-[#C85E2F]">{statusLabel(ticket.status)}</span>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-[#5C5149]">{ticket.message}</p>

            <textarea
              value={notes[ticket.id] ?? ticket.staff_note ?? ""}
              onChange={(event) => setNotes((current) => ({ ...current, [ticket.id]: event.target.value }))}
              rows={3}
              placeholder="Ішкі ескерту"
              className="mt-4 w-full rounded-[12px] border border-[#E8E1DA] bg-[#FFFCF9] p-3 text-xs outline-none focus:border-[#FF8000]"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button disabled={loading === ticket.id} onClick={() => void update(ticket.id, "IN_PROGRESS")} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-extrabold">Қаралуда</button>
              <button disabled={loading === ticket.id} onClick={() => void update(ticket.id, "RESOLVED")} className="rounded-[10px] bg-[#FF8000] px-3 py-2 text-[9px] font-extrabold text-white">Шешілді</button>
              <button disabled={loading === ticket.id} onClick={() => void update(ticket.id, "NEW")} className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-extrabold">Жаңа</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
