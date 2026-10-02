"use client";

import { useEffect, useState } from "react";
import { StaffSelectMenu } from "@/components/staff/StaffUI";

type Question = {
  id: string;
  marathon_day: number | null;
  question: string;
  field_key: string;
  field_type: string;
  required: boolean;
  sort_order: number;
  active: boolean;
};

function fieldTypeLabel(value: string) {
  if (value === "SHORT_TEXT") return "Қысқа мәтін";
  if (value === "NUMBER") return "Сан";
  return "Ұзын мәтін";
}

export function ReportQuestionManager() {
  const [items, setItems] = useState<Question[]>([]);
  const [question, setQuestion] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [day, setDay] = useState("");
  const [fieldType, setFieldType] = useState("LONG_TEXT");
  const [required, setRequired] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/chief-mentor/report-questions", { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.ok) setItems(data.questions ?? []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function create() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/chief-mentor/report-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          fieldKey,
          marathonDay: day ? Number(day) : null,
          fieldType,
          required,
          sortOrder: items.length,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Сұрақ сақталмады.");

      setQuestion("");
      setFieldKey("");
      setDay("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Қате.");
    } finally {
      setLoading(false);
    }
  }

  async function toggle(item: Question) {
    const response = await fetch("/api/chief-mentor/report-questions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    });
    if (response.ok) await load();
  }

  async function remove(id: string) {
    const response = await fetch("/api/chief-mentor/report-questions?id=" + id, { method: "DELETE" });
    if (response.ok) await load();
  }

  const input = "rounded-[11px] border border-[#E8E1DA] bg-white px-3 py-2.5 text-[10px] font-semibold outline-none focus:border-[#FF8000]";

  return (
    <section className="rounded-[20px] border border-[#E8E1DA] bg-white p-5">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#FF8000]">ЕСЕП СҰРАҚТАРЫ</p>
        <h2 className="mt-1 text-[16px] font-extrabold text-[#172235]">Есеп сұрақтары</h2>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-[1.4fr_1fr_100px_140px_auto]">
        <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Сұрақ мәтіні" className={input} />
        <input value={fieldKey} onChange={(event) => setFieldKey(event.target.value)} placeholder="Өріс кілті" className={input} />
        <input value={day} onChange={(event) => setDay(event.target.value)} type="number" min="1" max="21" placeholder="Күн" className={input} />
        <StaffSelectMenu
          value={fieldType}
          options={[
            { value: "LONG_TEXT", label: "Ұзын мәтін" },
            { value: "SHORT_TEXT", label: "Қысқа мәтін" },
            { value: "NUMBER", label: "Сан" },
          ]}
          onChange={setFieldType}
        />
        <button disabled={loading} onClick={() => void create()} className="rounded-[11px] bg-[#FF8000] px-4 py-2.5 text-[10px] font-extrabold text-white">
          {loading ? "..." : "Сұрақ қосу"}
        </button>
      </div>

      <label className="mt-3 inline-flex items-center gap-2 text-[10px] font-bold text-[#5B534C]">
        <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} />
        Міндетті сұрақ
      </label>

      {message ? <p className="mt-2 text-[9px] font-semibold text-[#B54D2B]">{message}</p> : null}

      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-2 rounded-[14px] border border-[#E8E1DA] bg-[#FFFCF9] p-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold text-[#172235]">{item.question}</p>
              <p className="mt-1 text-[9px] text-[#8B8179]">
                {item.marathon_day ? item.marathon_day + "-күн" : "Барлық күн"} · {item.field_key} · {fieldTypeLabel(item.field_type)} · {item.required ? "міндетті" : "міндетті емес"}
              </p>
            </div>
            <button type="button" onClick={() => void toggle(item)} className="rounded-[9px] border border-[#E8E1DA] bg-white px-2.5 py-1.5 text-[9px] font-extrabold">
              {item.active ? "Өшіру" : "Қосу"}
            </button>
            <button type="button" onClick={() => void remove(item.id)} className="rounded-[9px] border border-[#E8D3CB] px-2.5 py-1.5 text-[9px] font-extrabold text-[#B54D2B]">
              Өшіру
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
