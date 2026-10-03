"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Send } from "lucide-react";
import { StatusPill } from "@/components/ui/ShyraqUI";

type Mentor = { id: string; full_name: string; email: string; phone: string; status: string };
type Message = { id: string; sender_id: string; recipient_id: string; body: string; read_at: string | null; created_at: string };

export function ChiefMentorMessagesManager({
  initialMentors,
  initialMentorId,
}: {
  initialMentors: Mentor[];
  initialMentorId: string | null;
}) {
  const [mentors] = useState(initialMentors);
  const [selected, setSelected] = useState(initialMentorId ?? initialMentors[0]?.id ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedMentor = useMemo(() => mentors.find((item) => item.id === selected), [mentors, selected]);

  const templates = [
    "Сәлем! Бүгінгі команданың есебін тексеріп, кешіккен оқушылар бойынша ақпарат беріңіз.",
    "Қатысу көрсеткіші төмендеп кетті. Бүгінгі оқушылардың қатысу жағдайын қарап шығыңыз.",
    "Жаңа тапсырмаларды тексеруді бүгін аяқтап, проблемалы тапсырма жұмысы болса хабарлаңыз.",
  ];

  useEffect(() => {
    if (!selected) return;

    let cancelled = false;

    void fetch("/api/chief-mentor/messages?mentorId=" + encodeURIComponent(selected), {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        return { ok: response.ok, messages: data.messages ?? [] };
      })
      .then((result) => {
        if (!cancelled && result.ok) setMessages(result.messages);
      })
      .catch(() => {
        if (!cancelled) setError("Хабарламаларды жүктеу мүмкін болмады.");
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  async function send() {
    if (!text.trim() || !selected) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/chief-mentor/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: selected, body: text }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error ?? "Жіберілмеді.");

      setText("");
      setMessages((current) => [...current, data.message]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Қате");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-[18px] border border-[#E8E1DA] bg-white">
        <div className="border-b border-[#EFE8E1] px-4 py-3">
          <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">МЕНТОРЛАР</p>
        </div>
        <div className="divide-y divide-[#EFE8E1]">
          {mentors.map((mentor) => (
            <button
              key={mentor.id}
              type="button"
              onClick={() => setSelected(mentor.id)}
              className={[
                "flex w-full items-center gap-3 px-4 py-3 text-left transition",
                selected === mentor.id ? "bg-[#FFF7EF]" : "hover:bg-[#FFFCF9]",
              ].join(" ")}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#172235] text-[9px] font-extrabold text-white">
                {mentor.full_name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase())
                  .join("")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10px] font-extrabold text-[#354153]">{mentor.full_name}</span>
                <span className="mt-0.5 block truncate text-[8px] text-[#9A9189]">{mentor.phone || mentor.email}</span>
              </span>
              <StatusPill tone={mentor.status === "ACTIVE" ? "green" : "red"}>{mentor.status}</StatusPill>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-[520px] flex-col rounded-[18px] border border-[#E8E1DA] bg-white">
        <div className="flex items-center gap-3 border-b border-[#EFE8E1] px-4 py-3">
          <Mail size={15} className="text-[var(--accent)]" />
          <div>
            <p className="text-[12px] font-extrabold text-[#172235]">{selectedMentor?.full_name ?? "Ментор таңдаңыз"}</p>
            <p className="text-[8px] text-[#9A9189]">Ішкі жеке чат</p>
          </div>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={[
                "max-w-[80%] rounded-[14px] px-3.5 py-3 text-[10px] leading-5",
                message.sender_id === selectedMentor?.id ? "mr-auto bg-[#F5F2EE] text-[#4F4740]" : "ml-auto bg-[#172235] text-white",
              ].join(" ")}
            >
              <p>{message.body}</p>
              <p className="mt-1 text-[8px] opacity-60">{new Date(message.created_at).toLocaleString("kk-KZ")}</p>
            </div>
          ))}
          {!messages.length ? <p className="py-16 text-center text-[10px] font-semibold text-[#9A9189]">Хабарлама жоқ.</p> : null}
        </div>

        <div className="border-t border-[#EFE8E1] p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {templates.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => setText(template)}
                className="rounded-[9px] border border-[#E8E1DA] bg-[#FFFCF9] px-2.5 py-1.5 text-[8px] font-extrabold text-[#6F665E]"
              >
                Дайын мәтін
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={2}
              placeholder="Хабарлама..."
              className="min-h-11 flex-1 resize-none rounded-[12px] border border-[#E8E1DA] bg-[#FFFCF9] p-3 text-[10px] font-semibold outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              disabled={loading || !selected}
              onClick={() => void send()}
              className="self-end rounded-[12px] bg-[var(--accent)] px-4 py-3 text-white disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </div>
          {error ? <p className="mt-2 text-[9px] font-semibold text-[#B54D2B]">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
