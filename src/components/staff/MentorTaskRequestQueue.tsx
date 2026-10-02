"use client";

import { useEffect, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { Card, StatusPill } from "@/components/ui/ShyraqUI";

type RequestRow = {
  id: string;
  mentor_id: string;
  team_id: string;
  mentor_name: string;
  team_name: string;
  title: string;
  description: string;
  instructions: string | null;
  starts_at: string | null;
  deadline: string | null;
  points: number;
  attachment_required: boolean;
  max_files: number;
  late_points_percent: number;
  marathon_day: number | null;
  task_order: number;
  status: string;
  created_at: string;
};

export function MentorTaskRequestQueue() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/staff/task-requests", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Сұраныстарды жүктеу сәтсіз аяқталды.");
      setRequests(data.requests ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Қате");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    setActionId(id);
    setError("");
    try {
      const response = await fetch("/api/staff/task-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, status, reviewComment: comments[id] ?? "" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error ?? "Сұранысты өңдеу сәтсіз аяқталды.");
      setRequests((current) => current.filter((item) => item.id !== id));
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Қате");
    } finally {
      setActionId(null);
    }
  }

  if (loading) return <Card className="p-4 text-[10px] font-semibold text-[#8F857D]">Жүктелуде...</Card>;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#EEE8E1] px-4 py-3.5">
        <div>
          <p className="text-[13px] font-extrabold text-[#172235]">Ментор сұраныстары</p>
          <p className="mt-0.5 text-[9px] font-semibold text-[#9A9189]">Тапсырманы бекіту</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 text-[9px] font-extrabold text-[#FF8000]"><RefreshCw size={12} /> Жаңарту</button>
      </div>
      {error ? <p className="border-b border-[#EEE8E1] px-4 py-3 text-[9px] font-semibold text-[#B54D2B]">{error}</p> : null}
      <div className="divide-y divide-[#F0EBE5]">
        {!requests.length ? <div className="p-6 text-center text-[10px] font-extrabold text-[#3F3832]">Жаңа сұраныс жоқ</div> : requests.map((item) => (
          <div key={item.id} className="p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#FF8000]"><ClipboardCheckIcon /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-extrabold text-[#263247]">{item.title}</p>
                  <StatusPill tone="orange">Күтуде</StatusPill>
                </div>
                <p className="mt-1 text-[9px] text-[#8F857D]">{item.mentor_name} · {item.team_name} · {item.points} ұпай</p>
                <p className="mt-2 text-[9px] leading-5 text-[#5F5750]">{item.description}</p>
                {item.deadline ? <p className="mt-1 text-[8px] font-semibold text-[#9A9189]">Дедлайн: {new Date(item.deadline).toLocaleString("kk-KZ")}</p> : null}
              </div>
            </div>
            <textarea
              value={comments[item.id] ?? ""}
              onChange={(event) => setComments((current) => ({ ...current, [item.id]: event.target.value }))}
              rows={2}
              placeholder="Комментарий"
              className="mt-3 w-full rounded-[10px] border border-[var(--border)] bg-white px-3 py-2 text-[9px] font-semibold outline-none focus:border-[var(--accent)]"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button type="button" onClick={() => void review(item.id, "REJECTED")} disabled={actionId === item.id} className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] border border-[#E9D8CF] bg-white px-3 py-1.5 text-[9px] font-extrabold text-[#B54D2B] disabled:opacity-50"><X size={11} /> Қайтару</button>
              <button type="button" onClick={() => void review(item.id, "APPROVED")} disabled={actionId === item.id} className="inline-flex min-h-8 items-center gap-1.5 rounded-[10px] bg-[#FF8000] px-3 py-1.5 text-[9px] font-extrabold text-white disabled:opacity-50"><Check size={11} /> Бекіту</button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ClipboardCheckIcon() {
  return <span className="text-[13px]">✓</span>;
}
