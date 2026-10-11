"use client";

import { uiLabel } from "@/lib/ui-labels";
import { useEffect, useState } from "react";
import { StatusPill } from "@/components/ui/ShyraqUI";

type Ticket = {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  profiles: { full_name: string; phone: string; email: string } | null;
};

export function ChiefMentorSupportManager() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/chief-mentor/support", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        return { ok: response.ok, tickets: data.tickets ?? [] };
      })
      .then((result) => {
        if (!cancelled && result.ok) setTickets(result.tickets);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  async function update(id: string, status: string) {
    setLoading(id);

    try {
      const response = await fetch("/api/chief-mentor/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        const next = await fetch("/api/chief-mentor/support", { cache: "no-store" });
        const data = await next.json().catch(() => ({}));
        if (next.ok) setTickets(data.tickets ?? []);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {!tickets.length ? (
        <div className="rounded-[16px] bg-[#F6F2ED] p-6 text-center text-xs font-semibold text-[#8B8179]">
          Жаңа қолдау өтініштері жоқ.
        </div>
      ) : (
        tickets.map((ticket) => (
          <div key={ticket.id} className="rounded-[18px] border border-[#E8E1DA] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[var(--accent)]">{uiLabel(ticket.category)}</p>
                <p className="mt-1 text-sm font-extrabold text-[#172235]">{ticket.subject}</p>
                <p className="mt-1 text-[9px] text-[#8B8179]">
                  {ticket.profiles?.full_name ?? "Оқушы"} · {ticket.profiles?.phone ?? ""}
                </p>
              </div>
              <StatusPill tone={ticket.status === "RESOLVED" ? "green" : ticket.status === "IN_PROGRESS" ? "orange" : "red"}>
                {uiLabel(ticket.status)}
              </StatusPill>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-[#5C5149]">{ticket.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading === ticket.id}
                onClick={() => void update(ticket.id, "IN_PROGRESS")}
                className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-extrabold"
              >
                Қаралуда
              </button>
              <button
                type="button"
                disabled={loading === ticket.id}
                onClick={() => void update(ticket.id, "RESOLVED")}
                className="rounded-[10px] bg-[var(--accent)] px-3 py-2 text-[9px] font-extrabold text-white"
              >
                Шешілді
              </button>
              <button
                type="button"
                disabled={loading === ticket.id}
                onClick={() => void update(ticket.id, "NEW")}
                className="rounded-[10px] border border-[#E8E1DA] bg-white px-3 py-2 text-[9px] font-extrabold"
              >
                Жаңа
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
